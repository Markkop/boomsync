import React, { useState, useEffect, useMemo } from 'react';
import { CharacterFull, CharacterIndex } from '../types';
import { Icon } from './Icon';
import { getCharacter, getAllCharacters } from '../services/characterService';
import { CharacterCard } from './CharacterCard';
import { useLocale, useT } from '../i18n/I18nContext';
import { getTeamLabel } from '../utils/teamColors';
import {
  formatTagLabel,
  getKeywordMatchTerms,
  getRoleNameMatchTerms,
  isWinConditionPhrase,
  translateCharacter,
  translatePowerType,
  translateRelationLabel,
} from '../i18n/display';
import { KEYWORD_KEYS } from '../i18n/keywords';

interface CharacterDetailModalProps {
  characterName: string;
  isSelected: boolean;
  isLocked?: boolean;
  onClose: () => void;
  onSelectCharacter: (name: string) => void;
  onToggleRole: (name: string) => void;
  onToggleLock?: (name: string) => void;
  onNavigateToCharacter: (name: string) => void;
  onShowCharacterPeek?: (name: string, position: { x: number; y: number }) => void;
  onShowKeyword?: (keyword: string, position: { x: number; y: number }) => void;
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

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isWrappedInQuotes = (text: string, start: number, end: number) => {
  if (start <= 0 || end >= text.length) return false;
  const before = text[start - 1];
  const after = text[end];
  return (before === '"' && after === '"') || (before === "'" && after === "'");
};

const getTeamTextClasses = (team: string) => {
  switch (team) {
    case 'blue':
      return 'text-blue-400 hover:text-blue-300';
    case 'red':
      return 'text-red-400 hover:text-red-300';
    case 'red-blue':
      return 'bg-gradient-to-r from-red-400 to-blue-400 bg-clip-text text-transparent hover:from-red-300 hover:to-blue-300';
    case 'green':
      return 'text-green-400 hover:text-green-300';
    case 'yellow':
      return 'text-yellow-400 hover:text-yellow-300';
    case 'special':
      return 'text-pink-400 hover:text-pink-300';
    case 'grey':
    default:
      return 'text-zinc-300 hover:text-zinc-200';
  }
};

const getMechanicIcon = (keywordLower: string): React.ComponentProps<typeof Icon>['name'] | null => {
  // Map common mechanics/keywords to existing tag icons
  if (keywordLower.includes('card share')) return 'share';
  if (keywordLower.includes('color share')) return 'palette';
  if (keywordLower.includes('public reveal')) return 'megaphone';
  if (keywordLower.includes('private reveal')) return 'eye';
  if (keywordLower.includes('bury')) return 'archive';
  if (keywordLower.includes('contagious')) return 'virus';
  if (keywordLower.includes('acting')) return 'theater';
  if (keywordLower.includes('condition')) return 'sparkles';
  if (keywordLower.includes('pause')) return 'clock';
  if (keywordLower.includes('odd')) return 'hash';
  return null;
};

const getPowerTypeIcon = (powerType: string): React.ComponentProps<typeof Icon>['name'] | null => {
  const typeLower = powerType.toLowerCase();
  if (typeLower.includes('card share')) return 'share';
  if (typeLower.includes('color share')) return 'palette';
  if (typeLower.includes('public reveal')) return 'megaphone';
  if (typeLower.includes('private reveal')) return 'eye';
  if (typeLower.includes('bury')) return 'archive';
  if (typeLower.includes('contagious')) return 'virus';
  if (typeLower.includes('acting')) return 'theater';
  if (typeLower.includes('condition')) return 'sparkles';
  if (typeLower.includes('pause')) return 'clock';
  if (typeLower.includes('odd')) return 'hash';
  return null;
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
  onShowCharacterPeek,
  onShowKeyword,
  onAddRoles
}) => {
  const t = useT();
  const locale = useLocale();
  const [character, setCharacter] = useState<CharacterFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const allCharacters = getAllCharacters();
  const validCharacterNames = useMemo(() => new Set(allCharacters.map(c => c.name)), [allCharacters]);
  const characterTeamByName = useMemo(() => {
    const map = new Map<string, string>();
    allCharacters.forEach((c) => map.set(c.name, c.team));
    return map;
  }, [allCharacters]);
  const displayCharacter = useMemo(
    () => (character ? translateCharacter(locale, character) : null),
    [character, locale]
  );

  const keywordSet = useMemo(() => new Set(KEYWORD_KEYS), []);
  const lowerToCharacterName = useMemo(() => {
    const map = new Map<string, string>();
    getRoleNameMatchTerms(locale).forEach(({ term, englishName }) => {
      map.set(term.toLowerCase(), englishName);
    });
    return map;
  }, [locale]);
  const lowerToKeyword = useMemo(() => {
    const map = new Map<string, string>();
    getKeywordMatchTerms(locale).forEach(({ term, englishKey }) => {
      map.set(term.toLowerCase(), englishKey);
    });
    return map;
  }, [locale]);

  const interactiveTextRegex = useMemo(() => {
    const repByLower = new Map<string, string>();
    lowerToCharacterName.forEach((english, lower) => {
      if (!repByLower.has(lower)) {
        // Prefer the original casing of the matched term from the map key... we need the display term.
        // Use english name as representative; the regex is case-insensitive.
        repByLower.set(lower, english);
      }
    });
    getRoleNameMatchTerms(locale).forEach(({ term }) => {
      const lower = term.toLowerCase();
      if (!repByLower.has(lower)) repByLower.set(lower, term);
      else repByLower.set(lower, term);
    });
    getKeywordMatchTerms(locale).forEach(({ term, englishKey }) => {
      const lower = term.toLowerCase();
      if (!repByLower.has(lower)) repByLower.set(lower, term);
    });

    const reps = Array.from(new Set(Array.from(repByLower.values()))).sort((a, b) => b.length - a.length);
    if (reps.length === 0) return /(?!)/;
    const alternation = reps.map(escapeRegExp).join('|');
    return new RegExp(`(^|[^A-Za-z0-9À-ÿ])(${alternation})(?=[^A-Za-z0-9À-ÿ]|$)`, 'gi');
  }, [locale, lowerToCharacterName]);

  const renderInteractiveText = (text: string) => {
    if (!onShowKeyword && !onNavigateToCharacter) return text;
    if (!text) return text;

    interactiveTextRegex.lastIndex = 0;
    const result: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = interactiveTextRegex.exec(text)) !== null) {
      const fullStart = match.index;
      const boundary = match[1] ?? '';
      const term = match[2] ?? '';

      const termStart = fullStart + boundary.length;
      const termEnd = termStart + term.length;

      if (fullStart > lastIndex) {
        result.push(text.slice(lastIndex, fullStart));
      }
      if (boundary) {
        result.push(boundary);
      }

      const lower = term.toLowerCase();
      const canonicalCharacter = lowerToCharacterName.get(lower);
      const englishKeyword = lowerToKeyword.get(lower);
      const isCharacter = Boolean(canonicalCharacter);
      const isKeyword = Boolean(englishKeyword);
      const ambiguous = isCharacter && isKeyword;
      
      const isWinConditionContext = (lower === 'condition' || lower === 'condição' || lower === 'condición') && isWinConditionPhrase(text, termStart, termEnd);

      const shouldShowKeyword =
        Boolean(onShowKeyword) &&
        isKeyword &&
        (!ambiguous || isWrappedInQuotes(text, termStart, termEnd)) &&
        !isWinConditionContext;

      if (shouldShowKeyword && onShowKeyword) {
        const iconName = getMechanicIcon(lower);
        result.push(
          <button
            key={`kw-${lower}-${termStart}`}
            type="button"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              onShowKeyword(englishKeyword!, { x: rect.left + rect.width / 2, y: rect.bottom });
            }}
            className="inline-flex items-center gap-1 text-cyan-400 underline underline-offset-2 hover:text-cyan-300"
          >
            {iconName && <Icon name={iconName} size={14} className="flex-shrink-0" />}
            <span>{term}</span>
          </button>
        );
      } else if (isCharacter && canonicalCharacter) {
        const team = characterTeamByName.get(canonicalCharacter) ?? 'grey';
        const teamClasses = getTeamTextClasses(team);
        result.push(
          <button
            key={`ch-${canonicalCharacter}-${termStart}`}
            type="button"
            onClick={(e) => {
              if (onShowCharacterPeek) {
                const rect = e.currentTarget.getBoundingClientRect();
                onShowCharacterPeek(canonicalCharacter, { x: rect.left + rect.width / 2, y: rect.bottom });
              } else {
                onNavigateToCharacter(canonicalCharacter);
              }
            }}
            className={`underline underline-offset-2 ${teamClasses}`}
          >
            {term}
          </button>
        );
      } else {
        result.push(term);
      }

      lastIndex = termEnd;
    }

    if (lastIndex < text.length) {
      result.push(text.slice(lastIndex));
    }

    return result.length > 0 ? result : text;
  };

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
          <div className="text-zinc-400">{t('character.loading')}</div>
        </div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-xl font-bold text-zinc-100">{t('character.unableToOpen')}</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              <Icon name="close" size={20} />
            </button>
          </div>
          <p className="text-zinc-300 leading-relaxed">
            {loadError || t('character.couldNotLoad')}
          </p>
          <div className="mt-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors font-semibold"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const teamColorClasses = getTeamColorClasses(character.team);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto my-4 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              {character.team && (
                <div className={`px-3 py-1 rounded-lg border ${teamColorClasses} font-semibold text-sm`}>
                  {getTeamLabel(character.team, locale)}
                </div>
              )}
              <h2 className="text-2xl font-bold text-zinc-100">{displayCharacter?.name || character.name || t('character.unknown')}</h2>
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
              onClick={() => onToggleRole(characterName)}
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
              {isSelected ? t('character.removeFromGame') : t('character.addToGame')}
            </button>
            {onToggleLock && (
              <button
                onClick={() => onToggleLock(characterName)}
                className={`
                  px-4 py-4 rounded-2xl font-bold text-lg flex items-center justify-center
                  transition-all active:scale-95
                  ${isLocked
                    ? 'bg-cyan-500/20 border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500/30'
                    : 'bg-zinc-800/50 border-2 border-zinc-700 text-zinc-400 hover:bg-zinc-700/50'
                  }
                `}
                title={isLocked ? t('character.unlockForGenerator') : t('character.lockForGenerator')}
              >
                <Icon name={isLocked ? "lock" : "unlock"} size={20} />
              </button>
            )}
          </div>

          {/* Win Condition */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-2">{t('character.winCondition')}</h3>
            <p className="text-zinc-200 leading-relaxed">
              {renderInteractiveText(displayCharacter?.winCondition || character.winCondition)}
            </p>
          </div>

          {/* Powers */}
          {character.powers && character.powers.length > 0 && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-3">{t('character.powers')}</h3>
              <div className="space-y-2">
                {(displayCharacter?.powers ?? character.powers).map((power, index) => {
                  const englishType = character.powers[index]?.type || power.type;
                  if (!power || !power.name) return null;
                  const powerTypeIcon = englishType ? getPowerTypeIcon(englishType) : null;
                  const powerTypeLower = englishType ? englishType.toLowerCase() : '';
                  const isPowerTypeKeyword = englishType && keywordSet.has(powerTypeLower);
                  const canShowKeyword = isPowerTypeKeyword && Boolean(onShowKeyword);
                  
                  const PowerTypeBadge = canShowKeyword ? 'button' : 'span';
                  const powerTypeProps = canShowKeyword ? {
                    onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      onShowKeyword!(powerTypeLower, { x: rect.left + rect.width / 2, y: rect.bottom });
                    },
                    className: "px-2 py-1 bg-zinc-700 rounded text-xs font-semibold text-zinc-300 flex items-center gap-1 hover:bg-zinc-600 transition-colors cursor-pointer"
                  } : {
                    className: "px-2 py-1 bg-zinc-700 rounded text-xs font-semibold text-zinc-300 flex items-center gap-1"
                  };
                  
                  return (
                  <div
                    key={index}
                    className="bg-zinc-800/50 border border-zinc-700 rounded-xl overflow-hidden"
                  >
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        {englishType && (
                          <PowerTypeBadge {...powerTypeProps}>
                            {powerTypeIcon && <Icon name={powerTypeIcon} size={12} className="flex-shrink-0" />}
                            {translatePowerType(locale, englishType).toUpperCase()}
                          </PowerTypeBadge>
                        )}
                        <span className="font-semibold text-zinc-100">{power.name || t('character.unnamedPower')}</span>
                      </div>
                      {power.description && (
                        <div className="pt-2 border-t border-zinc-700">
                          <p className="text-zinc-300 text-sm leading-relaxed">
                            {renderInteractiveText(power.description)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tags */}
          {character.tags && character.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-2">{t('character.tags')}</h3>
              <div className="flex flex-wrap gap-2">
                {character.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-zinc-800 rounded-lg text-sm text-zinc-300"
                  >
                    {formatTagLabel(locale, tag)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Requires */}
          {character.requires && character.requires.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">{t('character.requires')}</h3>
                {onAddRoles && (
                  <button
                    onClick={() => onAddRoles(requiredCharacters.map(c => c.name))}
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    {t('character.addsAll')}
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
                      titleSuffix={isCurrent ? t('character.thisSuffix') : undefined}
                      onTagClick={onShowKeyword}
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
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-2">{t('character.worksWellWith')}</h3>
              <div className="flex flex-wrap gap-2">
                {character.worksWellWith.map((name, index) => {
                  const isCharacter = validCharacterNames.has(name);
                  return isCharacter ? (
                    <button
                      key={index}
                      onClick={() => onNavigateToCharacter(name)}
                      className="px-3 py-1 bg-green-500/20 border border-green-500 rounded-lg text-sm text-green-400 hover:bg-green-500/30 transition-colors"
                    >
                      {translateRelationLabel(locale, name)}
                    </button>
                  ) : (
                    <span
                      key={index}
                      className="px-3 py-1 bg-zinc-800/60 border border-zinc-700 rounded-lg text-sm text-zinc-300"
                      title={t('character.notACharacter')}
                    >
                      {translateRelationLabel(locale, name)}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Doesn't Work Well With */}
          {character.doesntWorkWellWith && character.doesntWorkWellWith.length > 0 && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-2">{t('character.doesntWorkWellWith')}</h3>
              <div className="flex flex-wrap gap-2">
                {character.doesntWorkWellWith.map((name, index) => {
                  const isCharacter = validCharacterNames.has(name);
                  return isCharacter ? (
                    <button
                      key={index}
                      onClick={() => onNavigateToCharacter(name)}
                      className="px-3 py-1 bg-rose-500/20 border border-rose-500 rounded-lg text-sm text-rose-400 hover:bg-rose-500/30 transition-colors"
                    >
                      {translateRelationLabel(locale, name)}
                    </button>
                  ) : (
                    <span
                      key={index}
                      className="px-3 py-1 bg-zinc-800/60 border border-zinc-700 rounded-lg text-sm text-zinc-300"
                      title={t('character.notACharacter')}
                    >
                      {translateRelationLabel(locale, name)}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          {(displayCharacter?.notes ?? character.notes) && (displayCharacter?.notes ?? character.notes).length > 0 && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-2">{t('character.notes')}</h3>
              <div className="space-y-2">
                {(displayCharacter?.notes ?? character.notes).map((note, index) => (
                  <p key={index} className="text-zinc-300 text-sm leading-relaxed">
                    {renderInteractiveText(note)}
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
