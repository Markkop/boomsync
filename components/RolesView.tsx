import React, { useState, useMemo } from 'react';
import { CharacterIndex } from '../types';
import { CharacterCard } from './CharacterCard';
import { Icon } from './Icon';
import { getAllCharacters, getAllTags, searchCharacters } from '../services/characterService';
import { PresetPanel } from './PresetPanel';
import { TapSafeButton } from './TapSafeButton';

interface RolesViewProps {
  searchQuery: string;
  teamFilter: string | null;
  tagFilter: string | null;
  selectedRoles: string[];
  onSearchChange: (query: string) => void;
  onTeamFilterChange: (team: string | null) => void;
  onTagFilterChange: (tag: string | null) => void;
  onCharacterTap: (name: string) => void;
  onCharacterLongPress: (name: string) => void;
  onOpenRoleList: () => void;
  onClearAll?: () => void;
  onApplyPreset?: (roles: string[]) => void;
  lockedRoles?: string[];
  onToggleLock?: (roleName: string) => void;
}

const TEAMS = [
  { id: null, label: 'All', color: 'zinc' },
  { id: 'red', label: 'Red', color: 'red' },
  { id: 'blue', label: 'Blue', color: 'blue' },
  { id: 'red-blue', label: 'Red-Blue', color: 'red-blue' },
  { id: 'grey', label: 'Grey', color: 'zinc' },
  { id: 'green', label: 'Green', color: 'green' },
  { id: 'yellow', label: 'Yellow', color: 'yellow' },
  { id: 'special', label: 'Special', color: 'pink' }
];

type IconName = 'share' | 'palette' | 'eye' | 'megaphone' | 'sparkles' | 'virus' | 'theater' | 'swap' | 'archive' | 'star' | 'clock' | 'hash' | 'alert';

const getTagIcon = (tag: string): IconName | null => {
  if (tag.includes('card share power')) return 'share';
  if (tag.includes('color share power')) return 'palette';
  if (tag.includes('private reveal power')) return 'eye';
  if (tag.includes('public reveal power')) return 'megaphone';
  if (tag.includes('condition')) return 'sparkles';
  if (tag.includes('contagious')) return 'virus';
  if (tag.includes('acting')) return 'theater';
  if (tag.includes('card swap')) return 'swap';
  if (tag.includes('bury')) return 'archive';
  if (tag.includes('primary character')) return 'star';
  if (tag.includes('pause game')) return 'clock';
  if (tag.includes('odd player count')) return 'hash';
  return null;
};

