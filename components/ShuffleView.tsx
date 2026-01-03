
import React, { useState } from 'react';
import { Player } from '../types';
import { Icon } from './Icon';

interface ShuffleViewProps {
  players: Player[];
  roomA: string[];
  roomB: string[];
  onUpdatePlayers: (players: Player[]) => void;
  onShuffle: (players: Player[]) => void;
}

export const ShuffleView: React.FC<ShuffleViewProps> = ({ 
  players, 
  roomA, 
  roomB, 
  onUpdatePlayers, 
  onShuffle 
}) => {
  const [isEditing, setIsEditing] = useState(roomA.length === 0);

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

  const handleShuffleClick = () => {
    onShuffle(players);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <h3 className="text-zinc-500 font-bold uppercase tracking-widest text-xs px-2">Room A</h3>
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 space-y-2 min-h-[200px] neon-border-cyan">
              {roomA.map((name, i) => (
                <div key={i} className="text-lg font-semibold text-cyan-400 py-1 border-b border-zinc-800 last:border-0 truncate">
                  {name}
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-zinc-500 font-bold uppercase tracking-widest text-xs px-2">Room B</h3>
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 space-y-2 min-h-[200px]">
              {roomB.map((name, i) => (
                <div key={i} className="text-lg font-semibold text-rose-400 py-1 border-b border-zinc-800 last:border-0 truncate">
                  {name}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={handleShuffleClick}
            className="flex-1 bg-cyan-500 text-zinc-950 font-black text-xl py-6 rounded-[32px] flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-transform"
          >
            <Icon name="shuffle" size={28} />
            SHUFFLE
          </button>
          <button 
            onClick={() => setIsEditing(true)}
            className="p-6 bg-zinc-800 rounded-[32px] text-zinc-400 active:bg-zinc-700"
          >
            <Icon name="edit" size={28} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-12 animate-in fade-in zoom-in-95 duration-200">
      <div className="space-y-2">
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

      <div className="sticky bottom-20 left-0 right-0 bg-zinc-950/80 backdrop-blur-md pt-2">
        <button 
          onClick={handleShuffleClick}
          className="w-full bg-cyan-500 text-zinc-950 font-black text-xl py-6 rounded-[32px] flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-transform"
        >
          <Icon name="shuffle" size={28} />
          SHUFFLE
        </button>
      </div>
    </div>
  );
};
