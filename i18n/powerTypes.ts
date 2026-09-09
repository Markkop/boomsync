import type { Locale } from './types';

export const POWER_TYPE_LABELS: Record<Exclude<Locale, 'en'>, Record<string, string>> = {
  pt: {
    'alternative win': 'vitória alternativa',
    backup: 'reserva',
    'card share': 'compartilhar carta',
    'card swap': 'troca de cartas',
    'color share': 'compartilhar cor',
    condition: 'condição',
    'end game': 'fim de jogo',
    'pause game': 'pausar jogo',
    'private reveal': 'revelação privada',
    'public reveal': 'revelação pública',
    setup: 'preparação',
    special: 'especial',
  },
  es: {
    'alternative win': 'victoria alternativa',
    backup: 'respaldo',
    'card share': 'compartir carta',
    'card swap': 'intercambio de cartas',
    'color share': 'compartir color',
    condition: 'condición',
    'end game': 'final de partida',
    'pause game': 'pausar juego',
    'private reveal': 'revelación privada',
    'public reveal': 'revelación pública',
    setup: 'preparación',
    special: 'especial',
  },
};
