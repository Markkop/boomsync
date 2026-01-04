// Color sharing prohibited for 10 or fewer players
export const COLOR_SHARE_THRESHOLD = 11;

// Hostage exchange matrix
export const HOSTAGE_MATRIX: Record<string, { rounds: number; hostages: number[] }> = {
  '6-10':  { rounds: 3, hostages: [1, 1, 1] },
  '11-21': { rounds: 5, hostages: [2, 1, 1, 1, 1] },
  '22-30': { rounds: 5, hostages: [3, 2, 1, 1, 1] },
};

// Minimum 25% vanilla team members for "Information Resistance"
export const MIN_VANILLA_RATIO = 0.25;

// Get hostage configuration for player count
export function getHostageConfig(playerCount: number): { rounds: number; hostages: number[] } {
  if (playerCount >= 6 && playerCount <= 10) {
    return HOSTAGE_MATRIX['6-10'];
  } else if (playerCount >= 11 && playerCount <= 21) {
    return HOSTAGE_MATRIX['11-21'];
  } else if (playerCount >= 22 && playerCount <= 30) {
    return HOSTAGE_MATRIX['22-30'];
  }
  // Default to 6-10 for smaller games
  return HOSTAGE_MATRIX['6-10'];
}

// Check if color sharing is allowed
export function isColorShareAllowed(playerCount: number): boolean {
  return playerCount >= COLOR_SHARE_THRESHOLD;
}
