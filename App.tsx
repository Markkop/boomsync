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
  COUNTDOWN_SOUND_URL
} from './constants';
import { TimerView } from './components/TimerView';
import { ShuffleView } from './components/ShuffleView';
import { SyncModal } from './components/SyncModal';
import { ConfigModal } from './components/ConfigModal';
import { FullscreenTimer } from './components/FullscreenTimer';
import { Icon } from './components/Icon';
import { peerService } from './services/peerService';

const STORAGE_KEY = 'boomsync_state';

const App: React.FC = () => {
  // --- State Initialization ---
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    
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
      isSoundOn: true,
      selectedSound: ALARM_SOUNDS[0].url
    };
  });

  const [activeTab, setActiveTab] = useState<'timers' | 'shuffle'>('timers');
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [initialRoomCode, setInitialRoomCode] = useState<string>('');
  const [isHost, setIsHost] = useState(true); // Track if this peer is the host
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // New Feature States
  const [autoFullscreen, setAutoFullscreen] = useState(true);
  const [fullscreenTimerId, setFullscreenTimerId] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const beepAudioRef = useRef<HTMLAudioElement | null>(null);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
  }, [gameState]);

  // --- Audio Init ---
  useEffect(() => {
    beepAudioRef.current = new Audio(COUNTDOWN_SOUND_URL);
    beepAudioRef.current.volume = 1.0;
  }, []);

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
    };
    
    // Update connection state periodically and on connection events
    const interval = setInterval(updateConnectionState, 100);
    peerService.onConnected(updateConnectionState);
    
    // Initial check
    updateConnectionState();
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    peerService.onMessage((msg: SyncMessage) => {
      if (msg.type === 'SYNC_STATE') {
        setGameState(msg.state);
      }
      // CONNECTION_COUNT messages are handled by SyncModal directly via peerService
      // No action needed here, but we acknowledge the message type exists
    });
  }, []);

  // --- Countdown Beep Logic ---
  useEffect(() => {
    if (!gameState.isSoundOn) return;

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
      beepAudioRef.current.play().catch(e => {
        // Ignore play errors
      });
    }
  }, [gameState.timers, gameState.isSoundOn]);

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
              if (prev.isSoundOn && audioRef.current) {
                audioRef.current.src = prev.selectedSound;
                audioRef.current.play().catch(e => console.error("Audio playback blocked", e));
              }
              return { ...t, remainingSeconds: 0, status: TimerStatus.ALARMING };
            }
            return { ...t, remainingSeconds: nextRemaining };
          }
          return t;
        });

        const newState = { ...prev, timers: nextTimers };
        broadcastState(newState);
        return newState;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [broadcastState, isHost]);

  const toggleTimer = (id: string) => {
    setGameState(prev => {
      const nextTimers = prev.timers.map(t => {
        if (t.id === id) {
          if (t.status === TimerStatus.IDLE) return { ...t, status: TimerStatus.RUNNING };
          if (t.status === TimerStatus.RUNNING) return { ...t, status: TimerStatus.IDLE };
          if (t.status === TimerStatus.ALARMING) {
             if (audioRef.current) audioRef.current.pause();
             return { ...t, status: TimerStatus.IDLE, remainingSeconds: t.initialSeconds };
          }
        }
        return t;
      });
      const newState = { ...prev, timers: nextTimers };
      broadcastState(newState);
      return newState;
    });
  };

  const resetTimer = (id: string) => {
    setGameState(prev => {
      // If alarming, stop audio
      const timer = prev.timers.find(t => t.id === id);
      if (timer?.status === TimerStatus.ALARMING) {
        if (audioRef.current) audioRef.current.pause();
      }

      const nextTimers = prev.timers.map(t => {
        if (t.id === id) {
          return { ...t, status: TimerStatus.IDLE, remainingSeconds: t.initialSeconds };
        }
        return t;
      });
      const newState = { ...prev, timers: nextTimers };
      broadcastState(newState);
      return newState;
    });
  };
  
  // Wrapper for timer click to handle fullscreen logic
  const handleTimerClick = (id: string) => {
    const timer = gameState.timers.find(t => t.id === id);
    if (timer && timer.status === TimerStatus.IDLE && autoFullscreen) {
      setFullscreenTimerId(id);
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

      const newState = { ...prev, roundCount: nextCount, timers: newTimers };
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

  // Find active fullscreen timer
  const activeFullscreenTimer = fullscreenTimerId 
    ? gameState.timers.find(t => t.id === fullscreenTimerId) 
    : null;

  // Handle share button click - create new room and copy link, or disconnect if already connected
  const handleShare = async () => {
    // If already connected or hosting, disconnect instead
    if (isConnected) {
      peerService.disconnect();
      setIsConnected(false);
      setRoomCode(null);
      setIsHost(true);
      
      // If host, clear room code from URL to prevent auto-reconnect
      if (isHost) {
        const url = new URL(window.location.href);
        url.searchParams.delete('room');
        window.history.replaceState({}, '', url.toString());
      }
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
      
      // Copy link to clipboard
      const url = new URL(window.location.href);
      url.searchParams.set('room', id);
      await navigator.clipboard.writeText(url.toString());
      
      // Optional: Show a brief notification (you could add a toast here)
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
          onClose={() => setFullscreenTimerId(null)}
          roomCode={roomCode}
          isConnected={isConnected}
          onShare={handleShare}
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
          className={`p-2 rounded-xl bg-zinc-800 active:bg-zinc-700 transition-colors ${isConnected ? 'text-green-400' : 'text-zinc-400'}`}
        >
          <Icon name="share" size={20} />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar pb-24 px-4 pt-4">
        {activeTab === 'timers' ? (
          <TimerView 
            timers={gameState.timers} 
            onToggle={handleTimerClick} 
            onReset={handleTimerReset}
          />
        ) : (
          <ShuffleView 
            players={gameState.players}
            roomA={gameState.roomA}
            roomB={gameState.roomB}
            onUpdatePlayers={updatePlayers}
            onShuffle={handleShuffle}
          />
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-zinc-950 border-t border-zinc-900 p-2 flex gap-2 z-40">
        <button 
          onClick={() => setActiveTab('timers')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl transition-all ${activeTab === 'timers' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-zinc-500 hover:bg-zinc-900'}`}
        >
          <Icon name="timer" size={20} />
          <span className="font-semibold">Timer</span>
        </button>
        <button 
          onClick={() => setActiveTab('shuffle')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl transition-all ${activeTab === 'shuffle' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-zinc-500 hover:bg-zinc-900'}`}
        >
          <Icon name="users" size={20} />
          <span className="font-semibold">Shuffle</span>
        </button>
      </nav>

      {/* Modals */}
      {showConfigModal && (
        <ConfigModal
          isSoundOn={gameState.isSoundOn}
          toggleSound={() => setGameState(p => ({...p, isSoundOn: !p.isSoundOn}))}
          autoFullscreen={autoFullscreen}
          toggleAutoFullscreen={() => setAutoFullscreen(!autoFullscreen)}
          selectedSound={gameState.selectedSound}
          onSelectSound={(url) => setGameState(p => ({...p, selectedSound: url}))}
          onClose={() => setShowConfigModal(false)}
        />
      )}
      
      {showSyncModal && (
        <SyncModal 
          initialCode={initialRoomCode}
          onClose={() => setShowSyncModal(true)} 
          onToggle={() => setShowSyncModal(false)}
        />
      )}
    </div>
  );
};

export default App;