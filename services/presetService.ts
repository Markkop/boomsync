import { Preset } from '../types';
import { BUILT_IN_PRESETS } from '../data/presets';

const CUSTOM_PRESETS_STORAGE_KEY = 'boomsync_custom_presets';

// Get all built-in presets
export function getBuiltInPresets(): Preset[] {
  return BUILT_IN_PRESETS;
}

// Get custom presets from localStorage
export function getCustomPresets(): Preset[] {
  try {
    const stored = localStorage.getItem(CUSTOM_PRESETS_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to load custom presets:', error);
    return [];
  }
}

// Get all presets (built-in + custom)
export function getAllPresets(): Preset[] {
  return [...getBuiltInPresets(), ...getCustomPresets()];
}

// Get preset by ID (checks both built-in and custom)
export function getPresetById(id: string): Preset | null {
  const builtIn = BUILT_IN_PRESETS.find(p => p.id === id);
  if (builtIn) return builtIn;
  
  const custom = getCustomPresets().find(p => p.id === id);
  return custom || null;
}

// Save a custom preset
export function saveCustomPreset(preset: Preset): void {
  const custom = getCustomPresets();
  const existingIndex = custom.findIndex(p => p.id === preset.id);
  
  const presetToSave: Preset = {
    ...preset,
    isCustom: true,
    createdAt: preset.createdAt || Date.now(),
  };
  
  if (existingIndex >= 0) {
    custom[existingIndex] = presetToSave;
  } else {
    custom.push(presetToSave);
  }
  
  try {
    localStorage.setItem(CUSTOM_PRESETS_STORAGE_KEY, JSON.stringify(custom));
  } catch (error) {
    console.error('Failed to save custom preset:', error);
    throw error;
  }
}

// Delete a custom preset
export function deleteCustomPreset(id: string): void {
  const custom = getCustomPresets();
  const filtered = custom.filter(p => p.id !== id);
  
  try {
    localStorage.setItem(CUSTOM_PRESETS_STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete custom preset:', error);
    throw error;
  }
}

// Generate a unique ID for a new custom preset
export function generatePresetId(name: string, playerCount: number): string {
  const base = `custom-${name.toLowerCase().replace(/\s+/g, '-')}-${playerCount}`;
  const custom = getCustomPresets();
  let id = base;
  let counter = 1;
  
  while (custom.some(p => p.id === id)) {
    id = `${base}-${counter}`;
    counter++;
  }
  
  return id;
}

// Create a preset from current roles
export function createPresetFromRoles(
  name: string,
  playerCount: number,
  difficulty: 1 | 2 | 3,
  roles: string[],
  metaAnalysis?: string,
  useBury?: boolean
): Preset {
  return {
    id: generatePresetId(name, playerCount),
    name,
    playerCount,
    difficulty,
    roles,
    metaAnalysis: metaAnalysis || `Custom preset for ${playerCount} players`,
    useBury,
    isCustom: true,
    createdAt: Date.now(),
  };
}
