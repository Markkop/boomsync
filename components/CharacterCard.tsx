import React, { useRef } from 'react';
import { CharacterIndex } from '../types';
import { Icon } from './Icon';

interface CharacterCardProps {
  character: CharacterIndex;
  isSelected: boolean;
  onTap: () => void;
  onLongPress: () => void;
  compact?: boolean;
  showSelectionIndicator?: boolean;
  isLocked?: boolean;
  onToggleLock?: () => void;
  count?: number;
  disabled?: boolean;
  darkened?: boolean;
  titleSuffix?: string;
  showRequires?: boolean;
}

const getTeamColorClasses = (team: string, darkened: boolean = false) => {
  const bgOpacity = darkened ? '/10' : '/20';
  const borderOpacity = darkened ? '/30' : '';
  
  switch (team) {
    case 'red':
      return `bg-red-500${bgOpacity} border-red-500${borderOpacity}`;
    case 'blue':
      return `bg-blue-500${bgOpacity} border-blue-500${borderOpacity}`;
    case 'red-blue':
      return `bg-gradient-to-r from-red-500${bgOpacity} to-blue-500${bgOpacity} border-l-red-500${borderOpacity} border-r-blue-500${borderOpacity} border-t-red-500${borderOpacity} border-b-blue-500${borderOpacity}`;
    case 'grey':
      return `bg-zinc-500${bgOpacity} border-zinc-500${borderOpacity}`;
    case 'green':
      return `bg-green-500${bgOpacity} border-green-500${borderOpacity}`;
    case 'yellow':
      return `bg-yellow-500${bgOpacity} border-yellow-500${borderOpacity}`;
    case 'special':
      return `bg-pink-500${bgOpacity} border-pink-500${borderOpacity}`;
    default:
      return `bg-zinc-800${bgOpacity} border-zinc-700${borderOpacity}`;
  }
};

type IconName = 'share' | 'palette' | 'eye' | 'megaphone' | 'sparkles' | 'virus' | 'theater' | 'swap' | 'archive' | 'star' | 'clock' | 'hash' | 'alert';

const getTagIcon = (tag: string): IconName | null => {
  if (tag.includes('card share power')) return 'share';
  if (tag.includes('color share power')) return 'palette';
  if (tag.includes('private reveal power')) return 'eye';
  if (tag.includes('public reveal power')) return 'megaphone';
  if (tag.includes('condition')) return 'sparkles';
  if (tag.includes('contagious')) return 'virus';
  if (tag.includes('acting')) return 'theater';
  if (tag.includes('card swap')) return 'swap';
  if (tag.includes('bury')) return 'archive';
  if (tag.includes('primary character')) return 'star';
  if (tag.includes('pause game')) return 'clock';
  if (tag.includes('odd player count')) return 'hash';
  return null;
};

const formatTagLabel = (tag: string): string => {
  // Capitalize first letter of each word
  return tag
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  isSelected,
  onTap,
  onLongPress,
  compact = false,
  showSelectionIndicator = true,
  isLocked = false,
  onToggleLock,
  count,
  disabled = false,
  darkened = false,
  titleSuffix,
  showRequires = true
}) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);
  const isPressedRef = useRef(false);

  const handlePointerDown = () => {
    if (disabled) return;
    isPressedRef.current = true;
    isLongPressRef.current = false;
    
    timeoutRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      if (navigator.vibrate) navigator.vibrate(50);
      onLongPress();
    }, 500);
  };

  const handlePointerUp = () => {
    if (disabled) return;
    if (!isPressedRef.current) return;
    isPressedRef.current = false;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (!isLongPressRef.current) {
      onTap();
    }
  };

  const handlePointerCancel = () => {
    if (disabled) return;
    isPressedRef.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const teamColorClasses = getTeamColorClasses(character.team, darkened);
  const visibleTags = character.tags.slice(0, 4);
  const hasRequires = character.requires.length > 0;

  const baseClasses = `
    relative bg-zinc-900 border-2 rounded-2xl p-3 text-left
    transition-all duration-200
    ${teamColorClasses}
    ${isSelected && showSelectionIndicator ? 'ring-2 ring-cyan-500 ring-offset-2 ring-offset-zinc-950' : ''}
    ${compact ? 'p-2' : ''}
    ${disabled ? 'cursor-default' : 'active:scale-95 touch-manipulation'}
  `;

  const content = (
    <>
      {isSelected && showSelectionIndicator && (
        <div className="absolute top-2 right-2 bg-cyan-500 rounded-full p-1">
          <Icon name="check" size={12} className="text-zinc-950" />
        </div>
      )}
      
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold ${darkened ? 'text-zinc-400' : 'text-zinc-100'} truncate ${compact ? 'text-sm' : 'text-base'}`}>
            {count && count > 1 ? `${count}x ` : ''}{character.name}{titleSuffix ? ` ${titleSuffix}` : ''}
          </h3>
          {character.description && (
            <p className={`${darkened ? 'text-zinc-500' : 'text-zinc-400'} mt-1 ${compact ? 'text-xs' : 'text-xs'}`}>
              {character.description}
            </p>
          )}
        </div>
        {isLocked && (
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400" title="Locked for Generator">
            <Icon name="lock" size={14} />
          </div>
        )}
        {onToggleLock && !isLocked && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleLock();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="p-1.5 rounded-lg transition-colors bg-zinc-800/50 text-zinc-500 hover:bg-zinc-700/50"
            title="Lock role"
          >
            <Icon name="unlock" size={14} />
          </button>
        )}
        {onToggleLock && isLocked && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleLock();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="p-1.5 rounded-lg transition-colors bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
            title="Unlock role"
          >
            <Icon name="lock" size={14} />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mt-2">
        {visibleTags.map((tag, idx) => {
          const iconName = getTagIcon(tag);
          return (
            <div
              key={idx}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 min-w-0 ${darkened ? 'bg-zinc-800/30' : 'bg-zinc-800/50'}`}
              title={tag}
            >
              {iconName && (
                <Icon name={iconName} size={12} className={`flex-shrink-0 ${darkened ? 'text-zinc-500' : 'text-zinc-400'}`} />
              )}
              <span className={`break-words ${compact ? 'text-xs' : 'text-xs'} ${darkened ? 'text-zinc-500' : 'text-zinc-300'}`}>
                {formatTagLabel(tag)}
              </span>
            </div>
          );
        })}
        {hasRequires && showRequires && (
          <div className={`flex items-center gap-1 rounded-lg px-2 py-1 min-w-0 ${darkened ? 'bg-zinc-800/30' : 'bg-zinc-800/50'}`}>
            <span className={`break-words ${compact ? 'text-xs' : 'text-xs'} ${darkened ? 'text-zinc-500' : 'text-zinc-400'}`}>
              + {character.requires.join(', ')}
            </span>
          </div>
        )}
      </div>
    </>
  );

  if (disabled) {
    return (
      <div
        className={baseClasses}
      >
        {content}
      </div>
    );
  }

  return (
    <button
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerCancel}
      onPointerCancel={handlePointerCancel}
      onContextMenu={(e) => e.preventDefault()}
      className={baseClasses}
    >
      {content}
    </button>
  );
};
