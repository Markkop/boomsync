import { Preset } from '../types';

// Helper to expand role lists with multipliers (e.g., "3x Blue Team")
function expandRoles(roleList: string[]): string[] {
  const expanded: string[] = [];
  for (const role of roleList) {
    const match = role.match(/^(\d+)x\s+(.+)$/);
    if (match) {
      const count = parseInt(match[1], 10);
      const roleName = match[2];
      for (let i = 0; i < count; i++) {
        expanded.push(roleName);
      }
    } else {
      expanded.push(role);
    }
  }
  return expanded;
}

// Built-in presets for 8-20 players
export const BUILT_IN_PRESETS: Preset[] = [
  // 8 Players
  {
    id: 'easy-8',
    name: 'Easy (8 Players)',
    playerCount: 8,
    difficulty: 1,
    roles: expandRoles(['President', 'Bomber', '3x Blue Team', '3x Red Team']),
    metaAnalysis: 'Pure introductory experience focusing on physical separation and leadership election',
  },
  {
    id: 'medium-8',
    name: 'Medium (8 Players)',
    playerCount: 8,
    difficulty: 2,
    roles: expandRoles(['President', 'Bomber', 'Doctor', 'Engineer', '2x Blue Team', '2x Red Team']),
    metaAnalysis: 'Introduces the "Health Loop" - MVPs must find their healers to win',
  },
  {
    id: 'hard-8',
    name: 'Hard (8 Players)',
    playerCount: 8,
    difficulty: 3,
    roles: expandRoles(['President', 'Bomber', 'Ahab', 'Moby', 'Wife', 'Mistress', 'Blue Team', 'Red Team']),
    metaAnalysis: '"The Hardcore Setup" - Neutral objectives dominate, making team loyalty secondary',
    useBury: false,
  },
  
  // 9 Players
  {
    id: 'easy-9',
    name: 'Easy (9 Players)',
    playerCount: 9,
    difficulty: 1,
    roles: expandRoles(['President', 'Bomber', '3x Blue Team', '3x Red Team', 'Gambler']),
    metaAnalysis: 'Teaches bargaining with neutral parties to secure majorities',
  },
  {
    id: 'medium-9',
    name: 'Medium (9 Players)',
    playerCount: 9,
    difficulty: 2,
    roles: expandRoles(['President', 'Bomber', 'Doctor', 'Engineer', 'Spy', 'Spy', 'Blue Team', 'Red Team', 'Gambler']),
    metaAnalysis: 'Introduces deception - Spies mask team identities of MVPs',
  },
  {
    id: 'hard-9',
    name: 'Hard (9 Players)',
    playerCount: 9,
    difficulty: 3,
    roles: expandRoles(["President", "Bomber", "President's Daughter", 'Martyr', 'Doctor', 'Engineer', 'Nurse', 'Tinkerer', 'Private Investigator']),
    metaAnalysis: '"The Burying" variant - One card removed; must deduce if Bomber even exists',
    useBury: true,
  },
  
  // 10 Players
  {
    id: 'easy-10',
    name: 'Easy (10 Players)',
    playerCount: 10,
    difficulty: 1,
    roles: expandRoles(['President', 'Bomber', '4x Blue Team', '4x Red Team']),
    metaAnalysis: 'Focus on hostage management and room leadership stability',
  },
  {
    id: 'medium-10',
    name: 'Medium (10 Players)',
    playerCount: 10,
    difficulty: 2,
    roles: expandRoles(['President', 'Bomber', 'Doctor', 'Engineer', 'Spy', 'Spy', 'Shy Guy', 'Shy Guy', 'Blue Team', 'Red Team']),
    metaAnalysis: 'Information denial - Shy Guys provide cover for the President',
  },
  {
    id: 'hard-10',
    name: 'Hard (10 Players)',
    playerCount: 10,
    difficulty: 3,
    roles: expandRoles(['President', 'Bomber', 'Sniper', 'Target', 'Decoy', 'Hot Potato', '2x Blue Team', '2x Red Team']),
    metaAnalysis: 'High-chaos - Hot Potato trades roles during shares, potentially changing President',
  },
  
  // 11 Players
  {
    id: 'easy-11',
    name: 'Easy (11 Players)',
    playerCount: 11,
    difficulty: 1,
    roles: expandRoles(['President', 'Bomber', '4x Blue Team', '4x Red Team', 'Gambler']),
    metaAnalysis: 'Introductory color sharing game',
  },
  {
    id: 'medium-11',
    name: 'Medium (11 Players)',
    playerCount: 11,
    difficulty: 2,
    roles: expandRoles(['President', 'Bomber', 'Doctor', 'Engineer', 'Spy', 'Spy', 'Coy Boy', 'Coy Boy', 'Blue Team', 'Red Team', 'Gambler']),
    metaAnalysis: 'Standard competitive setup for most game nights',
  },
  {
    id: 'hard-11',
    name: 'Hard (11 Players)',
    playerCount: 11,
    difficulty: 3,
    roles: expandRoles(['President', 'Bomber', 'Enforcer', 'Negotiator', 'Negotiator', 'Sniper', 'Target', 'Decoy', 'Blue Team', 'Red Team', 'MI6']),
    metaAnalysis: 'Aggressive information gathering - Enforcers force people to talk',
  },
  
  // 12 Players
  {
    id: 'easy-12',
    name: 'Easy (12 Players)',
    playerCount: 12,
    difficulty: 1,
    roles: expandRoles(['President', 'Bomber', '5x Blue Team', '5x Red Team']),
    metaAnalysis: 'Large-scale basic game',
  },
  {
    id: 'medium-12',
    name: 'Medium (12 Players)',
    playerCount: 12,
    difficulty: 2,
    roles: expandRoles(['President', 'Bomber', 'Doctor', 'Engineer', 'Spy', 'Spy', 'Angel', 'Demon', '2x Blue Team', '2x Red Team']),
    metaAnalysis: 'Acting roles (Angel/Demon) force honest and dishonest speech patterns',
  },
  {
    id: 'hard-12',
    name: 'Hard (12 Players)',
    playerCount: 12,
    difficulty: 3,
    roles: expandRoles(['President', 'Bomber', 'Intern', 'Rival', 'Survivor', 'Victim', 'Spy', 'Spy', 'Coy Boy', 'Coy Boy', 'Blue Team', 'Red Team']),
    metaAnalysis: '"The Grey Game" - Neutral factions have more power than colored teams',
  },
  
  // 13 Players
  {
    id: 'easy-13',
    name: 'Easy (13 Players)',
    playerCount: 13,
    difficulty: 1,
    roles: expandRoles(['President', 'Bomber', '5x Blue Team', '5x Red Team', 'Gambler']),
    metaAnalysis: 'Standard odd-count expansion',
  },
  {
    id: 'medium-13',
    name: 'Medium (13 Players)',
    playerCount: 13,
    difficulty: 2,
    roles: expandRoles(['President', 'Bomber', 'Doctor', 'Engineer', 'Spy', 'Spy', 'Coy Boy', 'Coy Boy', 'Romeo', 'Juliet', 'Blue Team', 'Red Team', 'Gambler']),
    metaAnalysis: '"The Lovers" setup adds spatial objective complicating room control',
  },
  {
    id: 'hard-13',
    name: 'Hard (13 Players)',
    playerCount: 13,
    difficulty: 3,
    roles: expandRoles(['President', 'Bomber', 'Mummy', 'Medic', 'Sniper', 'Target', 'Decoy', 'Spy', 'Spy', 'Blue Team', 'Red Team', 'MI6', 'Survivor']),
    metaAnalysis: 'Curses and Snipers create hostile information environment',
  },
  
  // 15 Players
  {
    id: 'easy-15',
    name: 'Easy (15 Players)',
    playerCount: 15,
    difficulty: 1,
    roles: expandRoles(['President', 'Bomber', '6x Blue Team', '6x Red Team', 'Gambler']),
    metaAnalysis: 'Basic large-group play - "sweet spot" of the game',
  },
  {
    id: 'medium-15',
    name: 'Medium (15 Players)',
    playerCount: 15,
    difficulty: 2,
    roles: expandRoles(['President', 'Bomber', 'Doctor', 'Engineer', 'Spy', 'Spy', 'Coy Boy', 'Coy Boy', 'Negotiator', 'Negotiator', '2x Blue Team', '2x Red Team', 'Gambler']),
    metaAnalysis: 'Standard high-interaction competitive game',
  },
  {
    id: 'hard-15',
    name: 'Hard (15 Players)',
    playerCount: 15,
    difficulty: 3,
    roles: expandRoles(['President', 'Bomber', 'Sniper', 'Target', 'Decoy', 'Hot Potato', 'Ahab', 'Moby', 'Wife', 'Mistress', 'Blue Team', 'Red Team', 'MI6', 'Survivor', 'Victim']),
    metaAnalysis: '"The Kitchen Sink" - Every player has complex objective',
  },
  
  // 16 Players
  {
    id: 'easy-16',
    name: 'Easy (16 Players)',
    playerCount: 16,
    difficulty: 1,
    roles: expandRoles(['President', 'Bomber', '7x Blue Team', '7x Red Team', 'Gambler']),
    metaAnalysis: 'Large introductory game',
  },
  {
    id: 'medium-16',
    name: 'Medium (16 Players)',
    playerCount: 16,
    difficulty: 2,
    roles: expandRoles(['President', 'Bomber', 'Doctor', 'Engineer', 'Spy', 'Spy', 'Coy Boy', 'Coy Boy', 'Angel', 'Demon', 'Mime', 'Mime', 'Blue Team', 'Red Team', 'Gambler']),
    metaAnalysis: 'Acting roles create high social humor and chaos',
  },
  {
    id: 'hard-16',
    name: 'Hard (16 Players)',
    playerCount: 16,
    difficulty: 3,
    roles: expandRoles(['President', 'Bomber', 'Enforcer', 'Psychologist', 'Criminal', 'Criminal', 'Sniper', 'Target', 'Decoy', 'Wife', 'Mistress', 'Romeo', 'Juliet', 'MI6', 'Survivor']),
    metaAnalysis: 'Complex web of status effects and interdependent win conditions',
  },
  
  // 17 Players
  {
    id: 'easy-17',
    name: 'Easy (17 Players)',
    playerCount: 17,
    difficulty: 1,
    roles: expandRoles(['President', 'Bomber', '7x Blue Team', '7x Red Team', 'Gambler']),
    metaAnalysis: 'Large introductory game',
  },
  {
    id: 'medium-17',
    name: 'Medium (17 Players)',
    playerCount: 17,
    difficulty: 2,
    roles: expandRoles(['President', 'Bomber', 'Doctor', 'Engineer', 'Spy', 'Spy', 'Coy Boy', 'Coy Boy', 'Angel', 'Demon', 'Mime', 'Mime', 'Blue Team', 'Red Team', 'Gambler']),
    metaAnalysis: 'Acting roles create high social humor and chaos',
  },
  {
    id: 'hard-17',
    name: 'Hard (17 Players)',
    playerCount: 17,
    difficulty: 3,
    roles: expandRoles(['President', 'Bomber', 'Enforcer', 'Psychologist', 'Criminal', 'Criminal', 'Sniper', 'Target', 'Decoy', 'Wife', 'Mistress', 'Romeo', 'Juliet', 'MI6', 'Survivor']),
    metaAnalysis: 'Complex web of status effects and interdependent win conditions',
  },
  
  // 18 Players
  {
    id: 'easy-18',
    name: 'Easy (18 Players)',
    playerCount: 18,
    difficulty: 1,
    roles: expandRoles(['President', 'Bomber', '8x Blue Team', '8x Red Team']),
    metaAnalysis: 'Standard massive group play',
  },
  {
    id: 'medium-18',
    name: 'Medium (18 Players)',
    playerCount: 18,
    difficulty: 2,
    roles: expandRoles(['President', 'Bomber', 'Doctor', 'Engineer', 'Spy', 'Spy', 'Coy Boy', 'Coy Boy', 'Paparazzo', 'Paparazzo', '2x Blue Team', '2x Red Team', 'Angel', 'Demon', 'Survivor', 'Victim']),
    metaAnalysis: '"Paparazzo" roles can force reveals of celebrities',
  },
  {
    id: 'hard-18',
    name: 'Hard (18 Players)',
    playerCount: 18,
    difficulty: 3,
    roles: expandRoles(['President', 'Bomber', 'Ambassador', 'Ambassador', 'Zombie', 'Mummy', 'Medic', 'Spy', 'Spy', 'Coy Boy', 'Coy Boy', 'Sniper', 'Target', 'Decoy', 'Hot Potato', 'MI6', 'Survivor', 'Victim']),
    metaAnalysis: 'Ambassadors facilitate cross-room interaction while Zombie spreads plague',
  },
  
  // 19 Players
  {
    id: 'easy-19',
    name: 'Easy (19 Players)',
    playerCount: 19,
    difficulty: 1,
    roles: expandRoles(['President', 'Bomber', '8x Blue Team', '8x Red Team', 'Gambler']),
    metaAnalysis: 'Standard massive group play',
  },
  {
    id: 'medium-19',
    name: 'Medium (19 Players)',
    playerCount: 19,
    difficulty: 2,
    roles: expandRoles(['President', 'Bomber', 'Doctor', 'Engineer', 'Spy', 'Spy', 'Coy Boy', 'Coy Boy', 'Paparazzo', 'Paparazzo', '2x Blue Team', '2x Red Team', 'Angel', 'Demon', 'Survivor', 'Victim', 'Gambler']),
    metaAnalysis: '"Paparazzo" roles can force reveals of celebrities',
  },
  {
    id: 'hard-19',
    name: 'Hard (19 Players)',
    playerCount: 19,
    difficulty: 3,
    roles: expandRoles(['President', 'Bomber', 'Ambassador', 'Ambassador', 'Zombie', 'Mummy', 'Medic', 'Spy', 'Spy', 'Coy Boy', 'Coy Boy', 'Sniper', 'Target', 'Decoy', 'Hot Potato', 'MI6', 'Survivor', 'Victim', 'Gambler']),
    metaAnalysis: 'Ambassadors facilitate cross-room interaction while Zombie spreads plague',
  },
  
  // 20 Players
  {
    id: 'easy-20',
    name: 'Easy (20 Players)',
    playerCount: 20,
    difficulty: 1,
    roles: expandRoles(['President', 'Bomber', '9x Blue Team', '9x Red Team']),
    metaAnalysis: 'Standard massive group play',
  },
  {
    id: 'medium-20',
    name: 'Medium (20 Players)',
    playerCount: 20,
    difficulty: 2,
    roles: expandRoles(['President', 'Bomber', 'Doctor', 'Engineer', 'Spy', 'Spy', 'Coy Boy', 'Coy Boy', 'Paparazzo', 'Paparazzo', '2x Blue Team', '2x Red Team', 'Angel', 'Demon', 'Survivor', 'Victim']),
    metaAnalysis: '"Paparazzo" roles can force reveals of celebrities',
  },
  {
    id: 'hard-20',
    name: 'Hard (20 Players)',
    playerCount: 20,
    difficulty: 3,
    roles: expandRoles(['President', 'Bomber', 'Ambassador', 'Ambassador', 'Zombie', 'Mummy', 'Medic', 'Spy', 'Spy', 'Coy Boy', 'Coy Boy', 'Sniper', 'Target', 'Decoy', 'Hot Potato', 'MI6', 'Survivor', 'Victim']),
    metaAnalysis: 'Ambassadors facilitate cross-room interaction while Zombie spreads plague',
  },
];

// Get presets for a specific player count
export function getPresetsForPlayerCount(playerCount: number): Preset[] {
  return BUILT_IN_PRESETS.filter(p => p.playerCount === playerCount);
}

// Get preset by ID
export function getPresetById(id: string): Preset | undefined {
  return BUILT_IN_PRESETS.find(p => p.id === id);
}
