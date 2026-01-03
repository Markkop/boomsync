import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  GameState, 
  TimerStatus, 
  GameTimer, 
  Player, 
  SyncMessage 
} from './types';
import { 
  ROUND_PRESETS, 
  ALARM_SOUNDS, 
  INITIAL_PLAYERS_COUNT,
  COUNTDOWN_SOUND_URL,
  EXPLOSION_SOUND_URL
} from './constants';
import { TimerView } from './components/TimerView';
import { ShuffleView } from './components/ShuffleView';
import { SyncModal } from './components/SyncModal';
import { ConfigModal } from './components/ConfigModal';
import { FullscreenTimer } from './components/FullscreenTimer';
import { Icon } from './components/Icon';
import { peerService } from './services/peerService';

const STORAGE_KEY = 'boomsync_state';
const PREFS_STORAGE_KEY = 'boomsync_prefs';

// Local preferences (not synced)
interface LocalPreferences {
  isSoundOn: boolean;
  selectedSound: string;
  autoFullscreen: boolean;
  volume: number; // 0.0 to 1.0, defaults to 1.0
}

const App: React.FC = () => {
  // --- State Initialization ---
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure usedTimerIds exists for backward compatibility
      if (!parsed.usedTimerIds) {
        parsed.usedTimerIds = [];
      }
      // Ensure activeTab exists for backward compatibility
      if (parsed.activeTab === undefined) {
        parsed.activeTab = 'timers';
      }
      // Ensure isEditingPlayers exists for backward compatibility
      if (parsed.isEditingPlayers === undefined) {
        parsed.isEditingPlayers = true;
      }
      // Ensure isBombSoundOn exists for backward compatibility
      if (parsed.isBombSoundOn === undefined) {
        parsed.isBombSoundOn = true;
      }
      // Remove old isSoundOn and selectedSound if present (migration)
      delete parsed.isSoundOn;
      delete parsed.selectedSound;
      return parsed;
    }
    
    return {
      timers: [
        { id: '3', initialSeconds: 180, remainingSeconds: 180, status: TimerStatus.IDLE },
        { id: '2', initialSeconds: 120, remainingSeconds: 120, status: TimerStatus.IDLE },
        { id: '1', initialSeconds: 60, remainingSeconds: 60, status: TimerStatus.IDLE },
      ],
      players: Array.from({ length: INITIAL_PLAYERS_COUNT }, (_, i) => ({ id: `${Date.now()}-${i}`, name: '' })),
      roomA: [],
      roomB: [],
      roundCount: 3,
      usedTimerIds: [],
      activeTab: 'timers',
      isEditingPlayers: true,
      isBombSoundOn: true
    };
  });

  // Local preferences (NOT synced - individual per user)
  const [localPrefs, setLocalPrefs] = useState<LocalPreferences>(() => {
    const saved = localStorage.getItem(PREFS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure volume exists for backward compatibility
      if (parsed.volume === undefined) {
        parsed.volume = 1.0;
      }
      return parsed;
    }
    return {
      isSoundOn: true,
      selectedSound: ALARM_SOUNDS[0].url,
      autoFullscreen: true,
      volume: 1.0
    };
  });

  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [initialRoomCode, setInitialRoomCode] = useState<string>('');
  const [isHost, setIsHost] = useState(true);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionCount, setConnectionCount] = useState(0);
  
  // Fullscreen state
  const [fullscreenTimerId, setFullscreenTimerId] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const beepAudioRef = useRef<HTMLAudioElement | null>(null);
  const explosionAudioRef = useRef<HTMLAudioElement | null>(null);
  const gameStateRef = useRef<GameState>(gameState);

  // Keep ref updated for use in callbacks
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
  }, [gameState]);

  // Persist local preferences
  useEffect(() => {
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(localPrefs));
  }, [localPrefs]);

  // --- Audio Init ---
  useEffect(() => {
    beepAudioRef.current = new Audio(COUNTDOWN_SOUND_URL);
    beepAudioRef.current.volume = localPrefs.volume;
    explosionAudioRef.current = new Audio(EXPLOSION_SOUND_URL);
    explosionAudioRef.current.volume = localPrefs.volume;
  }, []);

  // Update audio volumes when volume preference changes
  useEffect(() => {
    if (beepAudioRef.current) {
      beepAudioRef.current.volume = localPrefs.volume;
    }
    if (audioRef.current) {
      audioRef.current.volume = localPrefs.volume;
    }
    if (explosionAudioRef.current) {
      explosionAudioRef.current.volume = localPrefs.volume;
    }
  }, [localPrefs.volume]);

  // --- Deep Link Detection ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomCode = params.get('room');
    if (roomCode) {
      setInitialRoomCode(roomCode);
      setShowSyncModal(true);
    }
  }, []);

  // --- P2P Sync Logic ---
  const broadcastState = useCallback((state: GameState) => {
    peerService.send({ type: 'SYNC_STATE', state });
  }, []);

  // Track host status and connection state
  useEffect(() => {
    const updateConnectionState = () => {
      setIsHost(peerService.getIsHost());
      const code = peerService.getRoomCode();
      setRoomCode(code);
      setIsConnected(code !== null);
      setConnectionCount(peerService.getConnectionCount());
    };
    
    peerService.onConnected(updateConnectionState);
    peerService.onDisconnected(updateConnectionState);
    peerService.onConnectionCountChange((count) => {
      setConnectionCount(count);
    });
    
    // Handle room deletion (host left)
    peerService.onRoomDeleted(() => {
      setIsConnected(false);
      setRoomCode(null);
      setIsHost(true);
      // Clear URL parameter
      const url = new URL(window.location.href);
      url.searchParams.delete('room');
      window.history.replaceState({}, '', url.toString());
    });
    
    // Initial check
    updateConnectionState();
    
    // Periodic check for connection count
    const interval = setInterval(updateConnectionState, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsubscribe = peerService.onMessage((msg: SyncMessage) => {
      if (msg.type === 'SYNC_STATE') {
        setGameState(msg.state);
      }
      
      // Handle REQUEST_STATE - send current state to newly connected joiner
      if (msg.type === 'REQUEST_STATE' && peerService.getIsHost()) {
        // Send current state to the requester
        peerService.send({ type: 'SYNC_STATE', state: gameStateRef.current });
      }
      
      // Handle EXPLOSION message - play explosion sound locally
      if (msg.type === 'EXPLOSION') {
        if (localPrefs.isSoundOn && explosionAudioRef.current) {
          explosionAudioRef.current.currentTime = 0;
          explosionAudioRef.current.volume = localPrefs.volume;
          explosionAudioRef.current.play().catch(() => {});
        }
        
        // Reset the 1:00 timer (id === '1') after explosion
        setGameState(prev => {
          const nextTimers = prev.timers.map(t => {
            if (t.id === '1' && t.status === TimerStatus.READY_TO_BOOM) {
              return { ...t, status: TimerStatus.IDLE, remainingSeconds: t.initialSeconds };
            }
            return t;
          });
          return { ...prev, timers: nextTimers };
        });
      }
    });
    
    return unsubscribe;
  }, [localPrefs.isSoundOn, localPrefs.volume]);

  // --- Countdown Beep Logic ---
  useEffect(() => {
    if (!localPrefs.isSoundOn) return;

    const shouldBeep = gameState.timers.some(t => {
      if (t.status === TimerStatus.RUNNING) {
        const elapsed = t.initialSeconds - t.remainingSeconds;
        // Beep at 1s (:59), 2s (:58), and 3s (:57) elapsed
        return elapsed >= 1 && elapsed <= 3;
      }
      return false;
    });

    if (shouldBeep && beepAudioRef.current) {
      beepAudioRef.current.currentTime = 0;
      beepAudioRef.current.play().catch(() => {
        // Ignore play errors
      });
    }
  }, [gameState.timers, localPrefs.isSoundOn]);

  // --- Timer Logic ---
  // Only run timer interval on the host to prevent multiple timers running simultaneously
  useEffect(() => {
    // If not the host, don't run the timer interval
    if (!isHost) return;

    const interval = setInterval(() => {
      setGameState(prev => {
        const anyRunning = prev.timers.some(t => t.status === TimerStatus.RUNNING);
        if (!anyRunning) return prev;

        const nextTimers = prev.timers.map(t => {
          if (t.status === TimerStatus.RUNNING) {
            const nextRemaining = Math.max(0, t.remainingSeconds - 1);
            if (nextRemaining === 0) {
              // Play alarm sound locally based on local preference
              if (localPrefs.isSoundOn && audioRef.current) {
                audioRef.current.src = localPrefs.selectedSound;
                audioRef.current.volume = localPrefs.volume;
                audioRef.current.play().catch(e => console.error("Audio playback blocked", e));
              }
              return { ...t, remainingSeconds: 0, status: TimerStatus.ALARMING };
            }
            return { ...t, remainingSeconds: nextRemaining };
          }
          return t;
        });

        // Handle usedTimerIds when timer reaches ALARMING
        let nextUsedTimerIds = [...prev.usedTimerIds];
        const alarmingTimer = nextTimers.find(t => t.status === TimerStatus.ALARMING && prev.timers.find(pt => pt.id === t.id)?.status !== TimerStatus.ALARMING);
        
        if (alarmingTimer) {
          // If 1:00 timer (id === '1'), clear all used timers
          if (alarmingTimer.id === '1') {
            nextUsedTimerIds = [];
          } else {
            // Otherwise, add to used timers if not already present
            if (!nextUsedTimerIds.includes(alarmingTimer.id)) {
              nextUsedTimerIds = [...nextUsedTimerIds, alarmingTimer.id];
            }
          }
        }

        const newState = { ...prev, timers: nextTimers, usedTimerIds: nextUsedTimerIds };
        broadcastState(newState);
        return newState;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [broadcastState, isHost, localPrefs.isSoundOn, localPrefs.selectedSound]);

  // Play alarm sound when timer enters ALARMING state (for non-hosts)
  useEffect(() => {
    if (!localPrefs.isSoundOn) return;
    
    const alarmingTimer = gameState.timers.find(t => t.status === TimerStatus.ALARMING);
    if (alarmingTimer && audioRef.current) {
      // Only play if not already playing
      if (audioRef.current.paused) {
        audioRef.current.src = localPrefs.selectedSound;
        audioRef.current.volume = localPrefs.volume;
        audioRef.current.play().catch(() => {});
      }
    }
  }, [gameState.timers, localPrefs.isSoundOn, localPrefs.selectedSound]);

  const toggleTimer = (id: string) => {
    setGameState(prev => {
      const timer = prev.timers.find(t => t.id === id);
      let nextUsedTimerIds = prev.usedTimerIds;
      const wasAlarming = timer?.status === TimerStatus.ALARMING;
      const wasReadyToBoom = timer?.status === TimerStatus.READY_TO_BOOM;
      
      // When resuming a timer (IDLE -> RUNNING), remove it from darkened state
      if (timer?.status === TimerStatus.IDLE) {
        nextUsedTimerIds = prev.usedTimerIds.filter(timerId => timerId !== id);
      }
      
      const nextTimers = prev.timers.map(t => {
        if (t.id === id) {
          if (t.status === TimerStatus.IDLE) return { ...t, status: TimerStatus.RUNNING };
          if (t.status === TimerStatus.RUNNING) return { ...t, status: TimerStatus.IDLE };
          if (t.status === TimerStatus.ALARMING) {
            if (audioRef.current) audioRef.current.pause();
            // For 1:00 timer with bomb sound enabled, go to READY_TO_BOOM state
            if (id === '1' && prev.isBombSoundOn) {
              return { ...t, status: TimerStatus.READY_TO_BOOM };
            }
            // Otherwise, reset to IDLE
            return { ...t, status: TimerStatus.IDLE, remainingSeconds: t.initialSeconds };
          }
          if (t.status === TimerStatus.READY_TO_BOOM) {
            // Trigger explosion: broadcast EXPLOSION message and reset timer
            peerService.send({ type: 'EXPLOSION' });
            // Play explosion sound locally
            if (localPrefs.isSoundOn && explosionAudioRef.current) {
              explosionAudioRef.current.currentTime = 0;
              explosionAudioRef.current.volume = localPrefs.volume;
              explosionAudioRef.current.play().catch(() => {});
            }
            return { ...t, status: TimerStatus.IDLE, remainingSeconds: t.initialSeconds };
          }
        }
        return t;
      });
      const newState = { ...prev, timers: nextTimers, usedTimerIds: nextUsedTimerIds };
      
      // Don't broadcast when resetting an alarming timer - each user handles locally
      // But DO broadcast when transitioning from ALARMING to READY_TO_BOOM
      if (!wasAlarming && !wasReadyToBoom) {
        broadcastState(newState);
      } else if (wasAlarming && id === '1' && prev.isBombSoundOn) {
        // Broadcast the transition to READY_TO_BOOM
        broadcastState(newState);
      }
      return newState;
    });
  };

  const resetTimer = (id: string) => {
    setGameState(prev => {
      const timer = prev.timers.find(t => t.id === id);
      const wasAlarming = timer?.status === TimerStatus.ALARMING;
      const wasReadyToBoom = timer?.status === TimerStatus.READY_TO_BOOM;
      
      // If alarming, stop audio
      if (wasAlarming) {
        if (audioRef.current) audioRef.current.pause();
      }

      const nextTimers = prev.timers.map(t => {
        if (t.id === id) {
          return { ...t, status: TimerStatus.IDLE, remainingSeconds: t.initialSeconds };
        }
        return t;
      });
      
      // Remove from usedTimerIds when reset
      const nextUsedTimerIds = prev.usedTimerIds.filter(timerId => timerId !== id);
      
      const newState = { ...prev, timers: nextTimers, usedTimerIds: nextUsedTimerIds };
      
      // Don't broadcast when resetting an alarming timer - each user handles locally
      // Also don't broadcast when resetting READY_TO_BOOM (handled by explosion)
      if (!wasAlarming && !wasReadyToBoom) {
        broadcastState(newState);
      }
      return newState;
    });
  };

  const toggleDarkenTimer = (id: string) => {
    setGameState(prev => {
      const timer = prev.timers.find(t => t.id === id);
      const isDarkened = prev.usedTimerIds.includes(id);
      
      // Only toggle darken for idle timers
      if (timer?.status === TimerStatus.IDLE) {
        let nextUsedTimerIds: string[];
        let nextTimers = prev.timers;
        
        if (isDarkened) {
          // Remove from darkened state (no timer reset)
          nextUsedTimerIds = prev.usedTimerIds.filter(timerId => timerId !== id);
        } else {
          // Add to darkened state AND reset the timer
          nextUsedTimerIds = [...prev.usedTimerIds, id];
          nextTimers = prev.timers.map(t => 
            t.id === id 
              ? { ...t, remainingSeconds: t.initialSeconds } 
              : t
          );
        }
        
        const newState = { ...prev, timers: nextTimers, usedTimerIds: nextUsedTimerIds };
        broadcastState(newState);
        return newState;
      }
      
      // For non-idle timers, fall back to reset behavior
      return prev;
    });
  };
  
  // Wrapper for timer click to handle fullscreen logic
  const handleTimerClick = (id: string) => {
    const timer = gameState.timers.find(t => t.id === id);
    if (timer && timer.status === TimerStatus.IDLE && localPrefs.autoFullscreen) {
      setFullscreenTimerId(id);
    }
    // Exit fullscreen if clicking an expired timer that's currently in fullscreen (but not READY_TO_BOOM)
    if (timer && timer.status === TimerStatus.ALARMING && fullscreenTimerId === id) {
      setFullscreenTimerId(null);
    }
    // Close fullscreen when explosion happens (READY_TO_BOOM -> IDLE)
    if (timer && timer.status === TimerStatus.READY_TO_BOOM && fullscreenTimerId === id) {
      setFullscreenTimerId(null);
    }
    toggleTimer(id);
  };

  // Wrapper for timer reset (Hold to Stop)
  const handleTimerReset = (id: string) => {
    resetTimer(id);
    if (fullscreenTimerId === id) {
      setFullscreenTimerId(null);
    }
  };

  // Wrapper for toggle darken (Long press on idle timer)
  const handleToggleDarken = (id: string) => {
    const timer = gameState.timers.find(t => t.id === id);
    // Only toggle darken for idle timers
    if (timer?.status === TimerStatus.IDLE) {
      toggleDarkenTimer(id);
    } else {
      // For non-idle timers, use reset behavior
      handleTimerReset(id);
    }
  };

  const cycleRoundCount = () => {
    setGameState(prev => {
      const counts = ROUND_PRESETS;
      const currentIndex = counts.indexOf(prev.roundCount);
      const nextCount = counts[(currentIndex + 1) % counts.length];
      
      const newTimers: GameTimer[] = [];
      for (let i = nextCount; i >= 1; i--) {
        newTimers.push({
          id: i.toString(),
          initialSeconds: i * 60,
          remainingSeconds: i * 60,
          status: TimerStatus.IDLE
        });
      }

      const newState = { ...prev, roundCount: nextCount, timers: newTimers, usedTimerIds: [] };
      broadcastState(newState);
      return newState;
    });
  };

  // --- Shuffle Logic ---
  const handleShuffle = (players: Player[]) => {
    const validPlayers = players.filter(p => p.name.trim() !== '').map(p => p.name);
    if (validPlayers.length < 2) return;

    const shuffled = [...validPlayers].sort(() => Math.random() - 0.5);
    const mid = Math.ceil(shuffled.length / 2);
    const roomA = shuffled.slice(0, mid);
    const roomB = shuffled.slice(mid);

    setGameState(prev => {
      const newState = { ...prev, players, roomA, roomB };
      broadcastState(newState);
      return newState;
    });
  };

  const updatePlayers = (players: Player[]) => {
    setGameState(prev => {
      const newState = { ...prev, players };
      broadcastState(newState);
      return newState;
    });
  };

  const setActiveTab = (tab: 'timers' | 'shuffle') => {
    setGameState(prev => {
      const newState = { ...prev, activeTab: tab };
      broadcastState(newState);
      return newState;
    });
  };

  const setIsEditingPlayers = (editing: boolean) => {
    setGameState(prev => {
      const newState = { ...prev, isEditingPlayers: editing };
      broadcastState(newState);
      return newState;
    });
  };

  // Toggle sound on/off (local only, not synced)
  const toggleSound = () => {
    setLocalPrefs(prev => ({ ...prev, isSoundOn: !prev.isSoundOn }));
  };

  // Set volume (local only, not synced)
  // When volume is 0, sound is off; when > 0, sound is on
  const setVolume = (volume: number) => {
    setLocalPrefs(prev => {
      const newVolume = Math.max(0, Math.min(1, volume)); // Clamp between 0 and 1
      let newIsSoundOn = prev.isSoundOn;
      
      // If volume is set to 0, turn sound off
      if (newVolume === 0) {
        newIsSoundOn = false;
      } 
      // If volume is changed from 0 to > 0, or changed while sound is off, turn sound on
      else if (prev.volume === 0 || !prev.isSoundOn) {
        newIsSoundOn = true;
      }
      
      return { ...prev, volume: newVolume, isSoundOn: newIsSoundOn };
    });
  };

  // Change selected alarm sound (local only, not synced)
  const selectSound = (url: string) => {
    setLocalPrefs(prev => ({ ...prev, selectedSound: url }));
  };

  // Toggle auto fullscreen (local only)
  const toggleAutoFullscreen = () => {
    setLocalPrefs(prev => ({ ...prev, autoFullscreen: !prev.autoFullscreen }));
  };

  // Toggle bomb sound (synced setting)
  const toggleBombSound = useCallback(() => {
    setGameState(prev => {
      const newState = { ...prev, isBombSoundOn: !prev.isBombSoundOn };
      broadcastState(newState);
      return newState;
    });
  }, [broadcastState]);

  // Find active fullscreen timer
  const activeFullscreenTimer = fullscreenTimerId 
    ? gameState.timers.find(t => t.id === fullscreenTimerId) 
    : null;

  // Handle share button click - create new room and copy link, or disconnect if already connected
  const handleShare = async () => {
    // If already connected or hosting, disconnect instead
    if (isConnected) {
      if (isHost) {
        // Host: delete room (notify all joiners)
        peerService.deleteRoom();
      } else {
        // Joiner: just disconnect
        peerService.disconnect();
      }
      setIsConnected(false);
      setRoomCode(null);
      setIsHost(true);
      setConnectionCount(0);
      
      // Clear room code from URL
      const url = new URL(window.location.href);
      url.searchParams.delete('room');
      window.history.replaceState({}, '', url.toString());
      return;
    }
    
    // If not connected, create new room and copy link
    try {
      const generateShortCode = () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
      };
      
      const code = generateShortCode();
      const id = await peerService.init(code);
      setRoomCode(id);
      setIsConnected(true);
      setIsHost(true);
      setConnectionCount(1);
      
      // Copy link to clipboard
      const url = new URL(window.location.href);
      url.searchParams.set('room', id);
      await navigator.clipboard.writeText(url.toString());
    } catch (e) {
      console.error("Failed to create room:", e);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto relative select-none">
      <audio ref={audioRef} loop />
      
      {/* Fullscreen Timer Overlay */}
      {activeFullscreenTimer && (
        <FullscreenTimer 
          timer={activeFullscreenTimer} 
          onToggle={handleTimerClick}
          onReset={handleTimerReset}
          onToggleDarken={handleToggleDarken}
          onClose={() => setFullscreenTimerId(null)}
          roomCode={roomCode}
          isConnected={isConnected}
          onShare={handleShare}
          isUsed={gameState.usedTimerIds.includes(activeFullscreenTimer.id)}
          isSoundOn={localPrefs.isSoundOn}
          onToggleSound={toggleSound}
        />
      )}
      
      {/* Top Bar */}
      <header className="flex items-center justify-between p-4 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 border-b border-zinc-900">
        <div className="flex gap-2">
          <button 
            onClick={() => setShowConfigModal(true)}
            className="p-2 rounded-xl bg-zinc-800 text-zinc-400 active:bg-zinc-700"
          >
            <Icon name="settings" size={20} />
          </button>
          <button 
            onClick={toggleSound}
            className={`p-2 rounded-xl bg-zinc-800 active:bg-zinc-700 ${localPrefs.isSoundOn ? 'text-cyan-400' : 'text-zinc-400'}`}
          >
            <Icon name={localPrefs.isSoundOn ? "volumeOn" : "volumeOff"} size={20} />
          </button>
          <button 
            onClick={toggleAutoFullscreen}
            className={`p-2 rounded-xl bg-zinc-800 active:bg-zinc-700 ${localPrefs.autoFullscreen ? 'text-purple-400' : 'text-zinc-400'}`}
          >
            <Icon name="proportions" size={20} />
          </button>
          <button 
            onClick={toggleBombSound}
            className={`p-2 rounded-xl bg-zinc-800 active:bg-zinc-700 ${gameState.isBombSoundOn ? 'text-orange-400' : 'text-zinc-400'}`}
          >
            <Icon name="bomb" size={20} />
          </button>
        </div>

        <button 
          onClick={cycleRoundCount}
          className="flex items-center gap-2 bg-zinc-800 px-3 py-2 rounded-xl text-zinc-300 font-bold active:scale-95 transition-transform"
        >
          <Icon name="timer" size={18} className="text-cyan-400" />
          <span>{gameState.roundCount} Rounds</span>
        </button>

        <button 
          onClick={() => setShowSyncModal(true)}
          className={`p-2 rounded-xl bg-zinc-800 active:bg-zinc-700 transition-colors relative ${isConnected ? 'text-green-400' : 'text-zinc-400'}`}
        >
          <Icon name="share" size={20} />
          {isConnected && connectionCount > 1 && (
            <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {connectionCount}
            </span>
          )}
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden pb-24 px-4 pt-4 flex flex-col">
        {gameState.activeTab === 'timers' ? (
          <TimerView 
            timers={gameState.timers} 
            onToggle={handleTimerClick} 
            onReset={handleTimerReset}
            onToggleDarken={handleToggleDarken}
            usedTimerIds={gameState.usedTimerIds}
          />
        ) : (
          <div className="overflow-y-auto no-scrollbar flex-1">
            <ShuffleView 
              players={gameState.players}
              roomA={gameState.roomA}
              roomB={gameState.roomB}
              onUpdatePlayers={updatePlayers}
              onShuffle={handleShuffle}
              isEditing={gameState.isEditingPlayers}
              onSetEditing={setIsEditingPlayers}
            />
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-zinc-950 border-t border-zinc-900 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex z-40 w-full">
        <button 
          onClick={() => setActiveTab('timers')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl transition-all min-w-0 ${gameState.activeTab === 'timers' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-zinc-500 hover:bg-zinc-900'}`}
        >
          <Icon name="timer" size={20} />
          <span className="font-semibold">Timer</span>
        </button>
        <button 
          onClick={() => setActiveTab('shuffle')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl transition-all min-w-0 ${gameState.activeTab === 'shuffle' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-zinc-500 hover:bg-zinc-900'}`}
        >
          <Icon name="users" size={20} />
          <span className="font-semibold">Shuffle</span>
        </button>
      </nav>

      {/* Modals */}
      {showConfigModal && (
        <ConfigModal
          isSoundOn={localPrefs.isSoundOn}
          toggleSound={toggleSound}
          autoFullscreen={localPrefs.autoFullscreen}
          toggleAutoFullscreen={toggleAutoFullscreen}
          isBombSoundOn={gameState.isBombSoundOn}
          toggleBombSound={toggleBombSound}
          selectedSound={localPrefs.selectedSound}
          onSelectSound={selectSound}
          volume={localPrefs.volume}
          onVolumeChange={setVolume}
          onClose={() => setShowConfigModal(false)}
        />
      )}
      
      {showSyncModal && (
        <SyncModal 
          initialCode={initialRoomCode}
          onClose={() => setShowSyncModal(false)} 
          onToggle={() => setShowSyncModal(false)}
        />
      )}
    </div>
  );
};

export default App;