const formatTagLabel = (tag: string): string => {
  // Capitalize first letter of each word
  return tag
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

type InnerTab = 'roles' | 'search' | 'presets';

export const RolesView: React.FC<RolesViewProps> = ({
  searchQuery,
  teamFilter,
  tagFilter,
  selectedRoles,
  onSearchChange,
  onTeamFilterChange,
  onTagFilterChange,
  onCharacterTap,
  onCharacterLongPress,
  onOpenRoleList,
  onClearAll,
  onApplyPreset,
  lockedRoles = [],
  onToggleLock
}) => {
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  const [activeInnerTab, setActiveInnerTab] = useState<InnerTab>('search');
  const [isGeneratorActive, setIsGeneratorActive] = useState(false);
  const allTags = getAllTags();
  const allCharacters = getAllCharacters();

  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter characters
  const filteredCharacters = useMemo(() => {
    let characters: CharacterIndex[] = getAllCharacters();

    // Apply search
    if (debouncedQuery.trim()) {
      characters = searchCharacters(debouncedQuery);
    }

    // Apply team filter
    if (teamFilter) {
      characters = characters.filter(c => c.team === teamFilter);
    }

    // Apply tag filter
    if (tagFilter) {
      characters = characters.filter(c => c.tags.includes(tagFilter));
    }

    return characters;
  }, [debouncedQuery, teamFilter, tagFilter]);

  const getTeamColorClasses = (teamId: string | null) => {
    if (!teamId) return 'bg-zinc-800 border-zinc-700 text-zinc-300';
    const team = TEAMS.find(t => t.id === teamId);
    if (!team) return 'bg-zinc-800 border-zinc-700 text-zinc-300';
    switch (team.color) {
      case 'red': return 'bg-red-500/20 border-red-500 text-red-400';
      case 'blue': return 'bg-blue-500/20 border-blue-500 text-blue-400';
      case 'red-blue': return 'bg-gradient-to-r from-red-500/20 to-blue-500/20 border-l-red-500 border-r-blue-500 border-t-red-500 border-b-blue-500 text-red-400';
      case 'green': return 'bg-green-500/20 border-green-500 text-green-400';
      case 'yellow': return 'bg-yellow-500/20 border-yellow-500 text-yellow-400';
      case 'pink': return 'bg-pink-500/20 border-pink-500 text-pink-400';
      default: return 'bg-zinc-500/20 border-zinc-500 text-zinc-400';
    }
  };

  // Helper to get team color classes for role list
  const getRoleTeamColorClasses = (team: string) => {
    switch (team) {
      case 'blue': return 'text-blue-400';
      case 'red': return 'text-red-400';
      case 'grey': return 'text-zinc-400';
      case 'green': return 'text-green-400';
      case 'yellow': return 'text-yellow-400';
      case 'both':
      case 'red-blue': return 'text-purple-400';
      default: return 'text-zinc-300';
    }
  };

  // Get selected characters
  const selectedCharacters = useMemo(() => {
    return selectedRoles
      .map(name => allCharacters.find(c => c.name === name))
      .filter((c): c is CharacterIndex => c !== undefined);
  }, [selectedRoles, allCharacters]);

  // Count role occurrences
  const roleCounts = useMemo(() => {
    const counts = new Map<string, number>();
    selectedRoles.forEach(role => {
      counts.set(role, (counts.get(role) || 0) + 1);
    });
    return counts;
  }, [selectedRoles]);

  // Check for missing requirements
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
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* Tab Bar */}
      <div className="flex border-b border-zinc-800 bg-zinc-900 flex-shrink-0">
        <button
          onClick={() => setActiveInnerTab('roles')}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors relative ${
            activeInnerTab === 'roles'
              ? 'text-cyan-400'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            Roles
            {selectedRoles.length > 0 && (
              <span className="px-1.5 py-0.5 bg-cyan-500/20 border border-cyan-500 rounded text-xs font-semibold text-cyan-400">
                {selectedRoles.length}
              </span>
            )}
          </span>
          {activeInnerTab === 'roles' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
          )}
        </button>
        <button
          onClick={() => setActiveInnerTab('search')}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors relative ${
            activeInnerTab === 'search'
              ? 'text-cyan-400'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Search
          {activeInnerTab === 'search' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
          )}
        </button>
        <button
          onClick={() => setActiveInnerTab('presets')}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors relative ${
            activeInnerTab === 'presets'
              ? 'text-cyan-400'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Presets
          {activeInnerTab === 'presets' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {/* Roles Tab */}
        {activeInnerTab === 'roles' && (
          <div className="h-full overflow-y-auto pb-24 no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
            {selectedRoles.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Icon name="list" size={48} className="text-zinc-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-zinc-300 mb-2">No Roles Selected</h3>
                <p className="text-zinc-500 text-sm">
                  Long press on characters in the Search tab to add them to your game
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {/* Header with Clear button */}
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black tracking-tight text-zinc-100">GAME ROLES</h2>
                  {onClearAll && (
                    <button
                      onClick={onClearAll}
                      className="px-3 py-1.5 bg-rose-500/20 border border-rose-500 rounded-lg text-sm font-semibold text-rose-400 hover:bg-rose-500/30 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Role List with Counts */}
                <div className="bg-zinc-800/50 rounded-xl p-3">
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(roleCounts.entries()).map(([role, count]) => {
                      const char = allCharacters.find(c => c.name === role);
                      const team = char?.team || 'grey';
                      const colorClass = getRoleTeamColorClasses(team);
                      return (
                        <TapSafeButton
                          key={role}
                          onTap={() => onCharacterTap(role)}
                          className={`text-xs ${colorClass} font-medium hover:opacity-80 transition-opacity active:scale-95`}
                        >
                          {count > 1 ? `${count}x ` : ''}{role}
                        </TapSafeButton>
                      );
                    })}
                  </div>
                </div>

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

                {/* Role Grid - Two Column Layout */}
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
              </div>
            )}
          </div>
        )}

        {/* Search Tab */}
        {activeInnerTab === 'search' && (
          <div className="h-full overflow-y-auto pb-24 no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
            {/* Search Bar and Filters */}
            <div className="bg-zinc-950/80 backdrop-blur-md p-4 pb-2">
              <div className="relative">
                <Icon name="search" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search characters..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-12 pr-4 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                />
              </div>

              {/* Team Filter Chips */}
              <div className="flex gap-2 mt-3 overflow-x-auto pb-2 no-scrollbar">
                {TEAMS.map(team => (
                  <button
                    key={team.id || 'all'}
                    onClick={() => onTeamFilterChange(team.id)}
                    className={`
                      px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap
                      transition-all active:scale-95
                      ${teamFilter === team.id 
                        ? getTeamColorClasses(team.id) + ' border-2' 
                        : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                      }
                    `}
                  >
                    {team.label}
                  </button>
                ))}
              </div>

              {/* Tag Filter Chips */}
              {allTags.length > 0 && (
                <div className="flex gap-2 mt-2 pb-2 overflow-x-auto no-scrollbar">
                  {allTags.map(tag => {
                    const iconName = getTagIcon(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => onTagFilterChange(tagFilter === tag ? null : tag)}
                        className={`
                          flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex-shrink-0
                          transition-all active:scale-95
                          ${tagFilter === tag
                            ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-400'
                            : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                          }
                        `}
                      >
                        {iconName && (
                          <Icon name={iconName} size={14} className="flex-shrink-0" />
                        )}
                        <span>{formatTagLabel(tag)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Character Grid */}
            {filteredCharacters.length === 0 ? (
              <div className="text-center py-12">
                <Icon name="search" size={48} className="text-zinc-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-zinc-300 mb-2">No Characters Found</h3>
                <p className="text-zinc-500 text-sm">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 p-4">
                {filteredCharacters.map(character => (
                  <CharacterCard
                    key={character.name}
                    character={character}
                    isSelected={selectedRoles.includes(character.name)}
                    onTap={() => onCharacterTap(character.name)}
                    onLongPress={() => onCharacterLongPress(character.name)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Presets Tab */}
        {activeInnerTab === 'presets' && (
          <div className="h-full overflow-y-auto pb-24 no-scrollbar p-4">
            {onApplyPreset ? (
              <PresetPanel
                selectedRoles={selectedRoles}
                onApplyPreset={onApplyPreset}
                lockedRoles={lockedRoles}
                onToggleLock={onToggleLock}
                onGeneratorActiveChange={setIsGeneratorActive}
                onSwitchToRolesTab={() => setActiveInnerTab('roles')}
              />
            ) : (
              <div className="text-center py-12">
                <Icon name="list" size={48} className="text-zinc-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-zinc-300 mb-2">Presets Not Available</h3>
                <p className="text-zinc-500 text-sm">Preset functionality is not enabled</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
