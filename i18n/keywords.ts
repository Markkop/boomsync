import type { Locale } from './types';

export interface KeywordEntry {
  /** Display label per locale. English key is the canonical lookup id. */
  label: Record<Locale, string>;
  definition: Record<Locale, string>;
}

export const KEYWORD_GLOSSARY: Record<string, KeywordEntry> = {
  dead: {
    label: { en: 'dead', pt: 'morto', es: 'muerto' },
    definition: {
      en: 'A condition that causes a player to lose the game. Players with the "dead" condition cannot win.',
      pt: 'Uma condição que faz o jogador perder o jogo. Jogadores com a condição "morto" não podem vencer.',
      es: 'Una condición que hace que un jugador pierda la partida. Los jugadores con la condición «muerto» no pueden ganar.',
    },
  },
  'card share': {
    label: { en: 'card share', pt: 'compartilhar carta', es: 'compartir carta' },
    definition: {
      en: 'When two players privately show each other their character cards. This activates certain character powers.',
      pt: 'Quando dois jogadores mostram um ao outro, em privado, suas cartas de personagem. Isso ativa certos poderes.',
      es: 'Cuando dos jugadores se muestran en privado sus cartas de personaje. Esto activa ciertos poderes.',
    },
  },
  'color share': {
    label: { en: 'color share', pt: 'compartilhar cor', es: 'compartir color' },
    definition: {
      en: 'When two players show each other the colored side of their cards (red or blue) without revealing the character name.',
      pt: 'Quando dois jogadores mostram um ao outro o lado colorido das cartas (vermelho ou azul) sem revelar o nome do personagem.',
      es: 'Cuando dos jugadores se muestran el lado de color de sus cartas (rojo o azul) sin revelar el nombre del personaje.',
    },
  },
  bury: {
    label: { en: 'bury', pt: 'enterrar', es: 'enterrar' },
    definition: {
      en: 'A card that is removed from play and placed face-down. Backup characters activate when their primary is buried.',
      pt: 'Uma carta removida do jogo e colocada virada para baixo. Personagens reserva ativam quando o principal é enterrado.',
      es: 'Una carta retirada del juego y colocada boca abajo. Los personajes de respaldo se activan cuando su principal es enterrado.',
    },
  },
  buried: {
    label: { en: 'buried', pt: 'enterrada', es: 'enterrada' },
    definition: {
      en: 'A card that is removed from play and placed face-down. Backup characters activate when their primary is buried.',
      pt: 'Uma carta removida do jogo e colocada virada para baixo. Personagens reserva ativam quando o principal é enterrado.',
      es: 'Una carta retirada del juego y colocada boca abajo. Los personajes de respaldo se activan cuando su principal es enterrado.',
    },
  },
  contagious: {
    label: { en: 'contagious', pt: 'contagioso', es: 'contagioso' },
    definition: {
      en: 'A condition that spreads to other players when they interact (card share or color share).',
      pt: 'Uma condição que se espalha para outros jogadores quando eles interagem (compartilhar carta ou cor).',
      es: 'Una condición que se propaga a otros jugadores cuando interactúan (compartir carta o color).',
    },
  },
  foolish: {
    label: { en: 'foolish', pt: 'tolo', es: 'tonto' },
    definition: {
      en: 'A condition that prevents a player from refusing card share or color share offers.',
      pt: 'Uma condição que impede o jogador de recusar ofertas de compartilhar carta ou cor.',
      es: 'Una condición que impide a un jugador rechazar ofertas de compartir carta o color.',
    },
  },
  cultist: {
    label: { en: 'cultist', pt: 'cultista', es: 'cultista' },
    definition: {
      en: 'A condition that links players to the Cult Leader. If the Cult Leader dies, all cultists lose.',
      pt: 'Uma condição que liga jogadores ao Líder de Culto. Se o Líder de Culto morrer, todos os cultistas perdem.',
      es: 'Una condición que vincula a los jugadores con el Líder de Culto. Si el Líder de Culto muere, todos los cultistas pierden.',
    },
  },
  zombie: {
    label: { en: 'zombie', pt: 'zumbi', es: 'zombi' },
    definition: {
      en: "A condition that changes a player's allegiance to Team Zombie.",
      pt: 'Uma condição que muda a lealdade do jogador para o Time Zumbi.',
      es: 'Una condición que cambia la lealtad del jugador al Equipo Zombi.',
    },
  },
  'in love': {
    label: { en: 'in love', pt: 'apaixonado', es: 'enamorado' },
    definition: {
      en: 'A condition that changes win conditions - players must end in the same room.',
      pt: 'Uma condição que muda as condições de vitória — os jogadores devem terminar na mesma sala.',
      es: 'Una condición que cambia las condiciones de victoria: los jugadores deben terminar en la misma sala.',
    },
  },
  'in hate': {
    label: { en: 'in hate', pt: 'em ódio', es: 'en odio' },
    definition: {
      en: 'A condition that changes win conditions - players must end in opposite rooms.',
      pt: 'Uma condição que muda as condições de vitória — os jogadores devem terminar em salas opostas.',
      es: 'Una condición que cambia las condiciones de victoria: los jugadores deben terminar en salas opuestas.',
    },
  },
  traitor: {
    label: { en: 'traitor', pt: 'traidor', es: 'traidor' },
    definition: {
      en: 'A condition that can be removed by card sharing with the Loyalist.',
      pt: 'Uma condição que pode ser removida ao compartilhar carta com o Lealista.',
      es: 'Una condición que se puede quitar al compartir carta con el Lealista.',
    },
  },
  immune: {
    label: { en: 'immune', pt: 'imune', es: 'inmune' },
    definition: {
      en: 'A condition that makes a player immune to all powers and conditions.',
      pt: 'Uma condição que torna o jogador imune a todos os poderes e condições.',
      es: 'Una condición que hace a un jugador inmune a todos los poderes y condiciones.',
    },
  },
  fireproof: {
    label: { en: 'fireproof', pt: 'à prova de fogo', es: 'a prueba de fuego' },
    definition: {
      en: 'A condition that prevents gaining the "dead" condition from the "firebomb" condition.',
      pt: 'Uma condição que impede ganhar a condição "morto" a partir da condição "bomba incendiária".',
      es: 'Una condición que impide adquirir la condición «muerto» a partir de la condición «bomba incendiaria».',
    },
  },
  firebomb: {
    label: { en: 'firebomb', pt: 'bomba incendiária', es: 'bomba incendiaria' },
    definition: {
      en: 'A condition that causes all players to gain "dead" at end of game if the Bomber has it.',
      pt: 'Uma condição que faz todos os jogadores ganharem "morto" no fim do jogo se o Homem-Bomba a tiver.',
      es: 'Una condición que hace que todos los jugadores adquieran «muerto» al final si el Bombardero la tiene.',
    },
  },
  impregnated: {
    label: { en: 'impregnated', pt: 'impregnado', es: 'impregnado' },
    definition: {
      en: 'A condition from the Xenomorph that causes all players in the same room to gain "dead" at end of game.',
      pt: 'Uma condição do Xenomorfo que faz todos os jogadores na mesma sala ganharem "morto" no fim do jogo.',
      es: 'Una condición del Xenomorfo que hace que todos los jugadores de la misma sala adquieran «muerto» al final.',
    },
  },
  toast: {
    label: { en: 'toast', pt: 'tostado', es: 'tostado' },
    definition: {
      en: 'A condition from the Dragon that causes players to gain "dead" at end of game.',
      pt: 'Uma condição do Dragão que faz os jogadores ganharem "morto" no fim do jogo.',
      es: 'Una condición del Dragón que hace que los jugadores adquieran «muerto» al final de la partida.',
    },
  },
  shy: {
    label: { en: 'shy', pt: 'tímido', es: 'tímido' },
    definition: {
      en: 'A condition that prevents a player from initiating card share or color share.',
      pt: 'Uma condição que impede o jogador de iniciar compartilhamento de carta ou cor.',
      es: 'Una condición que impide a un jugador iniciar un intercambio de carta o de color.',
    },
  },
  cleanse: {
    label: { en: 'cleanse', pt: 'purificar', es: 'purificar' },
    definition: {
      en: 'When a character card changes hands, it loses all acquired conditions and resets to its base state.',
      pt: 'Quando uma carta de personagem muda de mãos, ela perde todas as condições adquiridas e volta ao estado base.',
      es: 'Cuando una carta de personaje cambia de manos, pierde todas las condiciones adquiridas y vuelve a su estado base.',
    },
  },
  'card share power': {
    label: { en: 'card share power', pt: 'Compartilhar carta', es: 'Compartir carta' },
    definition: {
      en: 'This character has a power that activates when card sharing occurs.',
      pt: 'Este personagem tem um poder que ativa quando ocorre compartilhamento de carta.',
      es: 'Este personaje tiene un poder que se activa al compartir carta.',
    },
  },
  'color share power': {
    label: { en: 'color share power', pt: 'Compartilhar cor', es: 'Compartir color' },
    definition: {
      en: 'This character has a power that activates when color sharing occurs.',
      pt: 'Este personagem tem um poder que ativa quando ocorre compartilhamento de cor.',
      es: 'Este personaje tiene un poder que se activa al compartir color.',
    },
  },
  'private reveal power': {
    label: { en: 'private reveal power', pt: 'Revelação privada', es: 'Revelación privada' },
    definition: {
      en: 'This character can privately reveal their card to another player.',
      pt: 'Este personagem pode revelar a carta em privado para outro jogador.',
      es: 'Este personaje puede revelar su carta en privado a otro jugador.',
    },
  },
  'public reveal power': {
    label: { en: 'public reveal power', pt: 'Revelação pública', es: 'Revelación pública' },
    definition: {
      en: 'This character can publicly reveal their card to all players.',
      pt: 'Este personagem pode revelar a carta publicamente para todos os jogadores.',
      es: 'Este personaje puede revelar su carta públicamente a todos los jugadores.',
    },
  },
  condition: {
    label: { en: 'condition', pt: 'condição', es: 'condición' },
    definition: {
      en: 'This character starts with or can apply conditions to players.',
      pt: 'Este personagem começa com ou pode aplicar condições aos jogadores.',
      es: 'Este personaje empieza con o puede aplicar condiciones a los jugadores.',
    },
  },
  acting: {
    label: { en: 'acting', pt: 'interpretação', es: 'actuación' },
    definition: {
      en: 'This character requires acting or roleplay to function properly.',
      pt: 'Este personagem exige interpretação ou roleplay para funcionar bem.',
      es: 'Este personaje requiere actuación o roleplay para funcionar bien.',
    },
  },
  'card swap': {
    label: { en: 'card swap', pt: 'troca de cartas', es: 'intercambio de cartas' },
    definition: {
      en: 'This character can swap cards with other players.',
      pt: 'Este personagem pode trocar cartas com outros jogadores.',
      es: 'Este personaje puede intercambiar cartas con otros jugadores.',
    },
  },
  'primary character': {
    label: { en: 'primary character', pt: 'personagem principal', es: 'personaje principal' },
    definition: {
      en: 'Core character for team win conditions (e.g., President, Bomber).',
      pt: 'Personagem central para as condições de vitória do time (ex.: Presidente, Homem-Bomba).',
      es: 'Personaje central para las condiciones de victoria del equipo (p. ej., Presidente, Bombardero).',
    },
  },
  'pause game': {
    label: { en: 'pause game', pt: 'pausar jogo', es: 'pausar juego' },
    definition: {
      en: 'This character pauses the game for a specified duration when their power activates.',
      pt: 'Este personagem pausa o jogo por um tempo determinado quando o poder ativa.',
      es: 'Este personaje pausa el juego durante un tiempo determinado cuando se activa su poder.',
    },
  },
  'odd player count': {
    label: { en: 'odd player count', pt: 'número ímpar de jogadores', es: 'número impar de jugadores' },
    definition: {
      en: 'This character only works correctly with an odd number of players.',
      pt: 'Este personagem só funciona corretamente com um número ímpar de jogadores.',
      es: 'Este personaje solo funciona correctamente con un número impar de jugadores.',
    },
  },
  'pauses game': {
    label: { en: 'pauses game', pt: 'pausa o jogo', es: 'pausa el juego' },
    definition: {
      en: 'This character pauses the game for a specified duration when their power activates.',
      pt: 'Este personagem pausa o jogo por um tempo determinado quando o poder ativa.',
      es: 'Este personaje pausa el juego durante un tiempo determinado cuando se activa su poder.',
    },
  },
};

/** English keys used for matching (same set as the former KEYWORD_DEFINITIONS). */
export const KEYWORD_KEYS = Object.keys(KEYWORD_GLOSSARY);
