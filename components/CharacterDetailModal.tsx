import React, { useState, useEffect, useMemo } from 'react';
import { CharacterFull, CharacterIndex } from '../types';
import { Icon } from './Icon';
import { getCharacter, getAllCharacters } from '../services/characterService';
import { CharacterCard } from './CharacterCard';

interface CharacterDetailModalProps {
  characterName: string;
  isSelected: boolean;
  isLocked?: boolean;
  onClose: () => void;
  onSelectCharacter: (name: string) => void;
  onToggleRole: (name: string) => void;
  onToggleLock?: (name: string) => void;
  onNavigateToCharacter: (name: string) => void;
  onShowKeyword?: (keyword: string) => void;
  onAddRoles?: (roles: string[]) => void;
}

const getTeamColorClasses = (team: string) => {
  switch (team) {
    case 'red':
      return 'bg-red-500/20 border-red-500 text-red-400';
    case 'blue':
      return 'bg-blue-500/20 border-blue-500 text-blue-400';
    case 'red-blue':
      return 'bg-gradient-to-r from-red-500/20 to-blue-500/20 border-l-red-500 border-r-blue-500 border-t-red-500 border-b-blue-500 text-red-400';
    case 'grey':
      return 'bg-zinc-500/20 border-zinc-500 text-zinc-400';
    case 'green':
      return 'bg-green-500/20 border-green-500 text-green-400';
    case 'yellow':
      return 'bg-yellow-500/20 border-yellow-500 text-yellow-400';
    case 'special':
      return 'bg-pink-500/20 border-pink-500 text-pink-400';
    default:
      return 'bg-zinc-800/20 border-zinc-700 text-zinc-400';
  }
};

const extractKeywords = (text: string): string[] => {
  const keywords = ['dead', 'card share', 'color share', 'bury', 'contagious', 'foolish', 'cultist', 'zombie', 'in love', 'in hate', 'traitor', 'immune', 'fireproof', 'firebomb', 'impregnated', 'toast', 'shy', 'cleanse'];
  const found: string[] = [];
  keywords.forEach(keyword => {
    if (text.toLowerCase().includes(keyword.toLowerCase())) {
      found.push(keyword);
    }
  });
  return found;
};

const renderTextWithKeywords = (text: string, onKeywordClick?: (keyword: string) => void) => {
  if (!onKeywordClick) return text;
  
  const keywords = extractKeywords(text);
  if (keywords.length === 0) return text;
  
  let result: React.ReactNode[] = [];
  let lastIndex = 0;
  const lowerText = text.toLowerCase();
  
  keywords.forEach(keyword => {
    const index = lowerText.indexOf(keyword.toLowerCase(), lastIndex);
    if (index !== -1) {
      if (index > lastIndex) {
        result.push(text.substring(lastIndex, index));
      }
      result.push(
        <button
          key={`${keyword}-${index}`}
          onClick={() => onKeywordClick(keyword)}
          className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300"
        >
          {text.substring(index, index + keyword.length)}
        </button>
      );
      lastIndex = index + keyword.length;
    }
  });
  
  if (lastIndex < text.length) {
    result.push(text.substring(lastIndex));
  }
  
  return result.length > 0 ? result : text;
};

