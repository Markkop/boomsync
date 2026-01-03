
export enum TimerStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  ALARMING = 'alarming'
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
  roundCount: number;
  isSoundOn: boolean;
  selectedSound: string;
  usedTimerIds: string[];
}

export type SyncMessage = 
  | { type: 'SYNC_STATE'; state: GameState }
  | { type: 'HEARTBEAT' }
  | { type: 'CONNECTION_COUNT'; count: number };
