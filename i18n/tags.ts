import type { Locale } from './types';

/** English tag → localized label. Pause-duration tags are handled by template in display helpers. */
export const TAG_LABELS: Record<Exclude<Locale, 'en'>, Record<string, string>> = {
  pt: {
    acting: 'interpretação',
    bury: 'enterrar',
    'card share power': 'poder de compartilhar carta',
    'card swap': 'troca de cartas',
    'color share power': 'poder de compartilhar cor',
    condition: 'condição',
    contagious: 'contagioso',
    'odd player count': 'número ímpar de jogadores',
    'primary character': 'personagem principal',
    'private reveal power': 'poder de revelação privada',
    'public reveal power': 'poder de revelação pública',
  },
  es: {
    acting: 'actuación',
    bury: 'enterrar',
    'card share power': 'poder de compartir carta',
    'card swap': 'intercambio de cartas',
    'color share power': 'poder de compartir color',
    condition: 'condición',
    contagious: 'contagioso',
    'odd player count': 'número impar de jugadores',
    'primary character': 'personaje principal',
    'private reveal power': 'poder de revelación privada',
    'public reveal power': 'poder de revelación pública',
  },
};

export const PAUSE_GAME_TAG = {
  pt: 'pausa o jogo {{n}}',
  es: 'pausa el juego {{n}}',
  en: 'pause game {{n}}',
};
