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

import { useBoomSyncAppCore } from './useBoomSyncAppCore';
export function useBoomSyncApp() {
  const {
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
  } = useBoomSyncAppCore();

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
      const currentIndex = counts.indexOf(prev.roundCount as any);
      const nextCount = counts[(currentIndex + 1) % counts.length];
      
      let newTimers: GameTimer[];
      if (nextCount === 'test') {
        // Test preset: 5s, 4s, 3s timers
        newTimers = [
          { id: '3', initialSeconds: 5, remainingSeconds: 5, status: TimerStatus.IDLE },
          { id: '2', initialSeconds: 4, remainingSeconds: 4, status: TimerStatus.IDLE },
          { id: '1', initialSeconds: 3, remainingSeconds: 3, status: TimerStatus.IDLE },
        ];
      } else {
        // Regular presets: timers in minutes
        newTimers = [];
        for (let i = nextCount; i >= 1; i--) {
          newTimers.push({
            id: i.toString(),
            initialSeconds: i * 60,
            remainingSeconds: i * 60,
            status: TimerStatus.IDLE
          });
        }
      }

      const newState = { ...prev, roundCount: nextCount, timers: newTimers, usedTimerIds: [] };
      broadcastState(newState);
      return newState;
    });
  };

  // --- Shuffle Logic ---
  const handleShuffle = (players: Player[]) => {
    const validPlayers = players.filter(p => p.name.trim() !== '');
    if (validPlayers.length < 2) return;

    const { roomA, roomB } = shufflePlayersIntoRooms(players);

    setGameState(prev => {
      const roleDeal: RoleDeal | null = prev.selectedRoles.length > 0
        ? dealRoles(players, prev.selectedRoles)
        : null;
      const newState = {
        ...prev,
        players,
        roomA,
        roomB,
        roleDeal,
        peerIdentities: prunePeerIdentities(prev.peerIdentities, players),
      };
      broadcastState(newState);
      return newState;
    });
    setCardReveal(null);
  };

  const updatePlayers = (players: Player[]) => {
    setGameState(prev => {
      const newState = {
        ...prev,
        players,
        peerIdentities: prunePeerIdentities(prev.peerIdentities, players),
      };
      broadcastState(newState);
      return newState;
    });
  };

  const assignIdentity = useCallback((peerId: string, playerId: string) => {
    setLocalPrefs(prev => (
      peerId === (peerService.getPeerId() ?? myPeerId)
        ? { ...prev, myPlayerId: playerId }
        : prev
    ));
    setGameState(prev => {
      const nextIdentities = { ...prev.peerIdentities };
      for (const [existingPeerId, assigned] of Object.entries(nextIdentities)) {
        if (assigned === playerId && existingPeerId !== peerId) {
          delete nextIdentities[existingPeerId];
        }
      }
      nextIdentities[peerId] = playerId;
      const newState = {
        ...prev,
        peerIdentities: nextIdentities,
      };
      if (peerService.getIsHost()) {
        broadcastState(newState);
      } else {
        peerService.send({ type: 'SET_IDENTITY', peerId, playerId });
      }
      return newState;
    });
  }, [broadcastState, myPeerId]);

  const setActiveTab = (tab: 'timers' | 'shuffle' | 'roles') => {
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

  // Toggle keep screen awake (local only)
  const toggleKeepScreenAwake = () => {
    setLocalPrefs(prev => ({ ...prev, keepScreenAwake: !prev.keepScreenAwake }));
  };

  // Toggle bomb sound (synced setting)
  const toggleBombSound = useCallback(() => {
    setGameState(prev => {
      const newState = { ...prev, isBombSoundOn: !prev.isBombSoundOn };
      broadcastState(newState);
      return newState;
    });
  }, [broadcastState]);

  // Toggle role-card UI (synced like bomb sound so phone-pass/sync rooms match)
  const toggleShowRoleCards = useCallback(() => {
    setGameState(prev => {
      const newState = { ...prev, showRoleCards: !prev.showRoleCards };
      broadcastState(newState);
      return newState;
    });
  }, [broadcastState]);

  // Roles handlers
  const setRolesSearchQuery = (query: string) => {
    setGameState(prev => {
      const newState = { ...prev, rolesSearchQuery: query };
      broadcastState(newState);
      return newState;
    });
  };

  const setRolesTeamFilter = (team: string | null) => {
    setGameState(prev => {
      const newState = { ...prev, rolesTeamFilter: team };
      broadcastState(newState);
      return newState;
    });
  };

  const setRolesTagFilter = (tag: string | null) => {
    setGameState(prev => {
      const newState = { ...prev, rolesTagFilter: tag };
      broadcastState(newState);
      return newState;
    });
  };

  const toggleRole = (characterName: string) => {
    setGameState(prev => {
      const isSelected = prev.selectedRoles.includes(characterName);
      const newSelectedRoles = isSelected
        ? prev.selectedRoles.filter(name => name !== characterName)
        : [...prev.selectedRoles, characterName];
      const newState = { ...prev, selectedRoles: newSelectedRoles };
      broadcastState(newState);
      return newState;
    });
  };

  const addRoles = (roleNames: string[]) => {
    setGameState(prev => {
      const newRoles = roleNames.filter(name => !prev.selectedRoles.includes(name));
      if (newRoles.length === 0) return prev;
      const newState = { ...prev, selectedRoles: [...prev.selectedRoles, ...newRoles] };
      broadcastState(newState);
      return newState;
    });
  };

  const toggleLockRole = (characterName: string) => {
    setLockedRoles(prev => 
      prev.includes(characterName)
        ? prev.filter(r => r !== characterName)
        : [...prev, characterName]
    );
  };

  const clearAllRoles = () => {
    setGameState(prev => {
      const newState = { ...prev, selectedRoles: [] };
      broadcastState(newState);
      return newState;
    });
  };

  const applyPreset = (roles: string[]) => {
    setGameState(prev => {
      const newState = { ...prev, selectedRoles: roles };
      broadcastState(newState);
      return newState;
    });
  };

  const setSelectedCharacter = (name: string | null) => {
    setGameState(prev => {
      const newState = { ...prev, selectedCharacterName: name };
      broadcastState(newState);
      return newState;
    });
  };

  const setShowRoleListModal = (show: boolean) => {
    setGameState(prev => {
      const newState = { ...prev, showRoleListModal: show };
      broadcastState(newState);
      return newState;
    });
  };

  const navigateToCharacter = (name: string) => {
    setSelectedCharacter(name);
  };

  const showKeyword = (keyword: string, position: { x: number; y: number }) => {
    setKeywordTooltipText(keyword);
    setKeywordTooltipPosition(position);
    setShowKeywordTooltip(true);
  };

  const showCharacterPeek = (name: string, position: { x: number; y: number }) => {
    setCharacterPeekName(name);
    setCharacterPeekPosition(position);
    setShowCharacterPeekTooltip(true);
  };

  const showRequires = (
    requires: string[], 
    requiresGroup: string | undefined, 
    characterName: string, 
    position: { x: number; y: number }
  ) => {
    setRequiresTooltipData({ requires, requiresGroup, characterName, position });
    setShowRequiresTooltip(true);
  };

  // Find active fullscreen timer
  const activeFullscreenTimer = fullscreenTimerId 
    ? gameState.timers.find(t => t.id === fullscreenTimerId) 
    : null;

  const isSyncRoomMode = isConnected && connectionCount > 1;
  const myPlayerId = myPeerId ? gameState.peerIdentities[myPeerId] : undefined;
  const myPlayer = myPlayerId
    ? gameState.players.find(p => p.id === myPlayerId)
    : undefined;
  const myRoleName = myPlayerId && gameState.roleDeal
    ? gameState.roleDeal.assignments[myPlayerId]
    : undefined;
  const showMyCardButton = gameState.showRoleCards
    && isSyncRoomMode
    && Boolean(gameState.roleDeal && myPlayer && myRoleName);
  const showWhoAmIButton = isSyncRoomMode && Boolean(gameState.roleDeal) && !myPlayerId;

  useEffect(() => {
    const dealId = gameState.roleDeal?.id ?? null;
    if (lastDealIdRef.current && lastDealIdRef.current !== dealId) {
      setCardReveal(null);
    }
    lastDealIdRef.current = dealId;
  }, [gameState.roleDeal?.id]);

  useEffect(() => {
    if (!gameState.showRoleCards) {
      setCardReveal(null);
    }
  }, [gameState.showRoleCards]);

  useEffect(() => {
    const namedPlayers = gameState.players.filter(p => p.name.trim());
    const identified = Boolean(myPeerId && gameState.peerIdentities[myPeerId]);
    if (!isSyncRoomMode) {
      setIdentityDismissed(false);
      return;
    }
    if (myPeerId && namedPlayers.length > 0 && !identified && !identityDismissed) {
      setShowIdentityModal(true);
    }
  }, [isSyncRoomMode, gameState.players, gameState.peerIdentities, myPeerId, identityDismissed]);

  useEffect(() => {
    if (!isSyncRoomMode || !myPeerId || !localPrefs.myPlayerId) return;
    if (gameState.peerIdentities[myPeerId]) return;
    const stillExists = gameState.players.some(p => p.id === localPrefs.myPlayerId);
    if (stillExists) {
      assignIdentity(myPeerId, localPrefs.myPlayerId);
    }
  }, [isSyncRoomMode, myPeerId, localPrefs.myPlayerId, gameState.peerIdentities, gameState.players, assignIdentity]);

  const handleRevealPlayerCard = (playerId: string) => {
    const player = gameState.players.find(p => p.id === playerId);
    const roleName = gameState.roleDeal?.assignments[playerId];
    if (!player || !roleName) return;
    setCardReveal({ kind: 'player', playerId, playerName: player.name, roleName });
  };

  const handleRevealBuriedCard = (index: number) => {
    const roleName = gameState.roleDeal?.buriedRoles[index];
    if (!roleName) return;
    setCardReveal({ kind: 'buried', index, roleName });
  };

  const handleRevealMyCard = () => {
    if (!myPlayer || !myRoleName) return;
    setCardReveal({ kind: 'mine', playerId: myPlayer.id, playerName: myPlayer.name, roleName: myRoleName });
  };

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

  return {
    activeFullscreenTimer,
    addRoles,
    applyPreset,
    assignIdentity,
    audioRef,
    beepAudioRef,
    broadcastState,
    cardReveal,
    characterPeekName,
    characterPeekPosition,
    clearAllRoles,
    connectedPeerIds,
    connectionCount,
    cycleRoundCount,
    explosionAudioRef,
    fullscreenTimerId,
    gameState,
    gameStateRef,
    handleRevealBuriedCard,
    handleRevealMyCard,
    handleRevealPlayerCard,
    handleShare,
    handleShuffle,
    handleTimerClick,
    handleTimerReset,
    handleToggleDarken,
    identityDismissed,
    initialRoomCode,
    isConnected,
    isHost,
    isSyncRoomMode,
    keywordTooltipPosition,
    keywordTooltipText,
    lastDealIdRef,
    localPrefs,
    lockedRoles,
    myPeerId,
    myPlayer,
    myPlayerId,
    myRoleName,
    navigateToCharacter,
    requiresTooltipData,
    resetTimer,
    roomCode,
    selectSound,
    setActiveTab,
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
    setIsEditingPlayers,
    setIsHost,
    setKeywordTooltipPosition,
    setKeywordTooltipText,
    setLocalPrefs,
    setLockedRoles,
    setMyPeerId,
    setRequiresTooltipData,
    setRolesSearchQuery,
    setRolesTagFilter,
    setRolesTeamFilter,
    setRoomCode,
    setSelectedCharacter,
    setShowCharacterPeekTooltip,
    setShowConfigModal,
    setShowIdentityModal,
    setShowKeywordTooltip,
    setShowRequiresTooltip,
    setShowRoleListModal,
    setShowSyncModal,
    setVolume,
    showCharacterPeek,
    showCharacterPeekTooltip,
    showConfigModal,
    showIdentityModal,
    showKeyword,
    showKeywordTooltip,
    showMyCardButton,
    showRequires,
    showRequiresTooltip,
    showSyncModal,
    showWhoAmIButton,
    t,
    toggleAutoFullscreen,
    toggleBombSound,
    toggleDarkenTimer,
    toggleKeepScreenAwake,
    toggleLockRole,
    toggleRole,
    toggleShowRoleCards,
    toggleSound,
    toggleTimer,
    updatePlayers
  };
}
