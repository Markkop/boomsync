import React, { useRef, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { GameTimer, TimerStatus } from '../types';
import { TIMER_COLORS } from '../constants';
import { Icon } from './Icon';

interface FullscreenTimerProps {
  timer: GameTimer;
  onToggle: (id: string) => void;
  onReset: (id: string) => void;
  onToggleDarken: (id: string) => void;
  onClose: () => void;
  roomCode?: string | null;
  isConnected?: boolean;
  onShare?: () => void;
  isUsed?: boolean;
  isSoundOn?: boolean;
  onToggleSound?: () => void;
}

export const FullscreenTimer: React.FC<FullscreenTimerProps> = ({ timer, onToggle, onReset, onToggleDarken, onClose, roomCode, isConnected, onShare, isUsed = false, isSoundOn = true, onToggleSound }) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  const getRoomLink = useMemo(() => {
    if (!roomCode) return '';
    const url = new URL(window.location.href);
    url.searchParams.set('room', roomCode);
    return url.toString();
  }, [roomCode]);

  const handlePointerDown = () => {
    isLongPress.current = false;
    timeoutRef.current = setTimeout(() => {
      isLongPress.current = true;
      if (navigator.vibrate) navigator.vibrate(50);
      
      // For idle timers, toggle darken state
      // For other states (running, alarming), use reset behavior
      if (timer.status === TimerStatus.IDLE) {
        onToggleDarken(timer.id);
      } else {
        onReset(timer.id);
      }
    }, 150);
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
      {/* Sound Toggle Button - Bottom Left */}
      {onToggleSound && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onToggleSound();
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          onPointerUp={(e) => {
            e.stopPropagation();
          }}
          className="absolute bottom-6 left-6 p-4 bg-black/20 text-white rounded-full hover:bg-black/30 backdrop-blur-sm transition-all active:scale-95 z-50"
        >
          <Icon name={isSoundOn ? "volumeOn" : "volumeOff"} size={32} className="rotate-90" />
        </button>
      )}

      {/* Share Button - Bottom Right, Vertical Style */}
      {onShare && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onShare();
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          onPointerUp={(e) => {
            e.stopPropagation();
          }}
          className="absolute bottom-6 right-6 p-4 bg-black/20 text-white rounded-full hover:bg-black/30 backdrop-blur-sm transition-all active:scale-95 z-50"
        >
          <Icon name="share" size={32} className="rotate-90" />
        </button>
      )}

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
        <div className={`text-[25vh] font-black tracking-tighter leading-none drop-shadow-lg tabular-nums transition-opacity duration-300 ${isUsed ? 'opacity-40' : ''}`}>
          {formatTime(timer.remainingSeconds)}
        </div>
        <div className="mt-8 flex flex-col items-center gap-2">
            {isConnected && roomCode && (
              <div className="flex flex-col items-center gap-3 mt-4">
                <div className="text-base font-mono font-bold tracking-normal opacity-80 text-current">
                  boom.markkop.dev
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold uppercase tracking-widest opacity-70 text-current">
                    ROOM CODE:
                  </div>
                  <div className="text-sm font-mono font-bold tracking-wider opacity-90 text-current">
                    {roomCode}
                  </div>
                </div>
                {getRoomLink && (
                  <div className="flex flex-col items-center gap-2 mt-2">
                    <div className="p-2 bg-black/30 rounded-xl backdrop-blur-sm">
                      <QRCodeSVG 
                        value={getRoomLink} 
                        size={120}
                        fgColor="currentColor"
                        bgColor="transparent"
                        className="opacity-90"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
        </div>
      </div>
      
    </div>
  );
};