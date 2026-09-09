import type { Locale } from './types';

/** English tag → localized label. Pause-duration tags are handled by template in display helpers. */
export const TAG_LABELS: Record<Exclude<Locale, 'en'>, Record<string, string>> = {
  pt: {
    acting: 'interpretação',
    bury: 'enterrar',
    'card share power': 'Compartilhar carta',
    'card swap': 'troca de cartas',
    'color share power': 'Compartilhar cor',
    condition: 'condição',
    contagious: 'contagioso',
    'odd player count': 'número ímpar de jogadores',
    'primary character': 'personagem principal',
    'private reveal power': 'Revelação privada',
    'public reveal power': 'Revelação pública',
  },
  es: {
    acting: 'actuación',
    bury: 'enterrar',
    'card share power': 'Compartir carta',
    'card swap': 'intercambio de cartas',
    'color share power': 'Compartir color',
    condition: 'condición',
    contagious: 'contagioso',
    'odd player count': 'número impar de jugadores',
    'primary character': 'personaje principal',
    'private reveal power': 'Revelación privada',
    'public reveal power': 'Revelación pública',
  },
};

export const PAUSE_GAME_TAG = {
  pt: 'pausa o jogo {{n}}',
  es: 'pausa el juego {{n}}',
  en: 'pause game {{n}}',
};
