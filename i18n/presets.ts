import type { Locale } from './types';

export interface PresetOverlay {
  name: string;
  metaAnalysis: string;
}

const PT_DIFF = { easy: 'Fácil', medium: 'Médio', hard: 'Difícil' } as const;
const ES_DIFF = { easy: 'Fácil', medium: 'Medio', hard: 'Difícil' } as const;

function presetName(locale: Exclude<Locale, 'en'>, difficulty: 'easy' | 'medium' | 'hard', n: number): string {
  const label = locale === 'pt' ? PT_DIFF[difficulty] : ES_DIFF[difficulty];
  return locale === 'pt' ? `${label} (${n} jogadores)` : `${label} (${n} jugadores)`;
}

/** Built-in preset overlays keyed by preset id. Custom presets keep user-entered names. */
export const PRESET_OVERLAYS: Record<Exclude<Locale, 'en'>, Record<string, PresetOverlay>> = {
  pt: {
    'easy-8': { name: presetName('pt', 'easy', 8), metaAnalysis: 'Experiência introdutória pura, focada em separação física e eleição de líderes' },
    'medium-8': { name: presetName('pt', 'medium', 8), metaAnalysis: 'Introduz o "Loop de Saúde" — os MVPs precisam encontrar seus curadores para vencer' },
    'hard-8': { name: presetName('pt', 'hard', 8), metaAnalysis: '"O Setup Hardcore" — objetivos neutros dominam, tornando a lealdade de time secundária' },
    'easy-9': { name: presetName('pt', 'easy', 9), metaAnalysis: 'Ensina a negociar com partes neutras para garantir maiorias' },
    'medium-9': { name: presetName('pt', 'medium', 9), metaAnalysis: 'Introduz o engano — Espiões mascaram a identidade de time dos MVPs' },
    'hard-9': { name: presetName('pt', 'hard', 9), metaAnalysis: 'Variante "Enterrar" — uma carta é removida; é preciso deduzir se o Homem-Bomba sequer existe' },
    'easy-10': { name: presetName('pt', 'easy', 10), metaAnalysis: 'Foco em gestão de reféns e estabilidade da liderança das salas' },
    'medium-10': { name: presetName('pt', 'medium', 10), metaAnalysis: 'Negação de informação — Rapazes Tímidos cobrem o Presidente' },
    'hard-10': { name: presetName('pt', 'hard', 10), metaAnalysis: 'Alto caos — a Batata Quente troca papéis durante compartilhamentos, podendo mudar o Presidente' },
    'easy-11': { name: presetName('pt', 'easy', 11), metaAnalysis: 'Jogo introdutório de compartilhamento de cor' },
    'medium-11': { name: presetName('pt', 'medium', 11), metaAnalysis: 'Setup competitivo padrão para a maioria das noites de jogo' },
    'hard-11': { name: presetName('pt', 'hard', 11), metaAnalysis: 'Coleta agressiva de informação — Executores forçam as pessoas a falar' },
    'easy-12': { name: presetName('pt', 'easy', 12), metaAnalysis: 'Jogo básico em larga escala' },
    'medium-12': { name: presetName('pt', 'medium', 12), metaAnalysis: 'Papéis de interpretação (Anjo/Demônio) forçam padrões de fala honesta e desonesta' },
    'hard-12': { name: presetName('pt', 'hard', 12), metaAnalysis: '"O Jogo Cinza" — facções neutras têm mais poder que os times coloridos' },
    'easy-13': { name: presetName('pt', 'easy', 13), metaAnalysis: 'Expansão padrão para número ímpar' },
    'medium-13': { name: presetName('pt', 'medium', 13), metaAnalysis: 'O setup "Os Amantes" adiciona um objetivo espacial que complica o controle das salas' },
    'hard-13': { name: presetName('pt', 'hard', 13), metaAnalysis: 'Maldições e Atiradores criam um ambiente de informação hostil' },
    'easy-15': { name: presetName('pt', 'easy', 15), metaAnalysis: 'Jogo básico em grupo grande — o "ponto doce" do jogo' },
    'medium-15': { name: presetName('pt', 'medium', 15), metaAnalysis: 'Jogo competitivo padrão de alta interação' },
    'hard-15': { name: presetName('pt', 'hard', 15), metaAnalysis: '"A Pia da Cozinha" — cada jogador tem um objetivo complexo' },
    'easy-16': { name: presetName('pt', 'easy', 16), metaAnalysis: 'Jogo introdutório grande' },
    'medium-16': { name: presetName('pt', 'medium', 16), metaAnalysis: 'Papéis de interpretação geram humor social e caos' },
    'hard-16': { name: presetName('pt', 'hard', 16), metaAnalysis: 'Rede complexa de efeitos de status e condições de vitória interdependentes' },
    'easy-17': { name: presetName('pt', 'easy', 17), metaAnalysis: 'Jogo introdutório grande' },
    'medium-17': { name: presetName('pt', 'medium', 17), metaAnalysis: 'Papéis de interpretação geram humor social e caos' },
    'hard-17': { name: presetName('pt', 'hard', 17), metaAnalysis: 'Rede complexa de efeitos de status e condições de vitória interdependentes' },
    'easy-18': { name: presetName('pt', 'easy', 18), metaAnalysis: 'Jogo padrão para grupo enorme' },
    'medium-18': { name: presetName('pt', 'medium', 18), metaAnalysis: 'Papéis de Paparazzo podem forçar revelações de celebridades' },
    'hard-18': { name: presetName('pt', 'hard', 18), metaAnalysis: 'Embaixadores facilitam interação entre salas enquanto o Zumbi espalha a praga' },
    'easy-19': { name: presetName('pt', 'easy', 19), metaAnalysis: 'Jogo padrão para grupo enorme' },
    'medium-19': { name: presetName('pt', 'medium', 19), metaAnalysis: 'Papéis de Paparazzo podem forçar revelações de celebridades' },
    'hard-19': { name: presetName('pt', 'hard', 19), metaAnalysis: 'Embaixadores facilitam interação entre salas enquanto o Zumbi espalha a praga' },
    'easy-20': { name: presetName('pt', 'easy', 20), metaAnalysis: 'Jogo padrão para grupo enorme' },
    'medium-20': { name: presetName('pt', 'medium', 20), metaAnalysis: 'Papéis de Paparazzo podem forçar revelações de celebridades' },
    'hard-20': { name: presetName('pt', 'hard', 20), metaAnalysis: 'Embaixadores facilitam interação entre salas enquanto o Zumbi espalha a praga' },
  },
  es: {
    'easy-8': { name: presetName('es', 'easy', 8), metaAnalysis: 'Experiencia introductoria pura, centrada en la separación física y la elección de líderes' },
    'medium-8': { name: presetName('es', 'medium', 8), metaAnalysis: 'Introduce el "Bucle de Salud": los MVP deben encontrar a sus sanadores para ganar' },
    'hard-8': { name: presetName('es', 'hard', 8), metaAnalysis: '"El setup hardcore": los objetivos neutrales dominan y la lealtad de equipo pasa a segundo plano' },
    'easy-9': { name: presetName('es', 'easy', 9), metaAnalysis: 'Enseña a negociar con partes neutrales para asegurar mayorías' },
    'medium-9': { name: presetName('es', 'medium', 9), metaAnalysis: 'Introduce el engaño: los Espías ocultan la identidad de equipo de los MVP' },
    'hard-9': { name: presetName('es', 'hard', 9), metaAnalysis: 'Variante "Enterrar": se quita una carta; hay que deducir si el Bombardero siquiera existe' },
    'easy-10': { name: presetName('es', 'easy', 10), metaAnalysis: 'Enfoque en la gestión de rehenes y la estabilidad del liderazgo de las salas' },
    'medium-10': { name: presetName('es', 'medium', 10), metaAnalysis: 'Negación de información: los Chicos Tímidos cubren al Presidente' },
    'hard-10': { name: presetName('es', 'hard', 10), metaAnalysis: 'Alto caos: la Papa Caliente intercambia roles al compartir, pudiendo cambiar al Presidente' },
    'easy-11': { name: presetName('es', 'easy', 11), metaAnalysis: 'Partida introductoria de compartir color' },
    'medium-11': { name: presetName('es', 'medium', 11), metaAnalysis: 'Setup competitivo estándar para la mayoría de las noches de juego' },
    'hard-11': { name: presetName('es', 'hard', 11), metaAnalysis: 'Recolección agresiva de información: los Ejecutores obligan a la gente a hablar' },
    'easy-12': { name: presetName('es', 'easy', 12), metaAnalysis: 'Juego básico a gran escala' },
    'medium-12': { name: presetName('es', 'medium', 12), metaAnalysis: 'Roles de actuación (Ángel/Demonio) fuerzan patrones de habla honestos y deshonestos' },
    'hard-12': { name: presetName('es', 'hard', 12), metaAnalysis: '"El juego gris": las facciones neutrales tienen más poder que los equipos de color' },
    'easy-13': { name: presetName('es', 'easy', 13), metaAnalysis: 'Expansión estándar para número impar' },
    'medium-13': { name: presetName('es', 'medium', 13), metaAnalysis: 'El setup "Los Amantes" añade un objetivo espacial que complica el control de las salas' },
    'hard-13': { name: presetName('es', 'hard', 13), metaAnalysis: 'Maldiciones y francotiradores crean un entorno de información hostil' },
    'easy-15': { name: presetName('es', 'easy', 15), metaAnalysis: 'Juego básico en grupo grande: el "punto dulce" del juego' },
    'medium-15': { name: presetName('es', 'medium', 15), metaAnalysis: 'Partida competitiva estándar de alta interacción' },
    'hard-15': { name: presetName('es', 'hard', 15), metaAnalysis: '"El cajón de sastre": cada jugador tiene un objetivo complejo' },
    'easy-16': { name: presetName('es', 'easy', 16), metaAnalysis: 'Partida introductoria grande' },
    'medium-16': { name: presetName('es', 'medium', 16), metaAnalysis: 'Los roles de actuación generan humor social y caos' },
    'hard-16': { name: presetName('es', 'hard', 16), metaAnalysis: 'Red compleja de efectos de estado y condiciones de victoria interdependientes' },
    'easy-17': { name: presetName('es', 'easy', 17), metaAnalysis: 'Partida introductoria grande' },
    'medium-17': { name: presetName('es', 'medium', 17), metaAnalysis: 'Los roles de actuación generan humor social y caos' },
    'hard-17': { name: presetName('es', 'hard', 17), metaAnalysis: 'Red compleja de efectos de estado y condiciones de victoria interdependientes' },
    'easy-18': { name: presetName('es', 'easy', 18), metaAnalysis: 'Juego estándar para grupo enorme' },
    'medium-18': { name: presetName('es', 'medium', 18), metaAnalysis: 'Los roles de Paparazzo pueden forzar revelaciones de celebridades' },
    'hard-18': { name: presetName('es', 'hard', 18), metaAnalysis: 'Los Embajadores facilitan la interacción entre salas mientras el Zombi extiende la plaga' },
    'easy-19': { name: presetName('es', 'easy', 19), metaAnalysis: 'Juego estándar para grupo enorme' },
    'medium-19': { name: presetName('es', 'medium', 19), metaAnalysis: 'Los roles de Paparazzo pueden forzar revelaciones de celebridades' },
    'hard-19': { name: presetName('es', 'hard', 19), metaAnalysis: 'Los Embajadores facilitan la interacción entre salas mientras el Zombi extiende la plaga' },
    'easy-20': { name: presetName('es', 'easy', 20), metaAnalysis: 'Juego estándar para grupo enorme' },
    'medium-20': { name: presetName('es', 'medium', 20), metaAnalysis: 'Los roles de Paparazzo pueden forzar revelaciones de celebridades' },
    'hard-20': { name: presetName('es', 'hard', 20), metaAnalysis: 'Los Embajadores facilitan la interacción entre salas mientras el Zombi extiende la plaga' },
  },
};
