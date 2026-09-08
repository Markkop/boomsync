import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CharacterFull, RoleDeal } from '../types';
import { Icon } from './Icon';
import { TapSafeButton } from './TapSafeButton';
import { getAllCharacters, getCharacter } from '../services/characterService';
import { getTeamBannerClasses, getTeamColorClasses, getTeamLabel } from '../utils/teamColors';
import { getCatalogTeam, getPresentedTeam, resolvePairAllegiance } from '../utils/presentedTeam';
import { safeModalClose } from '../utils/dismissGuard';

export type CardRevealRequest =
  | { kind: 'player'; playerId: string; playerName: string; roleName: string }
  | { kind: 'buried'; index: number; roleName: string }
  | { kind: 'mine'; playerId: string; playerName: string; roleName: string };

interface CardRevealModalProps {
  request: CardRevealRequest;
  roleDeal: RoleDeal | null;
  onClose: () => void;
}

const getPowerTypeIcon = (powerType: string): React.ComponentProps<typeof Icon>['name'] | null => {
  const typeLower = powerType.toLowerCase();
  if (typeLower.includes('card share')) return 'share';
  if (typeLower.includes('color share')) return 'palette';
  if (typeLower.includes('public reveal')) return 'megaphone';
  if (typeLower.includes('private reveal')) return 'eye';
  if (typeLower.includes('bury')) return 'archive';
  if (typeLower.includes('contagious')) return 'virus';
  if (typeLower.includes('acting')) return 'theater';
  if (typeLower.includes('condition')) return 'sparkles';
  if (typeLower.includes('pause')) return 'clock';
  if (typeLower.includes('odd')) return 'hash';
  return null;
};

function confirmCopy(request: CardRevealRequest): { title: string; body: string } {
  if (request.kind === 'mine') {
    return {
      title: 'Show your card?',
      body: `This will reveal the card dealt to ${request.playerName}.`,
    };
  }
  if (request.kind === 'buried') {
    return {
      title: 'Reveal buried card?',
      body: `This will show buried card ${request.index + 1}.`,
    };
  }
  return {
    title: `Reveal ${request.playerName}'s card?`,
    body: 'Confirm this is the right person before opening.',
  };
}

function slotFromRequest(request: CardRevealRequest): { playerId?: string; buriedIndex?: number } {
  if (request.kind === 'buried') return { buriedIndex: request.index };
  return { playerId: request.playerId };
}

