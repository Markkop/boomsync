import React, { useEffect, useRef } from 'react';
import { CharacterIndex } from '../types';
import { CharacterCard } from './CharacterCard';

interface CharacterPeekTooltipProps {
  character: CharacterIndex;
  position: { x: number; y: number };
  onClose: () => void;
  onOpenDetail: () => void;
  onShowKeyword?: (keyword: string, position: { x: number; y: number }) => void;
  onShowRequires?: (requires: string[], requiresGroup: string | undefined, characterName: string, position: { x: number; y: number }) => void;
}

export const CharacterPeekTooltip: React.FC<CharacterPeekTooltipProps> = ({
  character,
  position,
  onClose,
  onOpenDetail,
  onShowKeyword,
  onShowRequires,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);

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
      className="fixed z-[100] w-64"
      style={{ top: `${popupPosition.top}px`, left: `${popupPosition.left}px` }}
      onClick={(e) => e.stopPropagation()}
    >
      <CharacterCard
        character={character}
        isSelected={false}
        onTap={() => {
          onOpenDetail();
        }}
        onLongPress={() => {}}
        compact={false}
        showSelectionIndicator={false}
        disabled={false}
        descriptionSize="sm"
        onTagClick={onShowKeyword}
        onRequiresClick={onShowRequires}
      />
    </div>
  );
};

