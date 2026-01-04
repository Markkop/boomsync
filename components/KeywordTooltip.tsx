import React, { useEffect, useRef } from 'react';
import { Icon } from './Icon';

interface KeywordTooltipProps {
  keyword: string;
  position: { x: number; y: number };
  onClose: () => void;
}

export const KEYWORD_DEFINITIONS: Record<string, string> = {
  'dead': 'A condition that causes a player to lose the game. Players with the "dead" condition cannot win.',
  'card share': 'When two players privately show each other their character cards. This activates certain character powers.',
  'color share': 'When two players show each other the colored side of their cards (red or blue) without revealing the character name.',
  'bury': 'A card that is removed from play and placed face-down. Backup characters activate when their primary is buried.',
  'buried': 'A card that is removed from play and placed face-down. Backup characters activate when their primary is buried.',
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
  'cleanse': 'When a character card changes hands, it loses all acquired conditions and resets to its base state.',
  // Tag definitions
  'card share power': 'This character has a power that activates when card sharing occurs.',
  'color share power': 'This character has a power that activates when color sharing occurs.',
  'private reveal power': 'This character can privately reveal their card to another player.',
  'public reveal power': 'This character can publicly reveal their card to all players.',
  'condition': 'This character starts with or can apply conditions to players.',
  'contagious': 'A condition that spreads to other players when they interact (card share or color share).',
  'acting': 'This character requires acting or roleplay to function properly.',
  'card swap': 'This character can swap cards with other players.',
  'bury': 'A card that is removed from play and placed face-down. Backup characters activate when their primary is buried.',
  'buried': 'A card that is removed from play and placed face-down. Backup characters activate when their primary is buried.',
  'primary character': 'Core character for team win conditions (e.g., President, Bomber).',
  'pause game': 'This character pauses the game for a specified duration when their power activates.',
  'odd player count': 'This character only works correctly with an odd number of players.',
  'pauses game': 'This character pauses the game for a specified duration when their power activates.'
};

export const KeywordTooltip: React.FC<KeywordTooltipProps> = ({ keyword, position, onClose }) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const lower = keyword.toLowerCase();
  
  // Try exact match first, then try partial matches for tags
  let definition = KEYWORD_DEFINITIONS[lower];
  if (!definition) {
    // Try to match tag patterns (e.g., "pause game 50" -> "pause game")
    if (lower.includes('pause game') || lower.includes('pauses game')) {
      definition = KEYWORD_DEFINITIONS['pause game'] || KEYWORD_DEFINITIONS['pauses game'];
    } else if (lower.includes('card share power')) {
      definition = KEYWORD_DEFINITIONS['card share power'];
    } else if (lower.includes('color share power')) {
      definition = KEYWORD_DEFINITIONS['color share power'];
    } else if (lower.includes('private reveal power')) {
      definition = KEYWORD_DEFINITIONS['private reveal power'];
    } else if (lower.includes('public reveal power')) {
      definition = KEYWORD_DEFINITIONS['public reveal power'];
    } else if (lower.includes('odd player count')) {
      definition = KEYWORD_DEFINITIONS['odd player count'];
    } else if (lower.includes('primary character')) {
      definition = KEYWORD_DEFINITIONS['primary character'];
    } else if (lower.includes('card swap')) {
      definition = KEYWORD_DEFINITIONS['card swap'];
    } else if (lower.includes('acting')) {
      definition = KEYWORD_DEFINITIONS['acting'];
    } else if (lower.includes('condition')) {
      definition = KEYWORD_DEFINITIONS['condition'];
    } else if (lower.includes('contagious')) {
      definition = KEYWORD_DEFINITIONS['contagious'];
    } else if (lower.includes('bury')) {
      definition = KEYWORD_DEFINITIONS['bury'];
    }
  }
  
  if (!definition) {
    definition = 'No definition available for this keyword.';
  }
  const iconName =
    lower.includes('card share') ? 'share'
    : lower.includes('color share') ? 'palette'
    : lower.includes('public reveal') ? 'megaphone'
    : lower.includes('private reveal') ? 'eye'
    : lower.includes('bury') ? 'archive'
    : lower.includes('contagious') ? 'virus'
    : lower.includes('acting') ? 'theater'
    : lower.includes('condition') ? 'sparkles'
    : lower.includes('pause') ? 'clock'
    : lower.includes('odd') ? 'hash'
    : null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Use setTimeout to avoid immediate closure on the click that opened it
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Calculate position with bounds checking
  const [popupPosition, setPopupPosition] = React.useState({ top: position.y, left: position.x });

  useEffect(() => {
    if (!popupRef.current) return;

    const popup = popupRef.current;
    const rect = popup.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = 16;

    let top = position.y + 8; // 8px offset below the click
    let left = position.x;

    // Adjust if popup would go off screen
    if (left + rect.width > viewportWidth - padding) {
      left = viewportWidth - rect.width - padding;
    }
    if (left < padding) {
      left = padding;
    }
    if (top + rect.height > viewportHeight - padding) {
      top = position.y - rect.height - 8; // Show above instead
    }
    if (top < padding) {
      top = padding;
    }

    setPopupPosition({ top, left });
  }, [position]);

  return (
    <div
      ref={popupRef}
      className="fixed z-[100] bg-zinc-900 border border-zinc-800 rounded-xl p-4 max-w-xs shadow-2xl"
      style={{ top: `${popupPosition.top}px`, left: `${popupPosition.left}px` }}
    >
      <div className="flex items-start justify-between mb-2 gap-2">
        <h3 className="text-base font-bold text-zinc-100 capitalize flex items-center gap-2 flex-1 min-w-0">
          {iconName && <Icon name={iconName} size={16} className="text-cyan-300 flex-shrink-0" />}
          <span className="truncate">{keyword}</span>
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors flex-shrink-0"
          type="button"
        >
          <Icon name="close" size={16} />
        </button>
      </div>
      <p className="text-sm text-zinc-300 leading-relaxed">{definition}</p>
    </div>
  );
};
