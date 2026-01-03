import React, { useRef } from 'react';
import { GameTimer, TimerStatus } from '../types';
import { TIMER_COLORS } from '../constants';
import { Icon } from './Icon';

interface FullscreenTimerProps {
  timer: GameTimer;
  onToggle: (id: string) => void;
  onReset: (id: string) => void;
  onClose: () => void;
}

export const FullscreenTimer: React.FC<FullscreenTimerProps> = ({ timer, onToggle, onReset, onClose }) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  const handlePointerDown = () => {
    isLongPress.current = false;
    timeoutRef.current = setTimeout(() => {
      isLongPress.current = true;
      if (navigator.vibrate) navigator.vibrate(50);
      onReset(timer.id);
    }, 500);
  };

  const handlePointerUp = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (!isLongPress.current) {
      onToggle(timer.id);
    }
  };

  const handlePointerCancel = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getBackgroundStyle = () => {
    if (timer.status === TimerStatus.RUNNING && timer.remainingSeconds < 30) {
      return TIMER_COLORS['warning'];
    }
    return TIMER_COLORS[timer.status];
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center ${getBackgroundStyle()} transition-colors duration-500 select-none touch-none`}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerCancel}
      onPointerCancel={handlePointerCancel}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Close Button */}
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
        }}
        className="absolute top-6 right-6 p-4 bg-black/20 text-white rounded-full hover:bg-black/30 backdrop-blur-sm transition-all active:scale-95 z-50"
      >
        <Icon name="shrink" size={32} />
      </button>

      {/* Main Content - Rotated 90 degrees for 'table mode' */}
      <div className="transform rotate-90 flex flex-col items-center justify-center w-screen h-screen pointer-events-none text-current">
        <div className="text-[25vh] font-black tracking-tighter leading-none drop-shadow-lg tabular-nums">
          {formatTime(timer.remainingSeconds)}
        </div>
        <div className="mt-8 flex flex-col items-center gap-2">
            <div className="text-2xl font-bold uppercase tracking-[0.5em] opacity-80">
            {timer.status === TimerStatus.IDLE ? 'TAP TO START' : 
            timer.status === TimerStatus.RUNNING ? 'TAP TO PAUSE' : 'TIME UP'}
            </div>
            <div className="text-sm font-semibold uppercase tracking-widest opacity-50 animate-pulse">
            Hold to Stop
            </div>
        </div>
      </div>
      
      {/* Pulse effect overlay for alarm */}
      {timer.status === TimerStatus.ALARMING && (
        <div className="absolute inset-0 bg-white/30 animate-pulse pointer-events-none"></div>
      )}
    </div>
  );
};