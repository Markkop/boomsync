
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
  activeTab: 'timers' | 'shuffle';
  isEditingPlayers: boolean;
  isBombSoundOn: boolean;
}

export type SyncMessage = 
  | { type: 'SYNC_STATE'; state: GameState }
  | { type: 'HEARTBEAT'; peerId: string }
  | { type: 'CONNECTION_COUNT'; count: number }
  | { type: 'ROOM_DELETED' }
  | { type: 'REQUEST_STATE' }
  | { type: 'EXPLOSION' };
