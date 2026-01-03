
import { TimerStatus } from './types';

export const ROUND_PRESETS = [3, 4, 5];

export const TIMER_COLORS = {
  [TimerStatus.IDLE]: 'bg-zinc-800 border-zinc-700 text-zinc-400',
  [TimerStatus.RUNNING]: 'bg-emerald-600 border-emerald-400 text-white neon-border-cyan',
  'warning': 'bg-amber-500 border-amber-300 text-zinc-900',
  [TimerStatus.ALARMING]: 'bg-rose-600 border-rose-400 text-white animate-pulse'
};

export const ALARM_SOUNDS = [
  { id: 'beep', name: 'Digital Beep', url: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg' },
  { id: 'radar', name: 'Classic Alarm', url: 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg' },
  { id: 'sci-fi', name: 'Tech Alert', url: 'https://actions.google.com/sounds/v1/emergency/emergency_siren_short_burst.ogg' },
  { id: 'chime', name: 'Success Chime', url: 'https://actions.google.com/sounds/v1/cartoon/clown_horn.ogg' }
];

export const COUNTDOWN_SOUND_URL = 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg';

export const INITIAL_PLAYERS_COUNT = 6;