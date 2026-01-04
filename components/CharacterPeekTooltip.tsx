import React from 'react';
import { Icon } from './Icon';

interface CharacterPeekTooltipProps {
  characterName: string;
  description?: string;
  onClose: () => void;
  onSeeMore: () => void;
}

export const CharacterPeekTooltip: React.FC<CharacterPeekTooltipProps> = ({
  characterName,
  description,
  onClose,
  onSeeMore,
}) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-zinc-100">{characterName}</h3>
            <div className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mt-1">
              Character
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
            type="button"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <p className="text-zinc-300 leading-relaxed">
          {description || 'No description available.'}
        </p>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onSeeMore}
            className="px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500 text-cyan-300 hover:bg-cyan-500/30 transition-colors font-semibold"
            type="button"
          >
            See more
          </button>
        </div>
      </div>
    </div>
  );
};

