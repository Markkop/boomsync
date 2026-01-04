import React, { useMemo, useState } from 'react';
import { CharacterIndex } from '../types';
import { CharacterCard } from './CharacterCard';
import { Icon } from './Icon';
import { getAllCharacters } from '../services/characterService';
import { PresetPanel } from './PresetPanel';

interface RoleListModalProps {
  selectedRoles: string[];
  onClose: () => void;
  onClearAll: () => void;
  onCharacterTap: (name: string) => void;
  onCharacterLongPress: (name: string) => void;
  onApplyPreset: (roles: string[]) => void;
  lockedRoles?: string[];
  onToggleLock?: (roleName: string) => void;
}

export const RoleListModal: React.FC<RoleListModalProps> = ({
  selectedRoles,
  onClose,
  onClearAll,
  onCharacterTap,
  onCharacterLongPress,
  onApplyPreset,
  lockedRoles = [],
  onToggleLock
}) => {
  const [showPresets, setShowPresets] = useState(false);
  const [isGeneratorActive, setIsGeneratorActive] = useState(false);
  const allCharacters = getAllCharacters();
  const selectedCharacters = useMemo(() => {
    return selectedRoles
      .map(name => allCharacters.find(c => c.name === name))
      .filter((c): c is CharacterIndex => c !== undefined);
  }, [selectedRoles, allCharacters]);

  const teamCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    selectedCharacters.forEach(char => {
      counts[char.team] = (counts[char.team] || 0) + 1;
    });
    return counts;
  }, [selectedCharacters]);

  // Helper to get team color classes
  const getTeamColorClasses = (team: string) => {
    switch (team) {
      case 'blue':
        return 'text-blue-400';
      case 'red':
        return 'text-red-400';
      case 'grey':
        return 'text-zinc-400';
      case 'green':
        return 'text-green-400';
      case 'yellow':
        return 'text-yellow-400';
      case 'both':
      case 'red-blue':
        return 'text-purple-400';
      default:
        return 'text-zinc-300';
    }
  };

  // Count role occurrences
  const roleCounts = useMemo(() => {
    const counts = new Map<string, number>();
    selectedRoles.forEach(role => {
      counts.set(role, (counts.get(role) || 0) + 1);
    });
    return counts;
  }, [selectedRoles]);

  const missingRequirements = useMemo(() => {
    const warnings: string[] = [];
    selectedCharacters.forEach(char => {
      char.requires.forEach(req => {
        if (!selectedRoles.includes(req)) {
          warnings.push(`${char.name} requires ${req}`);
        }
      });
    });
    return warnings;
  }, [selectedCharacters, selectedRoles]);

  // Group and sort roles for two-column display
  const groupedRoles = useMemo(() => {
    // Get unique roles with their counts
    const uniqueRoles = Array.from(roleCounts.keys()).map(roleName => {
      const char = allCharacters.find(c => c.name === roleName);
      return {
        name: roleName,
        character: char,
        count: roleCounts.get(roleName) || 1,
        team: char?.team || 'grey'
      };
    }).filter(item => item.character !== undefined) as Array<{
      name: string;
      character: CharacterIndex;
      count: number;
      team: string;
    }>;

    // Sort function: primary roles first, then team roles, then others
    const getSortPriority = (name: string, team: string): number => {
      // Primary roles
      if (name === 'President' || name === 'Bomber') return 0;
      // Team roles
      if (name === 'Blue Team' || name === 'Red Team') return 1;
      // Other roles
      return 2;
    };

    // Sort roles
    uniqueRoles.sort((a, b) => {
      const priorityA = getSortPriority(a.name, a.team);
      const priorityB = getSortPriority(b.name, b.team);
      if (priorityA !== priorityB) return priorityA - priorityB;
      
      // Within same priority, sort by count descending for team roles, alphabetically for others
      if (priorityA === 1) {
        return b.count - a.count;
      }
      return a.name.localeCompare(b.name);
    });

    // Separate into blue, red, grey, and others
    const blueRoles = uniqueRoles.filter(r => r.team === 'blue');
    const redRoles = uniqueRoles.filter(r => r.team === 'red');
    const greyRoles = uniqueRoles.filter(r => r.team === 'grey');
    const otherRoles = uniqueRoles.filter(r => r.team !== 'blue' && r.team !== 'red' && r.team !== 'grey');

    // Distribute grey roles between columns (alternating)
    const greyLeft: typeof greyRoles = [];
    const greyRight: typeof greyRoles = [];
    greyRoles.forEach((role, index) => {
      if (index % 2 === 0) {
        greyLeft.push(role);
      } else {
        greyRight.push(role);
      }
    });

    // Combine: left = blue + grey (left half), right = red + grey (right half) + others
    const leftColumnRoles = [...blueRoles, ...greyLeft];
    const rightColumnRoles = [...redRoles, ...greyRight, ...otherRoles];

    return { blueRoles: leftColumnRoles, redOtherRoles: rightColumnRoles };
  }, [roleCounts, allCharacters]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-[40px] p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-zinc-100 tracking-tight">GAME ROLES</h2>
            {selectedRoles.length > 0 && (
              <span className="px-2 py-1 bg-cyan-500/20 border border-cyan-500 rounded-lg text-sm font-semibold text-cyan-400">
                {selectedRoles.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPresets(!showPresets)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                showPresets
                  ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-400'
                  : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
Presets
            </button>
            {selectedRoles.length > 0 && (
              <button
                onClick={onClearAll}
                className="px-3 py-1.5 bg-rose-500/20 border border-rose-500 rounded-lg text-sm font-semibold text-rose-400 hover:bg-rose-500/30 transition-colors"
              >
                Clear
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-zinc-500 hover:text-zinc-300 active:scale-95 transition-transform"
            >
              <Icon name="close" size={24} />
            </button>
          </div>
        </div>

        <div className="space-y-4 px-2">
          {/* Preset Panel */}
          {showPresets && (
            <div className="mb-4 pb-4 border-b border-zinc-800">
              <PresetPanel
                selectedRoles={selectedRoles}
                onApplyPreset={onApplyPreset}
                onPresetApplied={() => setShowPresets(false)}
                lockedRoles={lockedRoles}
                onToggleLock={onToggleLock}
                onGeneratorActiveChange={setIsGeneratorActive}
              />
            </div>
          )}
          
          {/* Empty State */}
          {selectedRoles.length === 0 ? (
            <div className="text-center py-12">
              <Icon name="list" size={48} className="text-zinc-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-zinc-300 mb-2">No Roles Selected</h3>
              <p className="text-zinc-500 text-sm">
                Browse characters and long-press to add them to your game
              </p>
            </div>
          ) : (
            <>
              {/* Role List with Counts - Show when generator is active OR when not in presets */}
              {(isGeneratorActive || !showPresets) && selectedRoles.length > 0 && (
                <div className="bg-zinc-800/50 rounded-xl p-3">
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(roleCounts.entries()).map(([role, count]) => {
                      const char = allCharacters.find(c => c.name === role);
                      const team = char?.team || 'grey';
                      const colorClass = getTeamColorClasses(team);
                      return (
                        <button
                          key={role}
                          onClick={() => onCharacterTap(role)}
                          className={`text-xs ${colorClass} font-medium hover:opacity-80 transition-opacity active:scale-95`}
                        >
                          {count > 1 ? `${count}x ` : ''}{role}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {missingRequirements.length > 0 && (
                <div className="bg-amber-500/20 border border-amber-500 rounded-xl p-3">
                  <div className="flex items-start gap-2">
                    <Icon name="alert" size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-amber-400 mb-1">Missing Requirements</h3>
                      <ul className="text-xs text-amber-300 space-y-1">
                        {missingRequirements.map((warning, index) => (
                          <li key={index}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Role Grid - Two Column Layout - Hide when presets are shown (unless generator is active) */}
              {(!showPresets || isGeneratorActive) && (
                <div className="flex gap-3">
                  {/* Left Column - Blue Team */}
                  <div className="flex-1 space-y-3">
                    {groupedRoles.blueRoles.map(({ name, character, count }) => (
                      <CharacterCard
                        key={name}
                        character={character}
                        isSelected={true}
                        onTap={() => onCharacterTap(name)}
                        onLongPress={() => onCharacterLongPress(name)}
                        compact={true}
                        showSelectionIndicator={false}
                        isLocked={lockedRoles.includes(name)}
                        onToggleLock={isGeneratorActive && onToggleLock ? () => onToggleLock(name) : undefined}
                        count={count}
                      />
                    ))}
                  </div>
                  {/* Right Column - Red Team and Others */}
                  <div className="flex-1 space-y-3">
                    {groupedRoles.redOtherRoles.map(({ name, character, count }) => (
                      <CharacterCard
                        key={name}
                        character={character}
                        isSelected={true}
                        onTap={() => onCharacterTap(name)}
                        onLongPress={() => onCharacterLongPress(name)}
                        compact={true}
                        showSelectionIndicator={false}
                        isLocked={lockedRoles.includes(name)}
                        onToggleLock={isGeneratorActive && onToggleLock ? () => onToggleLock(name) : undefined}
                        count={count}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
