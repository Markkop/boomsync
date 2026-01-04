
export enum TimerStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  ALARMING = 'alarming',
  READY_TO_BOOM = 'ready_to_boom'
}

export interface GameTimer {
  id: string;
  initialSeconds: number;
  remainingSeconds: number;
  status: TimerStatus;
}

export interface Player {
  id: string;
  name: string;
}

export interface GameState {
  timers: GameTimer[];
  players: Player[];
  roomA: string[];
  roomB: string[];
  roundCount: number | 'test';
  usedTimerIds: string[];
  activeTab: 'timers' | 'shuffle' | 'roles';
  isEditingPlayers: boolean;
  isBombSoundOn: boolean;
  rolesSearchQuery: string;
  rolesTeamFilter: string | null;
  rolesTagFilter: string | null;
  selectedCharacterName: string | null;
  selectedRoles: string[];
  showRoleListModal: boolean;
}

export interface CharacterPower {
  name: string;
  type: string;
  description: string;
}

export interface CharacterFull {
  name: string;
  team: string;
  winCondition: string;
  powers: CharacterPower[];
  tags: string[];
  worksWellWith: string[];
  doesntWorkWellWith: string[];
  requires: string[];
  notes: string[];
}

export interface CharacterIndex {
  name: string;
  team: string;
  file: string;
  tags: string[];
  requires: string[];
  description?: string;
}

export type SyncMessage = 
  | { type: 'SYNC_STATE'; state: GameState }
  | { type: 'HEARTBEAT'; peerId: string }
  | { type: 'CONNECTION_COUNT'; count: number }
  | { type: 'ROOM_DELETED' }
  | { type: 'REQUEST_STATE' }
  | { type: 'EXPLOSION' };

// Preset System Types
export type RoleCategory = 
  | 'primary'      // President, Bomber
  | 'support'      // Doctor, Engineer, Nurse, Tinkerer
  | 'backup'       // President's Daughter, Martyr
  | 'info'         // Spy, Coy Boy, Shy Guy, Negotiator, Agent
  | 'grey'         // Gambler, MI6, Romeo/Juliet, Ahab/Moby, etc.
  | 'acting'       // Mime, Clown, Blind
  | 'condition'    // Mummy, Zombie, Hot Potato
  | 'movement';    // Ambassador

export interface RoleMetadata {
  name: string;
  team: 'blue' | 'red' | 'grey' | 'green' | 'both';
  difficulty: 1 | 2 | 3;
  category: RoleCategory;
  mechanicalFunction: string;
  dependencies: string[];           // Auto-pull these roles
  worksWellWith: string[];          // Increase selection weight
  incompatibleWith: string[];       // Cannot coexist
  minPlayers?: number;              // e.g., 11 for color-share meta
  isViral?: boolean;                // Zombie, Werewolf
  isActing?: boolean;               // Mime, Clown, Blind
  affectsHostageCount?: boolean;    // Ambassador
}

export interface ConditionInteraction {
  conditionA: string;
  conditionB: string;
  result: 'cancel' | 'blocked' | 'special';
  description: string;
}

export interface Preset {
  id: string;
  name: string;
  playerCount: number;
  difficulty: 1 | 2 | 3;
  roles: string[];
  metaAnalysis: string;        // Description of gameplay dynamics
  useBury?: boolean;
  isCustom?: boolean;
  createdAt?: number;
}

export interface PresetGeneratorOptions {
  playerCount: number;
  difficulty: 1 | 2 | 3;
  lockedRoles: string[];  // Must-include roles
  allowBury?: boolean;
  allowGreys?: boolean;
  allowConditions?: boolean;
}

export interface GeneratorState {
  roles: string[];
  blueCount: number;
  redCount: number;
  greyCount: number;
  remainingSlots: number;
  baselinePerTeam: number;
  useBury?: boolean;
  buryRolesAdded?: boolean;
  ambassadorCount?: number;
}

export interface RolePool {
  available: string[];
  weights: Map<string, number>;
}
