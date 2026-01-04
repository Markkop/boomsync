import { PresetGeneratorOptions, GeneratorState, RolePool } from '../types';
import { ROLE_METADATA, DEPENDENCY_TRIGGERS, BURY_REQUIRED, getRoleMetadata } from '../data/roleMetadata';
import { MIN_VANILLA_RATIO, isColorShareAllowed } from '../data/gameRules';
import { getAllCharacters } from './characterService';

// Phase I: Population and Parity Correction
function phaseI(playerCount: number): GeneratorState {
  const state: GeneratorState = {
    roles: [],
    blueCount: 0,
    redCount: 0,
    greyCount: 0,
    remainingSlots: playerCount,
    baselinePerTeam: 0,
  };
  
  // 1. Parity check - odd players get tie-breaker Grey
  if (playerCount % 2 === 1) {
    state.roles.push('Gambler');
    state.greyCount++;
    state.remainingSlots--;
  }
  
  // 2. MVP allocation
  state.roles.push('President', 'Bomber');
  state.blueCount++;
  state.redCount++;
  state.remainingSlots -= 2;
  
  // 3. Calculate baseline ratio for remaining slots
  state.baselinePerTeam = Math.floor(state.remainingSlots / 2);
  
  return state;
}

// Phase II: Difficulty Level Weighting
function phaseII(state: GeneratorState, difficulty: 1 | 2 | 3, options: PresetGeneratorOptions): RolePool {
  const pool: RolePool = {
    available: [],
    weights: new Map(),
  };
  
  const allCharacters = getAllCharacters();
  
  // Filter by difficulty and options
  for (const char of allCharacters) {
    const meta = getRoleMetadata(char.name);
    if (!meta) continue;
    
    // Skip if difficulty too high
    if (meta.difficulty > difficulty) continue;
    
    // Skip if minPlayers requirement not met
    if (meta.minPlayers && options.playerCount < meta.minPlayers) continue;
    
    // Skip if color share not allowed and role requires it
    if (!isColorShareAllowed(options.playerCount) && meta.minPlayers && meta.minPlayers >= 11) {
      continue;
    }
    
    // Check option flags
    if (!options.allowGreys && meta.team === 'grey') continue;
    if (!options.allowConditions && meta.category === 'condition') continue;
    if (!options.allowBury && (meta.category === 'backup' || char.name === 'Private Investigator')) continue;
    
    pool.available.push(char.name);
    
    // Apply complexity weights
    let weight = 1.0;
    if (difficulty === 1) {
      // Easy: Favor vanilla team members
      if (meta.category === 'primary' && char.name !== 'Blue Team' && char.name !== 'Red Team') {
        weight = 0; // Already added (President/Bomber)
      } else if (char.name === 'Blue Team' || char.name === 'Red Team') {
        weight = 3.0;
      } else if (char.name === 'Gambler') {
        weight = 2.0;
      } else {
        weight = 0.5;
      }
    } else if (difficulty === 2) {
      // Medium: Doctor/Engineer + Info pairs
      if (['Doctor', 'Engineer', 'Spy', 'Coy Boy'].includes(char.name)) {
        weight = 2.0;
      }
    } else {
      // Hard: Grey pairs, conditions, burying
      if (meta.category === 'grey' || meta.isViral || meta.category === 'condition') {
        weight = 2.0;
      }
    }
    
    pool.weights.set(char.name, weight);
  }
  
  return pool;
}

// Phase III: Recursive Dependency and Pairing Logic
function phaseIII(state: GeneratorState, selectedRole: string, useBury: boolean): string[] {
  const additions: string[] = [];
  const processed = new Set<string>();
  
  function processDeps(role: string) {
    if (processed.has(role)) return;
    processed.add(role);
    
    // Check dependency triggers
    const deps = DEPENDENCY_TRIGGERS[role] || [];
    for (const dep of deps) {
      if (!state.roles.includes(dep) && !additions.includes(dep)) {
        additions.push(dep);
        processDeps(dep);
      }
    }
  }
  
  processDeps(selectedRole);
  
  // Check for burying mode
  if (useBury && !state.buryRolesAdded) {
    for (const buryRole of BURY_REQUIRED) {
      if (!state.roles.includes(buryRole) && !additions.includes(buryRole)) {
        additions.push(buryRole);
      }
    }
    state.buryRolesAdded = true;
  }
  
  return additions;
}

// Update team counts when adding a role
function updateTeamCounts(state: GeneratorState, roleName: string): void {
  const meta = getRoleMetadata(roleName);
  if (!meta) {
    // Fallback to character index
    const allChars = getAllCharacters();
    const char = allChars.find(c => c.name === roleName);
    if (char) {
      if (char.team === 'blue') state.blueCount++;
      else if (char.team === 'red') state.redCount++;
      else if (char.team === 'grey') state.greyCount++;
      else if (char.team === 'both' || char.team === 'red-blue') {
        // Distribute evenly
        if (state.blueCount <= state.redCount) {
          state.blueCount++;
        } else {
          state.redCount++;
        }
      }
    }
    return;
  }
  
  if (meta.team === 'blue') {
    state.blueCount++;
  } else if (meta.team === 'red') {
    state.redCount++;
  } else if (meta.team === 'grey' || meta.team === 'green') {
    state.greyCount++;
  } else if (meta.team === 'both') {
    // Distribute evenly
    if (state.blueCount <= state.redCount) {
      state.blueCount++;
    } else {
      state.redCount++;
    }
  }
}

