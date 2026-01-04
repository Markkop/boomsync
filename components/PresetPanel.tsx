import React, { useState, useMemo, useEffect } from 'react';
import { Preset, PresetGeneratorOptions } from '../types';
import { Icon } from './Icon';
import { CharacterCard } from './CharacterCard';
import { getPresetsForPlayerCount } from '../data/presets';
import { getCustomPresets, saveCustomPreset, deleteCustomPreset, createPresetFromRoles } from '../services/presetService';
import { generatePreset, shufflePreset } from '../services/presetGenerator';
import { getAllCharacters } from '../services/characterService';

interface PresetPanelProps {
  selectedRoles: string[];
  onApplyPreset: (roles: string[]) => void;
  onSavePreset?: (preset: Preset) => void;
  onPresetApplied?: () => void;
  lockedRoles?: string[];
  onToggleLock?: (roleName: string) => void;
  onGeneratorActiveChange?: (isActive: boolean) => void;
  onSwitchToRolesTab?: () => void;
}

export const PresetPanel: React.FC<PresetPanelProps> = ({
  selectedRoles,
  onApplyPreset,
  onSavePreset,
  onPresetApplied,
  lockedRoles = [],
  onToggleLock,
  onGeneratorActiveChange,
  onSwitchToRolesTab,
}) => {
  const [activeSection, setActiveSection] = useState<'presets' | 'custom' | 'generator'>('presets');
  
  // Notify parent when generator section becomes active/inactive
  useEffect(() => {
    if (onGeneratorActiveChange) {
      onGeneratorActiveChange(activeSection === 'generator');
    }
  }, [activeSection, onGeneratorActiveChange]);
  const [selectedPlayerCount, setSelectedPlayerCount] = useState<number>(8);
  
  // Generator state
  const [genPlayerCount, setGenPlayerCount] = useState<number>(8);
  const [genPlayerCountInput, setGenPlayerCountInput] = useState<string>('8');
  const [genDifficulty, setGenDifficulty] = useState<1 | 2 | 3>(1);
  const [allowBury, setAllowBury] = useState(false);
  const [allowGreys, setAllowGreys] = useState(true);
  const [allowConditions, setAllowConditions] = useState(true);
  const [generatedRoles, setGeneratedRoles] = useState<string[]>([]);
  
  // Custom preset save dialog
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDifficulty, setPresetDifficulty] = useState<1 | 2 | 3>(1);
  
  const allCharacters = getAllCharacters();
  const customPresets = getCustomPresets();
  
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

  // Helper to get team for a role
  const getRoleTeam = (roleName: string): string => {
    const char = allCharacters.find(c => c.name === roleName);
    return char?.team || 'grey';
  };

  // Component to render roles with colors
  const RoleListDisplay: React.FC<{ roles: string[] }> = ({ roles }) => {
    // Count occurrences of each role
    const roleCounts = new Map<string, number>();
    for (const role of roles) {
      roleCounts.set(role, (roleCounts.get(role) || 0) + 1);
    }
    
    const roleEntries = Array.from(roleCounts.entries());
    
    return (
      <div className="flex flex-wrap gap-1.5">
        {roleEntries.map(([role, count]) => {
          const team = getRoleTeam(role);
          const colorClass = getTeamColorClasses(team);
          return (
            <span
              key={role}
              className={`text-xs ${colorClass} font-medium`}
            >
              {count > 1 ? `${count}x ` : ''}{role}
            </span>
          );
        })}
      </div>
    );
  };
  
  // Get presets for selected player count
  const presetsForCount = useMemo(() => {
    return getPresetsForPlayerCount(selectedPlayerCount);
  }, [selectedPlayerCount]);
  
  const handleApplyPreset = (preset: Preset) => {
    onApplyPreset(preset.roles);
    if (onPresetApplied) {
      onPresetApplied();
    }
    if (onSwitchToRolesTab) {
      onSwitchToRolesTab();
    }
  };
  
  const handleGenerate = () => {
    const options: PresetGeneratorOptions = {
      playerCount: genPlayerCount,
      difficulty: genDifficulty,
      lockedRoles,
      allowBury,
      allowGreys,
      allowConditions,
    };
    
    const roles = generatePreset(options);
    setGeneratedRoles(roles);
    // Don't auto-apply, just show suggestions
  };
  
  const handleShuffleAgain = () => {
    const options: PresetGeneratorOptions = {
      playerCount: genPlayerCount,
      difficulty: genDifficulty,
      lockedRoles,
      allowBury,
      allowGreys,
      allowConditions,
    };
    
    const roles = shufflePreset(generatedRoles.length > 0 ? generatedRoles : selectedRoles, lockedRoles, options);
    setGeneratedRoles(roles);
    // Don't auto-apply, just show suggestions
  };

  const handleApplyGenerated = () => {
    if (generatedRoles.length > 0) {
      onApplyPreset(generatedRoles);
      if (onSwitchToRolesTab) {
        onSwitchToRolesTab();
      }
    }
  };
  
  
  const handleSaveCurrent = () => {
    if (selectedRoles.length === 0) return;
    setShowSaveDialog(true);
    setPresetName(`Custom Preset (${selectedRoles.length} roles)`);
  };
  
  const handleConfirmSave = () => {
    if (!presetName.trim()) return;
    
    const preset = createPresetFromRoles(
      presetName.trim(),
      selectedRoles.length,
      presetDifficulty,
      selectedRoles
    );
    
    saveCustomPreset(preset);
    if (onSavePreset) {
      onSavePreset(preset);
    }
    
    setShowSaveDialog(false);
    setPresetName('');
  };
  
  const handleDeleteCustom = (id: string) => {
    if (confirm('Delete this custom preset?')) {
      deleteCustomPreset(id);
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Section Tabs */}
      <div className="flex border-b border-zinc-800">
        <button
          onClick={() => setActiveSection('presets')}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors relative ${
            activeSection === 'presets'
              ? 'text-cyan-400'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Quick Presets
          {activeSection === 'presets' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
          )}
        </button>
        <button
          onClick={() => setActiveSection('custom')}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors relative ${
            activeSection === 'custom'
              ? 'text-cyan-400'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Custom ({customPresets.length})
          {activeSection === 'custom' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
          )}
        </button>
        <button
          onClick={() => setActiveSection('generator')}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors relative ${
            activeSection === 'generator'
              ? 'text-cyan-400'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Generator
          {activeSection === 'generator' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
          )}
        </button>
      </div>
      
      {/* Quick Presets Section */}
      {activeSection === 'presets' && (
        <div className="space-y-4">
          {/* Player Count Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 block">
              Player Count
            </label>
            <div className="flex flex-wrap gap-2">
              {[8, 9, 10, 11, 12, 13, 15, 16, 17, 18, 19, 20].map(count => (
                <button
                  key={count}
                  onClick={() => setSelectedPlayerCount(count)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    selectedPlayerCount === count
                      ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-400'
                      : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
          
          {/* All Presets for Selected Player Count */}
          {presetsForCount.length > 0 ? (
            <div className="space-y-3">
              {presetsForCount.map(preset => {
                const difficultyLabel = preset.difficulty === 1 ? 'Easy' : preset.difficulty === 2 ? 'Medium' : 'Hard';
                return (
                  <div key={preset.id} className="bg-zinc-800/50 rounded-xl p-4 space-y-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-zinc-300">
                          {preset.name}
                        </h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          preset.difficulty === 1 ? 'bg-green-500/20 text-green-400' :
                          preset.difficulty === 2 ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {difficultyLabel}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mb-2">{preset.metaAnalysis}</p>
                      <RoleListDisplay roles={preset.roles} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-700">
                      {preset.roles.map((roleName, index) => {
                        const char = allCharacters.find(c => c.name === roleName);
                        if (!char) return null;
                        return (
                          <CharacterCard
                            key={`${roleName}-${index}`}
                            character={char}
                            isSelected={true}
                            onTap={() => {}}
                            onLongPress={() => {}}
                            compact={true}
                            showSelectionIndicator={false}
                          />
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-end pt-2 border-t border-zinc-700">
                      <button
                        onClick={() => handleApplyPreset(preset)}
                        className="px-3 py-1.5 bg-cyan-500 text-zinc-950 font-semibold rounded-lg hover:bg-cyan-400 transition-colors text-sm"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-500 text-sm">
              No presets available for {selectedPlayerCount} players
            </div>
          )}
        </div>
      )}
      
      {/* Custom Presets Section */}
      {activeSection === 'custom' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-300">Saved Presets</h3>
            {selectedRoles.length > 0 && (
              <button
                onClick={handleSaveCurrent}
                className="px-3 py-1.5 bg-cyan-500/20 border border-cyan-500 text-cyan-400 rounded-lg text-sm font-semibold hover:bg-cyan-500/30 transition-colors"
              >
                Save Current
              </button>
            )}
          </div>
          
          {customPresets.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-sm">
              No custom presets saved yet
            </div>
          ) : (
            <div className="space-y-2">
              {customPresets.map(preset => (
                <div
                  key={preset.id}
                  className="bg-zinc-800/50 rounded-xl p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-zinc-300 mb-1">{preset.name}</div>
                      <RoleListDisplay roles={preset.roles} />
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => {
                          handleApplyPreset(preset);
                          if (onSwitchToRolesTab) {
                            onSwitchToRolesTab();
                          }
                        }}
                        className="px-3 py-1 bg-cyan-500/20 border border-cyan-500 text-cyan-400 rounded-lg text-xs font-semibold hover:bg-cyan-500/30"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleDeleteCustom(preset.id)}
                        className="px-3 py-1 bg-rose-500/20 border border-rose-500 text-rose-400 rounded-lg text-xs font-semibold hover:bg-rose-500/30"
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Generator Section */}
      {activeSection === 'generator' && (
        <div className="space-y-4">
          {/* Player Count */}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 block">
              Player Count
            </label>
            <input
              type="number"
              min="8"
              max="30"
              value={genPlayerCountInput}
              onChange={(e) => {
                setGenPlayerCountInput(e.target.value);
                const parsed = parseInt(e.target.value, 10);
                if (!isNaN(parsed)) {
                  setGenPlayerCount(Math.max(8, Math.min(30, parsed)));
                }
              }}
              onBlur={() => {
                // On blur, ensure the input reflects the valid clamped value
                setGenPlayerCountInput(String(genPlayerCount));
              }}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>
          
          {/* Difficulty */}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 block">
              Difficulty
            </label>
            <div className="flex gap-2">
              {[
                { value: 1 as const, label: 'Easy' },
                { value: 2 as const, label: 'Medium' },
                { value: 3 as const, label: 'Hard' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setGenDifficulty(value)}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    genDifficulty === value
                      ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-400'
                      : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Options */}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 block">
              Options
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={allowBury}
                  onChange={(e) => setAllowBury(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-cyan-500 focus:ring-cyan-500"
                />
                Allow Burying
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={allowGreys}
                  onChange={(e) => setAllowGreys(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-cyan-500 focus:ring-cyan-500"
                />
                Allow Grey Roles
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={allowConditions}
                  onChange={(e) => setAllowConditions(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-cyan-500 focus:ring-cyan-500"
                />
                Allow Condition Roles
              </label>
            </div>
          </div>

          {/* Current Roles Display */}
          {selectedRoles.length > 0 && (
            <div className="bg-zinc-800/50 rounded-xl p-3">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 block">
                Current Roles ({selectedRoles.length})
              </label>
              <RoleListDisplay roles={selectedRoles} />
            </div>
          )}

          {/* Generate and Shuffle Buttons - Show below current roles when there are generated roles */}
          {generatedRoles.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={handleGenerate}
                className="flex-1 px-4 py-2 bg-cyan-500 text-zinc-950 font-semibold rounded-lg hover:bg-cyan-400 transition-colors"
              >
                Generate
              </button>
              <button
                onClick={handleShuffleAgain}
                className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold rounded-lg hover:bg-zinc-700 transition-colors"
              >
                <Icon name="shuffle" size={16} />
              </button>
            </div>
          )}

          {/* Generate Button - Show when no suggestions yet */}
          {generatedRoles.length === 0 && (
            <div className="flex gap-2">
              <button
                onClick={handleGenerate}
                className="flex-1 px-4 py-2 bg-cyan-500 text-zinc-950 font-semibold rounded-lg hover:bg-cyan-400 transition-colors"
              >
                Generate
              </button>
            </div>
          )}

          {/* Generated Suggestions */}
          {generatedRoles.length > 0 && (
            <div className="bg-zinc-800/50 rounded-xl p-4 space-y-3 border border-cyan-500/30">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2 block">
                  Generated Suggestion ({generatedRoles.length} roles)
                </label>
                <RoleListDisplay roles={generatedRoles} />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-700">
                {generatedRoles.map((roleName, index) => {
                  const char = allCharacters.find(c => c.name === roleName);
                  if (!char) return null;
                  return (
                    <CharacterCard
                      key={`${roleName}-${index}`}
                      character={char}
                      isSelected={true}
                      onTap={() => {}}
                      onLongPress={() => {}}
                      compact={true}
                      showSelectionIndicator={false}
                    />
                  );
                })}
              </div>
              <div className="flex items-center justify-end pt-2 border-t border-zinc-700">
                <button
                  onClick={handleApplyGenerated}
                  className="px-4 py-2 bg-cyan-500 text-zinc-950 font-semibold rounded-lg hover:bg-cyan-400 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          )}

          {/* Generate and Shuffle Buttons - Show below suggestions */}
          {generatedRoles.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={handleGenerate}
                className="flex-1 px-4 py-2 bg-cyan-500 text-zinc-950 font-semibold rounded-lg hover:bg-cyan-400 transition-colors"
              >
                Generate
              </button>
              <button
                onClick={handleShuffleAgain}
                className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold rounded-lg hover:bg-zinc-700 transition-colors"
              >
                <Icon name="shuffle" size={16} />
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-zinc-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-[40px] p-6 shadow-2xl">
            <h3 className="text-xl font-black text-zinc-100 mb-4">Save Preset</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 block">
                  Name
                </label>
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="Preset name"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 block">
                  Difficulty
                </label>
                <div className="flex gap-2">
                  {[
                    { value: 1 as const, label: 'Easy' },
                    { value: 2 as const, label: 'Medium' },
                    { value: 3 as const, label: 'Hard' },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setPresetDifficulty(value)}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                        presetDifficulty === value
                          ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-400'
                          : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold rounded-lg hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSave}
                  disabled={!presetName.trim()}
                  className="flex-1 px-4 py-2 bg-cyan-500 text-zinc-950 font-semibold rounded-lg hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
