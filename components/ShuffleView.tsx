import React, { useState } from 'react';
import { Player, RoleDeal } from '../types';
import { Icon } from './Icon';
import { TapSafeButton } from './TapSafeButton';
import { ConfirmModal } from './ConfirmModal';
import { getNamedPlayers, resolvePlayerUnique } from '../services/dealService';

interface ShuffleViewProps {
  players: Player[];
  roomA: string[];
  roomB: string[];
  onUpdatePlayers: (players: Player[]) => void;
  onShuffle: (players: Player[]) => void;
  isEditing: boolean;
  onSetEditing: (editing: boolean) => void;
  roleDeal: RoleDeal | null;
  selectedRoleCount: number;
  showRoleCards: boolean;
  isPhonePassMode: boolean;
  canShuffle: boolean;
  myPlayerName: string | null;
  onRevealPlayerCard: (playerId: string) => void;
  onRevealBuriedCard: (index: number) => void;
  onOpenIdentity?: () => void;
}

export const ShuffleView: React.FC<ShuffleViewProps> = ({ 
  players, 
  roomA, 
  roomB, 
  onUpdatePlayers, 
  onShuffle,
  isEditing,
  onSetEditing,
  roleDeal,
  selectedRoleCount,
  showRoleCards,
  isPhonePassMode,
  canShuffle,
  myPlayerName,
  onRevealPlayerCard,
  onRevealBuriedCard,
  onOpenIdentity,
}) => {
  const [showCountMismatch, setShowCountMismatch] = useState(false);

  const addPlayer = () => {
    onUpdatePlayers([...players, { id: Date.now().toString(), name: '' }]);
  };

  const updatePlayerName = (id: string, name: string) => {
    onUpdatePlayers(players.map(p => p.id === id ? { ...p, name } : p));
  };

  const removePlayer = (id: string) => {
    if (players.length <= 2) return;
    onUpdatePlayers(players.filter(p => p.id !== id));
  };

  const namedPlayerCount = getNamedPlayers(players).length;
  const roleCount = selectedRoleCount;
  const countsMismatch = roleCount > 0 && namedPlayerCount >= 2 && namedPlayerCount !== roleCount;

  const runShuffle = () => {
    if (!canShuffle) return;
    onShuffle(players);
    onSetEditing(false);
    setShowCountMismatch(false);
  };

  const handleShuffleClick = () => {
    if (!canShuffle) return;
    if (countsMismatch) {
      setShowCountMismatch(true);
      return;
    }
    runShuffle();
  };

  const mismatchCopy = (): { title: string; body: string } => {
    const extraRoles = roleCount - namedPlayerCount;
    if (extraRoles > 0) {
      return {
        title: "Player count doesn't match roles",
        body: `This preset has ${roleCount} roles but only ${namedPlayerCount} named player${namedPlayerCount === 1 ? '' : 's'}. ${extraRoles} extra card${extraRoles === 1 ? '' : 's'} will be buried.`,
      };
    }
    const extraPlayers = namedPlayerCount - roleCount;
    return {
      title: "Player count doesn't match roles",
      body: `This preset has ${roleCount} roles but ${namedPlayerCount} named players. ${extraPlayers} player${extraPlayers === 1 ? '' : 's'} will not receive a card.`,
    };
  };

  const countMismatchModal = showCountMismatch ? (
    <ConfirmModal
      title={mismatchCopy().title}
      body={mismatchCopy().body}
      confirmLabel="Shuffle"
      onConfirm={runShuffle}
      onCancel={() => setShowCountMismatch(false)}
    />
  ) : null;

  const renderRoomList = (entries: string[]) => {
    const usedIds = new Set<string>();
    return entries.map((idOrName, i) => {
      const player = resolvePlayerUnique(players, idOrName, usedIds);
      if (player) usedIds.add(player.id);
      const displayName = player?.name || idOrName;
      const playerId = player?.id ?? null;
      const hasCard = Boolean(playerId && roleDeal?.assignments[playerId]);
      return (
        <div key={playerId ?? `${idOrName}-${i}`} className="flex items-center gap-2 py-1 border-b border-zinc-800 last:border-0">
          <div className="text-lg font-semibold text-zinc-100 flex-1 min-w-0 truncate">
            {displayName}
          </div>
          {showRoleCards && isPhonePassMode && hasCard && playerId && (
            <TapSafeButton
              onTap={() => onRevealPlayerCard(playerId)}
              className="flex-shrink-0 p-2 rounded-xl bg-zinc-800 text-cyan-400 active:bg-zinc-700 active:scale-95"
              aria-label={`Reveal ${displayName}'s card`}
            >
              <Icon name="card" size={18} />
            </TapSafeButton>
          )}
        </div>
      );
    });
  };

  if (!isEditing) {
    const buried = roleDeal?.buriedRoles ?? [];
    return (
      <>
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 p-4">
          {!isPhonePassMode && myPlayerName && (
            <div className="flex items-center justify-between gap-2 px-1">
              <p className="text-sm text-zinc-400">
                You are <span className="text-cyan-400 font-semibold">{myPlayerName}</span>
              </p>
              {onOpenIdentity && (
                <TapSafeButton
                  onTap={onOpenIdentity}
                  className="text-xs font-bold uppercase tracking-widest text-zinc-500"
                >
                  Change
                </TapSafeButton>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="text-zinc-500 font-bold uppercase tracking-widest text-xs px-2">Room A</h3>
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 space-y-2 min-h-[200px] neon-border-cyan">
                {renderRoomList(roomA)}
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-zinc-500 font-bold uppercase tracking-widest text-xs px-2">Room B</h3>
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 space-y-2 min-h-[200px]">
                {renderRoomList(roomB)}
              </div>
            </div>
          </div>

          {showRoleCards && buried.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-zinc-500 font-bold uppercase tracking-widest text-xs px-2">
                Buried ({buried.length})
              </h3>
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 space-y-2">
                {buried.map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 py-1 border-b border-zinc-800 last:border-0"
                  >
                    <div className="text-lg font-semibold text-zinc-400 flex-1">
                      Card {i + 1}
                    </div>
                    {isPhonePassMode && (
                      <TapSafeButton
                        onTap={() => onRevealBuriedCard(i)}
                        className="flex-shrink-0 p-2 rounded-xl bg-zinc-800 text-cyan-400 active:bg-zinc-700 active:scale-95"
                        aria-label={`Reveal buried card ${i + 1}`}
                      >
                        <Icon name="card" size={18} />
                      </TapSafeButton>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {showRoleCards && roleDeal && selectedRoleCount > 0 && (
            <p className="text-xs text-zinc-500 px-1">
              {Object.keys(roleDeal.assignments).length} cards dealt
              {buried.length > 0 ? ` · ${buried.length} buried` : ''}
            </p>
          )}

          {showRoleCards && selectedRoleCount === 0 && (
            <p className="text-xs text-zinc-500 px-1">
              Apply a preset on Roles to deal character cards with shuffle.
            </p>
          )}

          {!canShuffle && (
            <p className="text-xs text-zinc-500 px-1">
              The host deals rooms and roles.
            </p>
          )}

          <div className="flex gap-3">
            <button 
              onClick={handleShuffleClick}
              disabled={!canShuffle}
              className="flex-1 bg-cyan-500 text-zinc-950 font-black text-xl py-6 rounded-[32px] flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-transform disabled:opacity-40 disabled:scale-100"
            >
              <Icon name="shuffle" size={28} />
              SHUFFLE
            </button>
            <button 
              onClick={() => onSetEditing(true)}
              className="p-6 bg-zinc-800 rounded-[32px] text-zinc-400 active:bg-zinc-700"
            >
              <Icon name="edit" size={28} />
            </button>
          </div>
        </div>
        {countMismatchModal}
      </>
    );
  }

  return (
    <>
      <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200 p-4">
        <div className="space-y-2 pb-4">
          {players.map((p, idx) => (
            <div key={p.id} className="flex gap-2 group">
              <input
                type="text"
                value={p.name}
                placeholder={`Player ${idx + 1}`}
                onChange={(e) => updatePlayerName(p.id, e.target.value)}
                className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-100 px-5 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-semibold"
              />
              <button 
                onClick={() => removePlayer(p.id)}
                className="p-4 text-zinc-600 hover:text-rose-500 transition-colors"
              >
                <Icon name="trash" size={20} />
              </button>
            </div>
          ))}
        </div>

        <button 
          onClick={addPlayer}
          className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-zinc-800 rounded-2xl text-zinc-500 font-bold hover:border-zinc-700 hover:text-zinc-400 transition-all active:scale-95"
        >
          <Icon name="plus" size={20} />
          ADD PLAYER
        </button>

        {showRoleCards && selectedRoleCount === 0 && (
          <p className="text-xs text-zinc-500 text-center">
            Apply a preset on Roles to deal character cards with shuffle.
          </p>
        )}

        <div className="sticky bottom-0 left-0 right-0 bg-zinc-950/80 backdrop-blur-md z-[35] -mx-4 px-4 pt-4">
          <button 
            onClick={handleShuffleClick}
            disabled={!canShuffle}
            className="w-full bg-cyan-500 text-zinc-950 font-black text-xl py-6 rounded-[32px] flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-transform disabled:opacity-40 disabled:scale-100"
          >
            <Icon name="shuffle" size={28} />
            SHUFFLE
          </button>
        </div>
      </div>
      {countMismatchModal}
    </>
  );
};