export const CharacterDetailModal: React.FC<CharacterDetailModalProps> = ({
  characterName,
  isSelected,
  isLocked = false,
  onClose,
  onSelectCharacter,
  onToggleRole,
  onToggleLock,
  onNavigateToCharacter,
  onShowKeyword,
  onAddRoles
}) => {
  const [character, setCharacter] = useState<CharacterFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expandedPowers, setExpandedPowers] = useState<Set<number>>(new Set());
  const allCharacters = getAllCharacters();
  const validCharacterNames = useMemo(() => new Set(allCharacters.map(c => c.name)), [allCharacters]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    getCharacter(characterName)
      .then(char => {
        if (cancelled) return;
        setCharacter(char);
        if (!char) {
          setLoadError('Character not found.');
        }
      })
      .catch((e) => {
        if (cancelled) return;
        console.error('Failed to load character:', e);
        setCharacter(null);
        setLoadError('Failed to load character.');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [characterName]);

  // Get current character's CharacterIndex data
  const currentCharacterIndex = useMemo(() => {
    return allCharacters.find(c => c.name === characterName);
  }, [characterName, allCharacters]);

  // Get character data for required roles, with current character at the top
  const requiredCharacters = useMemo(() => {
    const required: CharacterIndex[] = [];
    
    // Add current character at the top if it exists
    if (currentCharacterIndex) {
      required.push(currentCharacterIndex);
    }
    
    // Add other required characters
    if (character?.requires) {
      const others = character.requires
        .map(reqName => allCharacters.find(c => c.name === reqName))
        .filter((c): c is CharacterIndex => c !== undefined && c.name !== characterName);
      required.push(...others);
    }
    
    return required;
  }, [character?.requires, allCharacters, currentCharacterIndex, characterName]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
          <div className="text-zinc-400">Loading...</div>
        </div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-xl font-bold text-zinc-100">Unable to open</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              <Icon name="close" size={20} />
            </button>
          </div>
          <p className="text-zinc-300 leading-relaxed">
            {loadError || 'This character could not be loaded.'}
          </p>
          <div className="mt-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const teamColorClasses = getTeamColorClasses(character.team);
  const togglePower = (index: number) => {
    setExpandedPowers(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto my-4 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              {character.team && (
                <div className={`px-3 py-1 rounded-lg border ${teamColorClasses} font-semibold text-sm`}>
                  {character.team.toUpperCase()}
                </div>
              )}
              <h2 className="text-2xl font-bold text-zinc-100">{character.name || 'Unknown Character'}</h2>
            </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <Icon name="close" size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Add/Remove Role Button and Lock Button */}
          <div className="flex gap-3">
            <button
              onClick={() => onToggleRole(character.name)}
              className={`
                flex-1 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2
                transition-all active:scale-95
                ${isSelected 
                  ? 'bg-rose-500/20 border-2 border-rose-500 text-rose-400 hover:bg-rose-500/30' 
                  : 'bg-cyan-500/20 border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500/30'
                }
              `}
            >
              <Icon name={isSelected ? "minus" : "plus"} size={20} />
              {isSelected ? 'Remove from Game' : 'Add to Game'}
            </button>
            {onToggleLock && (
              <button
                onClick={() => onToggleLock(character.name)}
                className={`
                  px-4 py-4 rounded-2xl font-bold text-lg flex items-center justify-center
                  transition-all active:scale-95
                  ${isLocked
                    ? 'bg-cyan-500/20 border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500/30'
                    : 'bg-zinc-800/50 border-2 border-zinc-700 text-zinc-400 hover:bg-zinc-700/50'
                  }
                `}
                title={isLocked ? 'Unlock for Generator' : 'Lock for Generator'}
              >
                <Icon name={isLocked ? "lock" : "unlock"} size={20} />
              </button>
            )}
          </div>

          {/* Win Condition */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-2">Win Condition</h3>
            <p className="text-zinc-200 leading-relaxed">
              {renderTextWithKeywords(character.winCondition, onShowKeyword)}
            </p>
          </div>

          {/* Powers */}
          {character.powers && character.powers.length > 0 && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-3">Powers</h3>
              <div className="space-y-2">
                {character.powers.map((power, index) => {
                  if (!power || !power.name) return null;
                  return (
                  <div
                    key={index}
                    className="bg-zinc-800/50 border border-zinc-700 rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => togglePower(index)}
                      className="w-full p-3 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-2">
                        {power.type && (
                          <span className="px-2 py-1 bg-zinc-700 rounded text-xs font-semibold text-zinc-300">
                            {power.type.toUpperCase()}
                          </span>
                        )}
                        <span className="font-semibold text-zinc-100">{power.name || 'Unnamed Power'}</span>
                      </div>
                      <Icon 
                        name={expandedPowers.has(index) ? "right" : "right"} 
                        size={16} 
                        className={`text-zinc-400 transition-transform ${expandedPowers.has(index) ? 'rotate-90' : ''}`}
                      />
                    </button>
                    {expandedPowers.has(index) && power.description && (
                      <div className="p-3 pt-0 border-t border-zinc-700">
                        <p className="text-zinc-300 text-sm leading-relaxed">
                          {renderTextWithKeywords(power.description, onShowKeyword)}
                        </p>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tags */}
          {character.tags && character.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {character.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-zinc-800 rounded-lg text-sm text-zinc-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Requires */}
          {character.requires && character.requires.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Requires</h3>
                {onAddRoles && (
                  <button
                    onClick={() => onAddRoles(requiredCharacters.map(c => c.name))}
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    (adds all)
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {requiredCharacters.map((reqChar) => {
                  const isCurrent = reqChar.name === characterName;
                  return (
                    <CharacterCard
                      key={reqChar.name}
                      character={reqChar}
                      isSelected={false}
                      onTap={() => onNavigateToCharacter(reqChar.name)}
                      onLongPress={() => onNavigateToCharacter(reqChar.name)}
                      compact={true}
                      showSelectionIndicator={false}
                      disabled={isCurrent}
                      darkened={isCurrent}
                      titleSuffix={isCurrent ? '(this)' : undefined}
                      showRequires={false}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Works Well With */}
          {character.worksWellWith && character.worksWellWith.length > 0 && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-2">Works Well With</h3>
              <div className="flex flex-wrap gap-2">
                {character.worksWellWith.map((name, index) => {
                  const isCharacter = validCharacterNames.has(name);
                  return isCharacter ? (
                    <button
                      key={index}
                      onClick={() => onNavigateToCharacter(name)}
                      className="px-3 py-1 bg-green-500/20 border border-green-500 rounded-lg text-sm text-green-400 hover:bg-green-500/30 transition-colors"
                    >
                      {name}
                    </button>
                  ) : (
                    <span
                      key={index}
                      className="px-3 py-1 bg-zinc-800/60 border border-zinc-700 rounded-lg text-sm text-zinc-300"
                      title="Not a character"
                    >
                      {name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Doesn't Work Well With */}
          {character.doesntWorkWellWith && character.doesntWorkWellWith.length > 0 && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-2">Doesn't Work Well With</h3>
              <div className="flex flex-wrap gap-2">
                {character.doesntWorkWellWith.map((name, index) => {
                  const isCharacter = validCharacterNames.has(name);
                  return isCharacter ? (
                    <button
                      key={index}
                      onClick={() => onNavigateToCharacter(name)}
                      className="px-3 py-1 bg-rose-500/20 border border-rose-500 rounded-lg text-sm text-rose-400 hover:bg-rose-500/30 transition-colors"
                    >
                      {name}
                    </button>
                  ) : (
                    <span
                      key={index}
                      className="px-3 py-1 bg-zinc-800/60 border border-zinc-700 rounded-lg text-sm text-zinc-300"
                      title="Not a character"
                    >
                      {name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          {character.notes && character.notes.length > 0 && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-2">Notes</h3>
              <div className="space-y-2">
                {character.notes.map((note, index) => (
                  <p key={index} className="text-zinc-300 text-sm leading-relaxed">
                    {renderTextWithKeywords(note, onShowKeyword)}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
