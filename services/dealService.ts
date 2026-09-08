import { Player, RoleDeal } from '../types';

function fisherYates<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function createDealId(): string {
  return `deal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getNamedPlayers(players: Player[]): Player[] {
  return players.filter(p => p.name.trim() !== '');
}

/** Split named players into Room A / Room B. Rooms store player IDs. */
export function shufflePlayersIntoRooms(players: Player[]): { roomA: string[]; roomB: string[] } {
  const shuffled = fisherYates(getNamedPlayers(players));
  const mid = Math.ceil(shuffled.length / 2);
  return {
    roomA: shuffled.slice(0, mid).map(p => p.id),
    roomB: shuffled.slice(mid).map(p => p.id),
  };
}

/**
 * Deal preset roles onto named players. Extra roles (preset larger than the
 * player list) are buried rather than dropped. Independent of room assignment.
 */
export function dealRoles(players: Player[], roles: string[]): RoleDeal {
  const namedPlayers = getNamedPlayers(players);
  const shuffledPlayers = fisherYates(namedPlayers);
  const shuffledRoles = fisherYates(roles);

  const assignments: Record<string, string> = {};
  const dealCount = Math.min(shuffledPlayers.length, shuffledRoles.length);

  for (let i = 0; i < dealCount; i++) {
    assignments[shuffledPlayers[i].id] = shuffledRoles[i];
  }

  return {
    id: createDealId(),
    assignments,
    buriedRoles: shuffledRoles.slice(dealCount),
  };
}

export function resolvePlayer(players: Player[], idOrName: string): Player | undefined {
  return players.find(p => p.id === idOrName) ?? players.find(p => p.name === idOrName);
}

export function resolvePlayerUnique(
  players: Player[],
  idOrName: string,
  usedIds: Set<string>
): Player | undefined {
  const byId = players.find(p => p.id === idOrName && !usedIds.has(p.id));
  if (byId) return byId;
  return players.find(p => p.name === idOrName && !usedIds.has(p.id));
}

export function prunePeerIdentities(
  peerIdentities: Record<string, string>,
  players: Player[]
): Record<string, string> {
  const ids = new Set(getNamedPlayers(players).map(p => p.id));
  const next: Record<string, string> = {};
  for (const [peerId, playerId] of Object.entries(peerIdentities)) {
    if (ids.has(playerId)) {
      next[peerId] = playerId;
    }
  }
  return next;
}
