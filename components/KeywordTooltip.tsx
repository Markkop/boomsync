import React from 'react';
import { Icon } from './Icon';

interface KeywordTooltipProps {
  keyword: string;
  onClose: () => void;
}

const keywordDefinitions: Record<string, string> = {
  'dead': 'A condition that causes a player to lose the game. Players with the "dead" condition cannot win.',
  'card share': 'When two players privately show each other their character cards. This activates certain character powers.',
  'color share': 'When two players show each other the colored side of their cards (red or blue) without revealing the character name.',
  'bury': 'A card that is removed from play and placed face-down. Backup characters activate when their primary is buried.',
  'contagious': 'A condition that spreads to other players when they interact (card share or color share).',
  'foolish': 'A condition that prevents a player from refusing card share or color share offers.',
  'cultist': 'A condition that links players to the Cult Leader. If the Cult Leader dies, all cultists lose.',
  'zombie': 'A condition that changes a player\'s allegiance to Team Zombie.',
  'in love': 'A condition that changes win conditions - players must end in the same room.',
  'in hate': 'A condition that changes win conditions - players must end in opposite rooms.',
  'traitor': 'A condition that can be removed by card sharing with the Loyalist.',
  'immune': 'A condition that makes a player immune to all powers and conditions.',
  'fireproof': 'A condition that prevents gaining the "dead" condition from the "firebomb" condition.',
  'firebomb': 'A condition that causes all players to gain "dead" at end of game if the Bomber has it.',
  'impregnated': 'A condition from the Xenomorph that causes all players in the same room to gain "dead" at end of game.',
  'toast': 'A condition from the Dragon that causes players to gain "dead" at end of game.',
  'shy': 'A condition that prevents a player from initiating card share or color share.',
  'cleanse': 'When a character card changes hands, it loses all acquired conditions and resets to its base state.'
};

export const KeywordTooltip: React.FC<KeywordTooltipProps> = ({ keyword, onClose }) => {
  const definition = keywordDefinitions[keyword.toLowerCase()] || 'No definition available for this keyword.';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-bold text-zinc-100 capitalize">{keyword}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <Icon name="close" size={20} />
          </button>
        </div>
        <p className="text-zinc-300 leading-relaxed">{definition}</p>
      </div>
    </div>
  );
};
