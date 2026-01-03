import React, { useRef } from 'react';
import { GameTimer, TimerStatus } from '../types';
import { TIMER_COLORS } from '../constants';

interface TimerViewProps {
  timers: GameTimer[];
  onToggle: (id: string) => void;
  onReset: (id: string) => void;
  usedTimerIds?: string[];
}

export const TimerView: React.FC<TimerViewProps> = ({ timers, onToggle, onReset, usedTimerIds = [] }) => {
  // Refs to handle long press logic per timer
  // We use instance-specific handling via closures or careful event management.
  // Using refs here works because the events are synchronous to the user interaction sequence.
  
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);
  // Track if the pointer down actually originated on this element
  const isPressed = useRef(false);

  const handlePointerDown = (id: string) => {
    isPressed.current = true;
    isLongPress.current = false;
    timeoutRef.current = setTimeout(() => {
      isLongPress.current = true;
      if (navigator.vibrate) navigator.vibrate(50);
      onReset(id);
    }, 500);
  };

  const handlePointerUp = (id: string) => {
    // If we weren't pressing this element (e.g. ghost click from overlay close), ignore
    if (!isPressed.current) return;
    
    isPressed.current = false;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (!isLongPress.current) {
      onToggle(id);
    }
  };

  const handlePointerCancel = () => {
    isPressed.current = false;
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

  const getTimerStyles = (timer: GameTimer) => {
    if (timer.status === TimerStatus.RUNNING && timer.remainingSeconds < 30) {
      return TIMER_COLORS['warning'];
    }
    return TIMER_COLORS[timer.status];
  };

  // Calculate text size based on number of timers
  const getTextSizeClass = (timerCount: number) => {
    if (timerCount === 3) return 'text-7xl';
    if (timerCount === 4) return 'text-6xl';
    if (timerCount >= 5) return 'text-5xl';
    return 'text-7xl';
  };

  const textSizeClass = getTextSizeClass(timers.length);

  return (
    <div className="flex flex-col gap-2 h-full">
      {timers.map((timer) => {
        const isUsed = usedTimerIds.includes(timer.id);
        return (
          <button
            key={timer.id}
            onPointerDown={() => handlePointerDown(timer.id)}
            onPointerUp={() => handlePointerUp(timer.id)}
            onPointerLeave={handlePointerCancel}
            onPointerCancel={handlePointerCancel}
            onContextMenu={(e) => e.preventDefault()}
            className={`
              w-full flex-1 rounded-[40px] border-4 flex items-center justify-center
              ${textSizeClass} font-black tracking-tighter transition-[transform,colors,shadow,opacity] duration-300
              active:scale-95 touch-manipulation shadow-2xl select-none min-h-0
              ${getTimerStyles(timer)}
              ${isUsed ? 'opacity-40' : ''}
            `}
          >
            {formatTime(timer.remainingSeconds)}
          </button>
        );
      })}
    </div>
  );
};