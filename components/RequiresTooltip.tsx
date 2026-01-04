import React, { useEffect, useRef } from 'react';
import { Icon } from './Icon';
import { getAllCharacters } from '../services/characterService';
import { CharacterIndex } from '../types';

interface RequiresTooltipProps {
  requires: string[];
  requiresGroup?: string;
  characterName: string;
  position: { x: number; y: number };
  onClose: () => void;
}

const getTeamColorClasses = (team: string) => {
  switch (team) {
    case 'blue':
      return 'text-blue-400';
    case 'red':
      return 'text-red-400';
    case 'grey':
      return 'text-zinc-400';
    case 'green':
      return 'text-green-400';
    case 'yellow':
      return 'text-yellow-400';
    case 'red-blue':
    case 'both':
      return 'text-purple-400';
    default:
      return 'text-zinc-300';
  }
};

export const RequiresTooltip: React.FC<RequiresTooltipProps> = ({ 
  requires, 
  requiresGroup, 
  characterName,
  position, 
  onClose 
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const allCharacters = getAllCharacters();
  
  // Find the current character (the one opening the tooltip)
  const currentCharacter = allCharacters.find(c => c.name === characterName);
  
  // Find required characters
  const requiredCharacters = requires
    .map(reqName => allCharacters.find(c => c.name === reqName))
    .filter((c): c is CharacterIndex => c !== undefined);
  
  // Combine current character and required characters, with current character first
  const allCharactersInGroup = currentCharacter 
    ? [currentCharacter, ...requiredCharacters.filter(c => c.name !== characterName)]
    : requiredCharacters;

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
      className="fixed z-[100] bg-zinc-900 border border-zinc-800 rounded-xl p-4 max-w-sm shadow-2xl"
      style={{ top: `${popupPosition.top}px`, left: `${popupPosition.left}px` }}
    >
      <div className="flex items-start justify-between mb-3 gap-2">
        <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2 flex-1 min-w-0">
          <Icon name="alert" size={16} className="text-cyan-300 flex-shrink-0" />
          <span className="truncate">
            {requiresGroup || `${characterName} Requires`}
          </span>
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors flex-shrink-0"
          type="button"
        >
          <Icon name="close" size={16} />
        </button>
      </div>
      
      {allCharactersInGroup.length > 0 ? (
        <div className="space-y-2">
          {allCharactersInGroup.map((char) => {
            const isCurrent = char.name === characterName;
            return (
              <div
                key={char.name}
                className={`bg-zinc-800/50 rounded-lg p-2 border ${isCurrent ? 'border-cyan-500/50' : 'border-zinc-700'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-semibold text-sm ${getTeamColorClasses(char.team)}`}>
                    {char.name}
                  </span>
                  <span className="text-xs text-zinc-500 uppercase">
                    {char.team}
                  </span>
                </div>
                {char.description && (
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {char.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {requiresGroup && (
            <p className="text-sm text-zinc-300">
              {requiresGroup}
            </p>
          )}
          {requires.length > 0 && (
            <div>
              <p className="text-sm text-zinc-300 mb-2">Required:</p>
              <ul className="list-disc list-inside text-sm text-zinc-400 space-y-1">
                {requires.map((req, idx) => (
                  <li key={idx}>{req}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
