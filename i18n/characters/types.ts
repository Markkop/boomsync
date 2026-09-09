import type { CharacterPower } from '../../types';

/** Overlay keyed by English character name. Missing fields fall back to English source data. */
export interface CharacterOverlay {
  name?: string;
  description?: string;
  winCondition?: string;
  powers?: Array<Pick<CharacterPower, 'name' | 'description'> & { type?: string }>;
  notes?: string[];
  requiresGroup?: string;
}

export type CharacterOverlayCatalog = Record<string, CharacterOverlay>;
