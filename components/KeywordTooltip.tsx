import React, { useEffect, useRef } from 'react';
import { Icon } from './Icon';
import { useLocale, useT } from '../i18n/I18nContext';
import { getKeywordDefinition, resolveKeywordKey, translateKeywordLabel, translateTag } from '../i18n/display';
import { KEYWORD_KEYS } from '../i18n/keywords';

interface KeywordTooltipProps {
  keyword: string;
  position: { x: number; y: number };
  onClose: () => void;
}

/** @deprecated Prefer KEYWORD_KEYS / getKeywordDefinition. Kept for any leftover English-key checks. */
export const KEYWORD_DEFINITIONS: Record<string, string> = Object.fromEntries(
  KEYWORD_KEYS.map(key => [key, key])
);

export const KeywordTooltip: React.FC<KeywordTooltipProps> = ({ keyword, position, onClose }) => {
  const t = useT();
  const locale = useLocale();
  const popupRef = useRef<HTMLDivElement>(null);
  const englishKey = resolveKeywordKey(keyword) ?? keyword.toLowerCase();
  const definition = getKeywordDefinition(locale, englishKey) ?? t('keyword.noDefinition');
  const title = translateKeywordLabel(locale, englishKey) || translateTag(locale, keyword) || keyword;
  const lower = englishKey.toLowerCase();
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

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const [popupPosition, setPopupPosition] = React.useState({ top: position.y, left: position.x });

  useEffect(() => {
    if (!popupRef.current) return;

    const popup = popupRef.current;
    const rect = popup.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = 16;

    let top = position.y + 8;
    let left = position.x;

    if (left + rect.width > viewportWidth - padding) {
      left = viewportWidth - rect.width - padding;
    }
    if (left < padding) {
      left = padding;
    }
    if (top + rect.height > viewportHeight - padding) {
      top = position.y - rect.height - 8;
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
        <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2 flex-1 min-w-0">
          {iconName && <Icon name={iconName} size={16} className="text-cyan-300 flex-shrink-0" />}
          <span className="truncate">{title}</span>
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
