import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  GameState, 
  TimerStatus, 
  GameTimer, 
  Player, 
  SyncMessage,
  RoleDeal
} from './types';
import { 
  ROUND_PRESETS, 
  ALARM_SOUNDS, 
  INITIAL_PLAYERS_COUNT,
  COUNTDOWN_SOUND_URL,
  EXPLOSION_SOUND_URL
} from './constants';
import { peerService } from './services/peerService';
import { wakeLockService } from './services/wakeLockService';
import { getAllCharacters } from './services/characterService';
import { dealRoles, prunePeerIdentities, shufflePlayersIntoRooms } from './services/dealService';
import { useT } from './i18n/I18nContext';
import type { CardRevealRequest } from './components/CardRevealModal';

import { normalizeGameState, emptyGameState, STORAGE_KEY, PREFS_STORAGE_KEY, LocalPreferences } from './boomSyncHelpers';

export function useBoomSyncAppCore() {

  const t = useT();
  // --- State Initialization ---
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return normalizeGameState(parsed);
      } catch (e) {
        console.warn('Failed to parse saved state, resetting:', e);
      }
    }
    
    return emptyGameState();
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
      // Ensure keepScreenAwake exists for backward compatibility (defaults to true)
      if (parsed.keepScreenAwake === undefined) {
        parsed.keepScreenAwake = true;
      }
      if (parsed.myPlayerId === undefined) {
        parsed.myPlayerId = null;
      }
      return parsed;
    }
    return {
      isSoundOn: true,
      selectedSound: ALARM_SOUNDS[0].url,
      autoFullscreen: true,
      volume: 1.0,
      keepScreenAwake: true,
      myPlayerId: null
    };
  });

  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [initialRoomCode, setInitialRoomCode] = useState<string>('');
  const [isHost, setIsHost] = useState(true);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionCount, setConnectionCount] = useState(0);
  const [connectedPeerIds, setConnectedPeerIds] = useState<string[]>([]);
  const [myPeerId, setMyPeerId] = useState<string | null>(null);
  const [cardReveal, setCardReveal] = useState<CardRevealRequest | null>(null);
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [identityDismissed, setIdentityDismissed] = useState(false);
  const lastDealIdRef = useRef<string | null>(null);
  
  // Fullscreen state
  const [fullscreenTimerId, setFullscreenTimerId] = useState<string | null>(null);
  
  // Roles modals state (local, not synced)
  const [showKeywordTooltip, setShowKeywordTooltip] = useState(false);
  const [keywordTooltipText, setKeywordTooltipText] = useState('');
  const [keywordTooltipPosition, setKeywordTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [showCharacterPeekTooltip, setShowCharacterPeekTooltip] = useState(false);
  const [characterPeekName, setCharacterPeekName] = useState<string | null>(null);
  const [characterPeekPosition, setCharacterPeekPosition] = useState<{ x: number; y: number } | null>(null);
  const [showRequiresTooltip, setShowRequiresTooltip] = useState(false);
  const [requiresTooltipData, setRequiresTooltipData] = useState<{
    requires: string[];
    requiresGroup?: string;
    characterName: string;
    position: { x: number; y: number };
  } | null>(null);
  const [lockedRoles, setLockedRoles] = useState<string[]>([]);
  
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

  // --- Wake Lock Management ---
  useEffect(() => {
    if (localPrefs.keepScreenAwake) {
      wakeLockService.enable();
    } else {
      wakeLockService.disable();
    }

    // Cleanup on unmount
    return () => {
      wakeLockService.disable();
    };
  }, [localPrefs.keepScreenAwake]);

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
      setConnectedPeerIds(peerService.getConnectedPeerIds());
      setMyPeerId(peerService.getPeerId() ?? null);
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
        setGameState(normalizeGameState(msg.state));
      }
      
      // Handle REQUEST_STATE - send current state to newly connected joiner
      if (msg.type === 'REQUEST_STATE' && peerService.getIsHost()) {
        // Send current state to the requester
        peerService.send({ type: 'SYNC_STATE', state: gameStateRef.current });
      }

      if (msg.type === 'SET_IDENTITY') {
        setGameState(prev => {
          const nextIdentities = { ...prev.peerIdentities };
          for (const [existingPeerId, assigned] of Object.entries(nextIdentities)) {
            if (assigned === msg.playerId && existingPeerId !== msg.peerId) {
              delete nextIdentities[existingPeerId];
            }
          }
          nextIdentities[msg.peerId] = msg.playerId;
          const newState = { ...prev, peerIdentities: nextIdentities };
          if (peerService.getIsHost()) {
            broadcastState(newState);
          }
          return newState;
        });
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
  }, [localPrefs.isSoundOn, localPrefs.volume, broadcastState]);

  // --- Countdown Beep Logic ---
  useEffect(() => {
    if (!localPrefs.isSoundOn) return;

    const shouldBeep = gameState.timers.some(t => {
      if (t.status === TimerStatus.RUNNING) {
        const elapsed = t.initialSeconds - t.remainingSeconds;
        // Beep at 1s (:59), 2s (:58), and 3s (:57) elapsed
        const beepAtStart = elapsed >= 1 && elapsed <= 3;
        // Beep at 3s, 2s, and 1s remaining
        const beepAtEnd = t.remainingSeconds >= 1 && t.remainingSeconds <= 3;
        return beepAtStart || beepAtEnd;
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

  return {
    audioRef,
    beepAudioRef,
    broadcastState,
    cardReveal,
    characterPeekName,
    characterPeekPosition,
    connectedPeerIds,
    connectionCount,
    explosionAudioRef,
    fullscreenTimerId,
    gameState,
    gameStateRef,
    identityDismissed,
    initialRoomCode,
    isConnected,
    isHost,
    keywordTooltipPosition,
    keywordTooltipText,
    lastDealIdRef,
    localPrefs,
    lockedRoles,
    myPeerId,
    requiresTooltipData,
    resetTimer,
    roomCode,
    setCardReveal,
    setCharacterPeekName,
    setCharacterPeekPosition,
    setConnectedPeerIds,
    setConnectionCount,
    setFullscreenTimerId,
    setGameState,
    setIdentityDismissed,
    setInitialRoomCode,
    setIsConnected,
    setIsHost,
    setKeywordTooltipPosition,
    setKeywordTooltipText,
    setLocalPrefs,
    setLockedRoles,
    setMyPeerId,
    setRequiresTooltipData,
    setRoomCode,
    setShowCharacterPeekTooltip,
    setShowConfigModal,
    setShowIdentityModal,
    setShowKeywordTooltip,
    setShowRequiresTooltip,
    setShowSyncModal,
    showCharacterPeekTooltip,
    showConfigModal,
    showIdentityModal,
    showKeywordTooltip,
    showRequiresTooltip,
    showSyncModal,
    t,
    toggleTimer
  };
}