// Weighted random selection
function weightedRandomSelect(pool: RolePool, state: GeneratorState): string | null {
  const available = pool.available.filter(role => {
    // Don't select roles already in state
    if (state.roles.includes(role)) return false;
    
    // Check team balance (try to maintain 1:1 ratio)
    const meta = getRoleMetadata(role);
    if (!meta) return true;
    
    // Prefer roles that help balance teams
    if (meta.team === 'blue' && state.blueCount > state.redCount) return false;
    if (meta.team === 'red' && state.redCount > state.blueCount) return false;
    
    return true;
  });
  
  if (available.length === 0) return null;
  
  // Calculate total weight
  let totalWeight = 0;
  for (const role of available) {
    totalWeight += pool.weights.get(role) || 1;
  }
  
  if (totalWeight === 0) {
    // Fallback to uniform random
    return available[Math.floor(Math.random() * available.length)];
  }
  
  // Weighted random selection
  let random = Math.random() * totalWeight;
  for (const role of available) {
    const weight = pool.weights.get(role) || 1;
    random -= weight;
    if (random <= 0) {
      return role;
    }
  }
  
  return available[available.length - 1];
}

// Phase IV: User Fixation and Shuffling
function phaseIV(
  state: GeneratorState,
  pool: RolePool,
  options: PresetGeneratorOptions
): string[] {
  // 1. Insert fixed roles
  for (const role of options.lockedRoles) {
    if (!state.roles.includes(role)) {
      state.roles.push(role);
      updateTeamCounts(state, role);
      
      // 2. Constraint propagation - increase weights for "works well with"
      const meta = getRoleMetadata(role);
      if (meta) {
        for (const compatible of meta.worksWellWith) {
          const current = pool.weights.get(compatible) || 1;
          pool.weights.set(compatible, current * 1.5);
        }
      }
      
      // 3. Handle Ambassador hostage adjustment
      if (role === 'Ambassador') {
        state.ambassadorCount = (state.ambassadorCount || 0) + 1;
      }
      
      // 4. Add dependencies
      const deps = phaseIII(state, role, options.allowBury || false);
      for (const dep of deps) {
        if (!state.roles.includes(dep)) {
          state.roles.push(dep);
          updateTeamCounts(state, dep);
        }
      }
    }
  }
  
  // 5. Fill remaining slots maintaining 1:1 team ratio
  while (state.roles.length < options.playerCount) {
    // Ensure minimum vanilla ratio for information resistance
    const vanillaCount = state.roles.filter(r => r === 'Blue Team' || r === 'Red Team').length;
    const minVanilla = Math.floor(options.playerCount * MIN_VANILLA_RATIO);
    
    if (vanillaCount < minVanilla) {
      // Add vanilla
      if (state.blueCount <= state.redCount) {
        state.roles.push('Blue Team');
        state.blueCount++;
      } else {
        state.roles.push('Red Team');
        state.redCount++;
      }
    } else {
      // Weighted random selection from pool
      const role = weightedRandomSelect(pool, state);
      if (!role) {
        // Fallback to vanilla if pool exhausted
        if (state.blueCount <= state.redCount) {
          state.roles.push('Blue Team');
          state.blueCount++;
        } else {
          state.roles.push('Red Team');
          state.redCount++;
        }
      } else {
        state.roles.push(role);
        updateTeamCounts(state, role);
        
        // Add dependencies
        const deps = phaseIII(state, role, options.allowBury || false);
        for (const dep of deps) {
          if (!state.roles.includes(dep) && state.roles.length < options.playerCount) {
            state.roles.push(dep);
            updateTeamCounts(state, dep);
          }
        }
      }
    }
  }
  
  return state.roles;
}

// Main generator function
export function generatePreset(options: PresetGeneratorOptions): string[] {
  // Phase I: Population and Parity Correction
  const state = phaseI(options.playerCount);
  
  // Set bury flag if needed
  if (options.allowBury) {
    state.useBury = true;
  }
  
  // Phase II: Difficulty Level Weighting
  const pool = phaseII(state, options.difficulty, options);
  
  // Phase IV: User Fixation and Shuffling
  const roles = phaseIV(state, pool, options);
  
  return roles;
}

// Shuffle again (re-roll non-locked slots)
export function shufflePreset(
  currentRoles: string[],
  lockedRoles: string[],
  options: PresetGeneratorOptions
): string[] {
  // Start fresh but preserve locked roles
  const state = phaseI(options.playerCount);
  
  // Add locked roles first
  for (const role of lockedRoles) {
    if (!state.roles.includes(role)) {
      state.roles.push(role);
      updateTeamCounts(state, role);
      
      const deps = phaseIII(state, role, options.allowBury || false);
      for (const dep of deps) {
        if (!state.roles.includes(dep)) {
          state.roles.push(dep);
          updateTeamCounts(state, dep);
        }
      }
    }
  }
  
  if (options.allowBury) {
    state.useBury = true;
  }
  
  const pool = phaseII(state, options.difficulty, options);
  const roles = phaseIV(state, pool, options);
  
  return roles;
}
