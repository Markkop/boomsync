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
import { TimerView } from './components/TimerView';
import { ShuffleView } from './components/ShuffleView';
import { RolesView } from './components/RolesView';
import { CharacterDetailModal } from './components/CharacterDetailModal';
import { RoleListModal } from './components/RoleListModal';
import { KeywordTooltip } from './components/KeywordTooltip';
import { CharacterPeekTooltip } from './components/CharacterPeekTooltip';
import { RequiresTooltip } from './components/RequiresTooltip';
import { SyncModal } from './components/SyncModal';
import { ConfigModal } from './components/ConfigModal';
import { FullscreenTimer } from './components/FullscreenTimer';
import { CardRevealModal, CardRevealRequest } from './components/CardRevealModal';
import { IdentityModal } from './components/IdentityModal';
import { Icon } from './components/Icon';
import { TapSafeButton } from './components/TapSafeButton';
import { peerService } from './services/peerService';
import { wakeLockService } from './services/wakeLockService';
import { getAllCharacters } from './services/characterService';
import { dealRoles, prunePeerIdentities, shufflePlayersIntoRooms } from './services/dealService';
import { useT } from './i18n/I18nContext';


export const STORAGE_KEY = 'boomsync_state';
export const PREFS_STORAGE_KEY = 'boomsync_prefs';

export function normalizeGameState(parsed: GameState): GameState {
  if (!parsed.usedTimerIds) {
    parsed.usedTimerIds = [];
  }
  if (parsed.activeTab === undefined) {
    parsed.activeTab = 'timers';
  }
  if (parsed.isEditingPlayers === undefined) {
    parsed.isEditingPlayers = true;
  }
  if (parsed.isBombSoundOn === undefined) {
    parsed.isBombSoundOn = true;
  }
  if (parsed.showRoleCards === undefined) {
    parsed.showRoleCards = false;
  }
  if (parsed.rolesSearchQuery === undefined) {
    parsed.rolesSearchQuery = '';
  }
  if (parsed.rolesTeamFilter === undefined) {
    parsed.rolesTeamFilter = null;
  }
  if (parsed.rolesTagFilter === undefined) {
    parsed.rolesTagFilter = null;
  }
  if (parsed.selectedCharacterName === undefined) {
    parsed.selectedCharacterName = null;
  }
  if (parsed.selectedRoles === undefined) {
    parsed.selectedRoles = [];
  }
  if (parsed.showRoleListModal === undefined) {
    parsed.showRoleListModal = false;
  }
  if (parsed.roleDeal === undefined) {
    parsed.roleDeal = null;
  }
  if (!parsed.peerIdentities || typeof parsed.peerIdentities !== 'object') {
    parsed.peerIdentities = {};
  }

  const validCharacterNames = new Set(getAllCharacters().map(c => c.name));
  if (parsed.selectedCharacterName && !validCharacterNames.has(parsed.selectedCharacterName)) {
    parsed.selectedCharacterName = null;
  }
  if (Array.isArray(parsed.selectedRoles)) {
    parsed.selectedRoles = parsed.selectedRoles.filter((name: unknown) => {
      return typeof name === 'string' && validCharacterNames.has(name);
    });
  } else {
    parsed.selectedRoles = [];
  }

  if (parsed.roleDeal) {
    const deal = parsed.roleDeal;
    if (!deal.id || !deal.assignments || !Array.isArray(deal.buriedRoles)) {
      parsed.roleDeal = null;
    } else {
      const cleanAssignments: Record<string, string> = {};
      for (const [playerId, roleName] of Object.entries(deal.assignments)) {
        if (typeof roleName === 'string' && validCharacterNames.has(roleName)) {
          cleanAssignments[playerId] = roleName;
        }
      }
      parsed.roleDeal = {
        id: deal.id,
        assignments: cleanAssignments,
        buriedRoles: deal.buriedRoles.filter(name => validCharacterNames.has(name)),
      };
    }
  }

  delete (parsed as GameState & { isSoundOn?: unknown }).isSoundOn;
  delete (parsed as GameState & { selectedSound?: unknown }).selectedSound;
  return parsed;
}

export function emptyGameState(): GameState {
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
    isBombSoundOn: true,
    showRoleCards: false,
    rolesSearchQuery: '',
    rolesTeamFilter: null,
    rolesTagFilter: null,
    selectedCharacterName: null,
    selectedRoles: [],
    showRoleListModal: false,
    roleDeal: null,
    peerIdentities: {}
  };
}

// Local preferences (not synced)
export interface LocalPreferences {
  isSoundOn: boolean;
  selectedSound: string;
  autoFullscreen: boolean;
  volume: number; // 0.0 to 1.0, defaults to 1.0
  keepScreenAwake: boolean; // Prevent screen from locking, defaults to true
  myPlayerId: string | null;
}

