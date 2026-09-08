import React from 'react';
import { createPortal } from 'react-dom';
import { Player } from '../types';
import { Icon } from './Icon';
import { TapSafeButton } from './TapSafeButton';
import { getNamedPlayers } from '../services/dealService';

interface IdentityModalProps {
  players: Player[];
  peerIdentities: Record<string, string>;
  myPeerId: string;
  isHost: boolean;
  connectedPeerIds: string[];
  onAssign: (peerId: string, playerId: string) => void;
  onClose: () => void;
}

function playerNameById(players: Player[], playerId: string | undefined): string | null {
  if (!playerId) return null;
  return players.find(p => p.id === playerId)?.name ?? null;
}

export const IdentityModal: React.FC<IdentityModalProps> = ({
  players,
  peerIdentities,
  myPeerId,
  isHost,
  connectedPeerIds,
  onAssign,
  onClose,
}) => {
  const namedPlayers = getNamedPlayers(players);
  const myPlayerId = peerIdentities[myPeerId];
  const takenByOther = new Set(
    Object.entries(peerIdentities)
      .filter(([peerId]) => peerId !== myPeerId)
      .map(([, playerId]) => playerId)
  );

  const hostRows: { peerId: string; label: string }[] = [
    { peerId: myPeerId, label: 'You' },
    ...connectedPeerIds.map(peerId => {
      const claimed = playerNameById(players, peerIdentities[peerId]);
      return {
        peerId,
        label: claimed ? `Guest · ${claimed}` : `Guest ${peerId.slice(0, 4).toUpperCase()}`,
      };
    }),
  ];

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-zinc-950/90 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-[40px] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 mb-4">
          <h2 className="text-2xl font-black text-zinc-100">
            {isHost ? 'Who is who' : 'Who are you?'}
          </h2>
          <TapSafeButton
            onTap={onClose}
            className="p-2 text-zinc-500 hover:text-zinc-300"
          >
            <Icon name="close" size={22} />
          </TapSafeButton>
        </div>

        {namedPlayers.length === 0 ? (
          <p className="text-zinc-400 text-sm">
            Add player names on the Shuffle tab first.
          </p>
        ) : isHost ? (
          <div className="space-y-5">
            <p className="text-zinc-400 text-sm">
              Assign each connected device to a player. You can change this later.
            </p>
            {hostRows.map(row => (
              <div key={row.peerId} className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                  {row.label}
                </h3>
                <div className="flex flex-col gap-2">
                  {namedPlayers.map(player => {
                    const selected = peerIdentities[row.peerId] === player.id;
                    return (
                      <TapSafeButton
                        key={player.id}
                        onTap={() => onAssign(row.peerId, player.id)}
                        className={`w-full text-left px-4 py-3 rounded-2xl font-semibold transition-all active:scale-95 ${
                          selected
                            ? 'bg-cyan-500 text-zinc-950'
                            : 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                        }`}
                      >
                        {player.name}
                      </TapSafeButton>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-zinc-400 text-sm">
              Pick your name from the player list.
            </p>
            {namedPlayers.map(player => {
              const selected = myPlayerId === player.id;
              const taken = takenByOther.has(player.id);
              return (
                <TapSafeButton
                  key={player.id}
                  onTap={() => {
                    onAssign(myPeerId, player.id);
                    onClose();
                  }}
                  className={`w-full text-left px-4 py-4 rounded-2xl font-semibold transition-all active:scale-95 ${
                    selected
                      ? 'bg-cyan-500 text-zinc-950'
                      : taken
                        ? 'bg-zinc-800/60 text-zinc-500 border border-zinc-800'
                        : 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span>{player.name}</span>
                    {taken && !selected && (
                      <span className="text-xs font-bold uppercase tracking-widest">Taken</span>
                    )}
                    {selected && <Icon name="check" size={18} />}
                  </span>
                </TapSafeButton>
              );
            })}
          </div>
        )}

        <TapSafeButton
          onTap={onClose}
          className="w-full mt-6 py-3 bg-zinc-800 text-zinc-300 font-bold rounded-2xl"
        >
          {myPlayerId ? 'Done' : 'Skip for now'}
        </TapSafeButton>
      </div>
    </div>,
    document.body
  );
};
