import { CharacterFull, RoleDeal } from '../types';

/**
 * Dual-color catalog roles (`team: "red-blue"`) are a pair of physical cards —
 * one red, one blue — not a gradient face. Color-share / color-only UI must
 * pick a single face color per dealt instance.
 *
 * Spy is the documented inverse-face exception: allegiance is one team, the
 * printed card (what a color-share shows) is the opposite.
 * See characters/red-blue.json Spy notes and data/roleMetadata.ts.
 */
const INVERSE_FACE_NOTE = /color of the opposite team/i;

export function isInverseFaceRole(roleName: string, notes?: string[]): boolean {
  if (roleName === 'Spy') return true;
  return Boolean(notes?.some(note => INVERSE_FACE_NOTE.test(note)));
}

export function roleSlotKey(slot: { playerId?: string; buriedIndex?: number }): string | null {
  if (slot.playerId != null) return `player:${slot.playerId}`;
  if (slot.buriedIndex != null) return `buried:${slot.buriedIndex}`;
  return null;
}

/** Stable order of every dealt/buried copy of a role in this deal. */
export function listRoleSlots(deal: RoleDeal, roleName: string): string[] {
  const slots: string[] = [];
  for (const playerId of Object.keys(deal.assignments).sort()) {
    if (deal.assignments[playerId] === roleName) {
      slots.push(`player:${playerId}`);
    }
  }
  deal.buriedRoles.forEach((role, index) => {
    if (role === roleName) slots.push(`buried:${index}`);
  });
  return slots;
}

/**
 * Assign red/blue allegiance to each copy of a red-blue pair role.
 * Even index → red (the notes' "red Spy" example), odd → blue.
 * Does not change RoleDeal; both devices share the same assignments so this is stable.
 */
export function resolvePairAllegiance(
  roleName: string,
  deal: RoleDeal | null | undefined,
  slot: { playerId?: string; buriedIndex?: number }
): 'red' | 'blue' | undefined {
  if (!deal) return undefined;
  const key = roleSlotKey(slot);
  if (!key) return undefined;
  const slots = listRoleSlots(deal, roleName);
  const index = slots.indexOf(key);
  if (index < 0) return undefined;
  return index % 2 === 0 ? 'red' : 'blue';
}

export function getPresentedTeam(opts: {
  roleName: string;
  catalogTeam: string | undefined;
  allegiance?: 'red' | 'blue';
  notes?: string[];
}): string {
  const { roleName, catalogTeam, allegiance, notes } = opts;

  if (roleName === 'The Black') return 'black';

  const pairTeam = catalogTeam === 'red-blue';
  if (pairTeam && allegiance) {
    if (isInverseFaceRole(roleName, notes)) {
      return allegiance === 'red' ? 'blue' : 'red';
    }
    return allegiance;
  }

  return catalogTeam || 'grey';
}

export function getCatalogTeam(character: CharacterFull | null, indexTeam?: string): string {
  return character?.team || indexTeam || 'grey';
}