export const CardRevealModal: React.FC<CardRevealModalProps> = ({ request, roleDeal, onClose }) => {
  const [confirmed, setConfirmed] = useState(false);
  const [character, setCharacter] = useState<CharacterFull | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [textVisible, setTextVisible] = useState(false);

  useEffect(() => {
    setConfirmed(false);
    setCharacter(null);
    setLoadError(null);
    setTextVisible(false);
  }, [request]);

  useEffect(() => {
    if (!confirmed) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    getCharacter(request.roleName)
      .then(char => {
        if (cancelled) return;
        setCharacter(char);
        if (!char) setLoadError('Character data not found.');
      })
      .catch((e) => {
        if (cancelled) return;
        console.error('Failed to load character:', e);
        setCharacter(null);
        setLoadError('Failed to load character.');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [confirmed, request.roleName]);

  const { title, body } = confirmCopy(request);
  const handleClose = () => safeModalClose(onClose);

  if (!confirmed) {
    return createPortal(
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-6 bg-zinc-950/90 backdrop-blur-sm">
        <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-[40px] p-8 shadow-2xl">
          <h2 className="text-xl font-black text-zinc-100 mb-2">{title}</h2>
          <p className="text-zinc-400 text-sm mb-6">{body}</p>
          <div className="flex gap-3">
            <TapSafeButton
              onTap={handleClose}
              className="flex-1 py-4 bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold rounded-2xl active:scale-95 transition-transform"
            >
              Cancel
            </TapSafeButton>
            <TapSafeButton
              onTap={() => setConfirmed(true)}
              className="flex-1 py-4 bg-cyan-500 text-zinc-950 font-black rounded-2xl active:scale-95 transition-transform"
            >
              Confirm
            </TapSafeButton>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  const indexTeam = getAllCharacters().find(c => c.name === request.roleName)?.team;
  const catalogTeam = getCatalogTeam(character, indexTeam);
  const allegiance = resolvePairAllegiance(request.roleName, roleDeal, slotFromRequest(request));
  const faceTeam = getPresentedTeam({
    roleName: request.roleName,
    catalogTeam,
    allegiance,
    notes: character?.notes,
  });
  const displayTeam = textVisible ? catalogTeam : faceTeam;
  const banner = getTeamBannerClasses(displayTeam);
  const badge = getTeamColorClasses(catalogTeam);
  const displayName = character?.name ?? request.roleName;
  const winCondition = character?.winCondition ?? '';
  const powers = character?.powers ?? [];

  return createPortal(
    <div className={`fixed inset-0 z-[80] flex flex-col ${textVisible ? 'bg-zinc-950' : banner}`}>
      <div className="w-full max-w-md mx-auto flex flex-col h-full">
        <div className={`${banner} px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-8 ${textVisible ? 'flex-shrink-0' : 'flex-1 flex flex-col'}`}>
          <div className="flex items-start justify-between gap-3">
            {textVisible ? (
              <div className={`inline-flex px-3 py-1 rounded-lg border ${badge} font-semibold text-sm bg-zinc-950/40`}>
                {getTeamLabel(catalogTeam)}
              </div>
            ) : (
              <div className="w-10" />
            )}
            <div className="flex items-center gap-2">
              <TapSafeButton
                onTap={() => setTextVisible(visible => !visible)}
                className="p-2 rounded-xl bg-zinc-950/40 text-zinc-100 active:scale-95"
                aria-label={textVisible ? 'Hide role text' : 'Show role text'}
                aria-pressed={textVisible}
              >
                <Icon name={textVisible ? 'eye' : 'eyeOff'} size={24} />
              </TapSafeButton>
              <TapSafeButton
                onTap={handleClose}
                className="p-2 rounded-xl bg-zinc-950/40 text-zinc-100 active:scale-95"
              >
                <Icon name="close" size={24} />
              </TapSafeButton>
            </div>
          </div>
          {textVisible && (
            <>
              <h1 className="text-4xl font-black text-white mt-6 leading-tight">{displayName}</h1>
              {request.kind !== 'buried' && (
                <p className="text-white/80 text-sm font-semibold mt-2 truncate">
                  {request.playerName}
                </p>
              )}
            </>
          )}
        </div>

        {textVisible && (
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            {loading && (
              <div className="text-zinc-400">Loading card…</div>
            )}

            {!loading && loadError && (
              <p className="text-zinc-400">{loadError}</p>
            )}

            {!loading && (
              <>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-2">Win Condition</h3>
                  <p className="text-zinc-200 leading-relaxed text-lg">
                    {winCondition || '—'}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-3">Powers</h3>
                  {powers.length === 0 ? (
                    <p className="text-zinc-500">No special powers.</p>
                  ) : (
                    <div className="space-y-3">
                      {powers.map((power, index) => {
                        if (!power?.name) return null;
                        const powerTypeIcon = power.type ? getPowerTypeIcon(power.type) : null;
                        return (
                          <div
                            key={index}
                            className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden"
                          >
                            <div className="p-4">
                              <div className="flex items-center gap-2 mb-2">
                                {power.type && (
                                  <span className="px-2 py-1 bg-zinc-800 rounded text-xs font-semibold text-zinc-300 flex items-center gap-1">
                                    {powerTypeIcon && <Icon name={powerTypeIcon} size={12} className="flex-shrink-0" />}
                                    {power.type.toUpperCase()}
                                  </span>
                                )}
                                <span className="font-semibold text-zinc-100">{power.name}</span>
                              </div>
                              {power.description && (
                                <p className="text-zinc-300 text-sm leading-relaxed pt-2 border-t border-zinc-800">
                                  {power.description}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
