#!/usr/bin/env node
/**
 * Generates /workspace/i18n/characters/es.json from /tmp/en-catalog.json
 */
const fs = require('fs');
const path = require('path');

const en = require('/tmp/en-catalog.json');
const outPath = path.join(__dirname, '../i18n/characters/es.json');

const STANDARD_TEAM = 'Condición de victoria estándar del equipo';
const STANDARD_WIN = 'Condición de victoria estándar';

const requiresGroup = {
  'Buried Card Mechanic': 'Mecánica de Carta Enterrada',
  'Backup: Alchemist': 'Respaldo: Alquimista',
  'Sniper Group': 'Grupo del Francotirador',
  'Drone/Fist Pair': 'Par Dron/Puño',
  'Backup: Blue Drone': 'Respaldo: Dron Azul',
  'Backup: Dragon': 'Respaldo: Dragón',
  'Backup: Eggineer': 'Respaldo: Huevineer',
  'Butler/Maid Pair': 'Par Mayordomo/Doncella',
  'Frotteur/Prude Pair': 'Par Frotteur/Mojigato',
  'Fugitive Group': 'Grupo del Fugitivo',
  'Tie Game Mechanic': 'Mecánica de Empate',
  'Judge Mechanic': 'Mecánica del Juez',
  'Romeo/Juliet Pair': 'Par Romeo/Juliet',
  'Conspirator Mechanic': 'Mecánica del Conspirador',
  'Backup: Bomber': 'Respaldo: Bombardero',
  'Backup: Doctor': 'Respaldo: Doctor',
  'Backup: President': 'Respaldo: Presidente',
  'Backup: Red Fist': 'Respaldo: Puño Rojo',
  'Backup: Engineer': 'Respaldo: Ingeniero',
  'Backup: King': 'Respaldo: Rey',
  'Rock Paper Scissors': 'Piedra Papel Tijeras',
  'Wife/Mistress Pair': 'Par Esposa/Amante',
  'Ahab/Moby Pair': 'Par Ahab/Moby',
};

/** @type {Record<string, { name: string; description: string; winCondition: string; powers?: Array<{name:string;description:string}>; notes?: string[]; requiresGroup?: string }>} */
const t = {
  Agent: {
    name: 'Agente',
    description: 'Obliga a los jugadores a compartir carta contigo una vez por ronda.',
    winCondition: STANDARD_TEAM,
    powers: [{ name: 'AGENT', description: 'Una vez por ronda, puedes revelar tu carta en privado a un jugador y obligar a ese jugador a compartir carta contigo. Debes decir verbalmente al jugador objetivo: «Estoy usando mi poder de AGENTE. DEBES revelarme tu carta.»' }],
    notes: [],
  },
  Alchemist: {
    name: 'Alquimista',
    description: 'El Rey debe compartir carta contigo o el Equipo Azul pierde.',
    winCondition: 'El Equipo Azul tiene la siguiente condición de victoria adicional: el Rey debe compartir carta con el Alquimista antes del final del juego o el Equipo Azul pierde',
    powers: [{ name: 'ALCHEMIST', description: 'Al jugar con el Alquimista, el Equipo Azul tiene la siguiente condición de victoria adicional: el Rey debe compartir carta con el Alquimista antes del final del juego o el Equipo Azul pierde. Al final del juego, se le preguntará al Rey si compartió carta con el Alquimista. En ese momento, ambos jugadores confirmarán o negarán haber compartido carta.' }],
    notes: [
      'Recuerda que si el personaje Rey cambia de jugador (quizá por la Papa Caliente), el nuevo Rey debe compartir carta con el Alquimista.',
      'Las partidas con el Alquimista y el Huevineer pueden terminar con todos los jugadores perdiendo.',
    ],
  },
  Alien: {
    name: 'Alien',
    description: 'Roba cartas a quien comparta carta contigo.',
    winCondition: STANDARD_TEAM,
    powers: [{ name: 'ABDUCTION', description: 'Debes quedarte con la carta de cualquier personaje que comparta carta contigo. No puedes hacer nada con las cartas adquiridas, incluido mostrarlas a otros o usar poderes asociados a la carta. Los jugadores a quienes se les robaron las cartas mantienen sus poderes y lealtad, pero obviamente pierden la capacidad de compartir sus cartas con otros o usar cualquier poder que requiera revelación privada, pública, de color o intercambio de carta.' }],
    notes: ['Puede ser difícil ocultar todas las cartas adquiridas'],
  },
  Ambassador: {
    name: 'Embajador',
    description: 'Inmune a todos los poderes; puede moverse libremente entre salas.',
    winCondition: STANDARD_TEAM,
    powers: [{ name: 'IMMUNE', description: 'Antes de que comience el juego, pero después de repartir las cartas de personaje, debes anunciar públicamente «¡Soy un Embajador!» y mantener tu carta revelada públicamente durante el resto del juego. Esta revelación pública es permanente. Los Embajadores tienen la condición «inmune». Los jugadores con la condición «inmune» son inmunes a todos los poderes y condiciones sin excepción. Los Embajadores pueden caminar libremente entre las dos salas. Los Embajadores nunca pueden participar en ninguna votación (p. ej., votar para nominar o usurpar a un líder). Los Embajadores nunca pueden ser elegidos por los líderes para ser transferidos a otra sala (ni por otros personajes con esos poderes), ya que nunca se cuentan como parte de la población de una sala.' }],
    notes: [
      'Debe haber 2 Embajadores para un equilibrio adecuado del juego. No entierres Embajadores.',
      'Como los Embajadores nunca se consideran parte de la población de una sala, no cuentan para el número de jugadores del juego y no cuentan a favor ni en contra del objetivo de victoria del Equipo Zombi. Esto significa que si tienes 18 jugadores incluyendo a los Embajadores, deberías jugar una partida de 16 jugadores.',
    ],
  },
  Amnesiac: {
    name: 'Amnésico',
    description: 'Adivina el equipo de la carta enterrada para ganar.',
    winCondition: 'Al final de la última ronda, antes de que todos los jugadores revelen sus cartas de personaje, debes declarar a qué equipo perteneces diciendo: «Recuerdo a qué equipo pertenezco. Estoy en el _________.» Debes elegir el Equipo Rojo, el Equipo Azul o ningún equipo. Para ganar debes adivinar la lealtad de equipo de la carta enterrada',
    notes: [
      'Esta carta de personaje solo puede usarse con una carta enterrada.',
      'Si eliges el equipo correcto (el equipo de la carta enterrada), pero tu equipo pierde, tú también pierdes. Si dices «No estoy en el equipo de nadie» y la carta enterrada no está en el Equipo Rojo ni en el Equipo Azul, ganas.',
      'Funciona bien para dar sabor en partidas con pocos jugadores.',
      'Funciona mal con demasiados grises, muchos jugadores, Ninjas y Conspiradores',
    ],
    requiresGroup: requiresGroup['Buried Card Mechanic'],
  },
  Anarchist: {
    name: 'Anarquista',
    description: 'Gana ayudando a usurpar líderes en la mayoría de las rondas.',
    winCondition: 'Ganas si tu voto ayudó a usurpar exitosamente a un líder durante la mayoría de las rondas',
    notes: ['Por ejemplo, en una partida de 3 rondas, debes haber usurpado a un líder en 2 de las 3 rondas.'],
  },
  Angel: {
    name: 'Ángel',
    description: 'Debe decir siempre la verdad verbalmente.',
    winCondition: STANDARD_TEAM,
    powers: [{ name: 'HONEST', description: 'Comienzas con la condición «honesto». Los jugadores con la condición «honesto» deben decir siempre la verdad verbalmente (a menos que estés «seducido», «hipnotizado» o tengas cualquier otra condición que influya en tu capacidad de decir la verdad). Esto significa que puedes mentir siempre que no sea verbalmente.' }],
    notes: ['Si un jugador con la condición «honesto» adquiere la condición «mentiroso», las dos condiciones se cancelan entre sí, dejando al jugador sin ninguna condición.'],
  },
  Apprentice: {
    name: 'Aprendiz',
    description: 'Respaldo del Alquimista si muere o es enterrado.',
    winCondition: STANDARD_TEAM,
    powers: [{ name: 'APPRENTICE', description: 'Eres el personaje de respaldo del Alquimista. Si la carta del Alquimista es enterrada o el Alquimista recibe la condición «muerto» antes del final del juego, debes cumplir todas las responsabilidades asociadas al Alquimista (compartir carta con el Rey).' }],
    notes: [],
    requiresGroup: requiresGroup['Backup: Alchemist'],
  },
  Assassin: {
    name: 'Asesino',
    description: 'Termina con el Presidente (sin Bombardero) para ganar como Equipo Amarillo y vencer al Azul.',
    winCondition: 'Si el Presidente no adquiere la condición «Muerto» y estás en la misma sala que el Presidente, el Equipo Amarillo gana, pero el Equipo Azul pierde. Si el Presidente, el Bombardero y tú terminan en la misma sala, entonces el Equipo Amarillo, el Equipo Azul e incluso el Equipo Rojo pierden',
    powers: [{ name: 'YELLOW', description: 'Estás en el Equipo Amarillo. Si el Presidente no adquiere la condición «Muerto» y estás en la misma sala que el Presidente, el Equipo Amarillo gana, pero el Equipo Azul pierde. Si el Presidente, el Bombardero y tú terminan en la misma sala, entonces el Equipo Amarillo, el Equipo Azul e incluso el Equipo Rojo pierden. También tienes el poder AMARILLO. Cualquier jugador que comparta carta o color contigo se une al Equipo Amarillo. Los nuevos miembros del Equipo Amarillo mantienen sus poderes y condiciones, pero su lealtad (y por tanto su condición de victoria) cambia al Equipo Amarillo. Sin embargo, el poder AMARILLO no funciona en personajes primarios (p. ej., Presidente, Bombardero, Puño Rojo, etc.).' }],
    notes: [
      'Funciona bien para jugadores con experiencia.',
      'Añade una capa de complejidad. A menudo puede llevar a que no haya ganadores.',
    ],
  },
  Beholder: {
    name: 'Observador',
    description: 'Gana al ver cualquier parte del rostro de la carta de un jugador.',
    winCondition: 'Si ves cualquier parte del rostro de la carta de un jugador (color o personaje), declara en voz alta y de inmediato lo que viste para ganar la partida',
    powers: [{ name: 'BEHOLDER', description: 'Antes de que comience el juego, pero después de repartir las cartas de personaje, debes anunciar públicamente «¡Soy el Observador!» y mantener tu carta revelada públicamente de forma permanente durante el resto del juego. Haz todo lo posible para asegurarte de que no haya conversaciones privadas. Puedes ser lo más intrusivo posible, incluyendo mirar por encima del hombro de los jugadores sus cartas e incluso tirarte al suelo para ver la parte inferior de las cartas que se pasan entre jugadores. No puedes manipular físicamente a otros jugadores, ni ellos deben intentar manipularte físicamente. Si juegas con la variante Promesa de Privacidad, ignoras la regla.' }],
    notes: [
      'Tienes la condición «inmune». Los jugadores con la condición «inmune» son inmunes a todos los poderes y condiciones sin excepción. El Observador puede caminar libremente entre las dos salas. El Observador nunca puede participar en ninguna votación (p. ej., votar para nominar o usurpar a un líder). El Observador nunca puede ser elegido por los líderes para ser transferido a otra sala (ni por otros personajes con esos poderes), ya que nunca se cuenta como parte de la población de una sala.',
      'Si ganas, todos los demás jugadores pierden.',
      'No se permiten adivinanzas. Si declaras públicamente un color o carta que viste y estás equivocado, pierdes al instante.',
      'Como el Observador nunca se considera parte de la población de una sala, no cuenta para el número de jugadores del juego y no cuenta a favor ni en contra del objetivo de victoria del Equipo Zombi. Esto significa que si tienes 18 jugadores incluyendo al Observador, deberías jugar una partida de 15 jugadores.',
      'Buena suerte jugando con personajes que tienen poder de revelación pública (como el Embajador)',
    ],
  },
  'The Black': {
    name: 'El Negro',
    description: 'Gana si alguien comparte color contigo.',
    winCondition: 'Si cualquier jugador comparte color contigo, ganas y todos los demás jugadores pierden',
    powers: [{ name: 'THE BLACK', description: 'Tu carta de personaje es completamente negra. Si cualquier jugador comparte color contigo, ganas y todos los demás jugadores pierden.' }],
    notes: ['Sin sentido con menos de 11 jugadores.'],
  },
  Blind: {
    name: 'Ciego',
    description: 'Debe mantener los ojos cerrados durante toda la partida.',
    winCondition: STANDARD_TEAM,
    powers: [{ name: 'BLIND', description: 'Comienzas con la condición «ciego». Los jugadores con la condición «ciego» deben hacer todo lo posible por no abrir los ojos durante la partida.' }],
    notes: [
      'Los jugadores ciegos aún pueden adquirir condiciones y tener poderes usados sobre ellos, pero no deben ser engañados al respecto.',
      'Requiere cierta coordinación. Los diseñadores no se responsabilizan de lesiones durante el juego. Usar Ciego en combinación con el personaje Momia está fuertemente desaconsejado.',
    ],
  },
  'Blue Drone': {
    name: 'Dron Azul',
    description: 'El Azul gana si estás en la misma sala que el Puño Rojo.',
    winCondition: 'El Equipo Azul gana si estás en la misma sala que el Puño Rojo al final del juego',
    notes: [
      'Debe jugarse con Puño Rojo. Se recomienda Juez o Informante (no ambos).',
      'Las cartas del Dron Azul y el Puño Rojo añaden condiciones de victoria adicionales al juego, aumentando la complejidad y alterando mucho las condiciones de victoria estándar.',
      'Puede causar un resultado confuso al final. Este rol puede ser demasiado complejo para jugadores nuevos.',
    ],
    requiresGroup: requiresGroup['Drone/Fist Pair'],
  },
  'Blue Firecracker': {
    name: 'Petardo Azul',
    description: 'Respaldo del Dron Azul si muere o es enterrado.',
    winCondition: STANDARD_TEAM,
    powers: [{ name: 'BLUE FIRECRACKER', description: 'Eres un personaje secundario. Eres el personaje de respaldo del Dron Azul. Si la carta del Dron Azul es enterrada o el Dron Azul recibe la condición «muerto» antes del final del juego, debes cumplir todas las responsabilidades asociadas al Dron Azul.' }],
    notes: ['Si entierras una carta, considera no enterrar a los Informantes o al Juez.'],
    requiresGroup: requiresGroup['Backup: Blue Drone'],
  },
  'Blue Team': {
    name: 'Equipo Azul',
    description: 'Gana si el Presidente no adquiere la condición muerto.',
    winCondition: 'Si el Presidente no adquiere la condición «Muerto», ganas',
    notes: [
      'Cualquier carta de personaje que tenga el icono de estrella blanca se considera del Equipo Azul.',
      'Funciona bien para jugadores primerizos.',
      'Puede aburrir a jugadores con experiencia.',
    ],
  },
  Bomber: {
    name: 'Bombardero',
    description: 'Todos en tu sala adquieren la condición muerto al final del juego.',
    winCondition: 'El Equipo Rojo gana si el Presidente adquiere la condición «muerto»',
    powers: [{ name: 'BOMB', description: 'Todos en la misma sala que tú al final del juego adquieren la condición «muerto». El Equipo Rojo gana si el Presidente adquiere la condición «muerto».' }],
    notes: [
      'Es posible que el Bombardero reciba la condición «muerto» antes del final del juego. Si esto ocurre, el Bombardero no detona y no proporciona la condición «muerto» a todos en la misma sala al final del juego.',
      'Superviviente, Víctima, Moby y Ahab son tus aliados grises naturales.',
    ],
  },
};

const part2 = require('./generate-es-character-catalog-part2.cjs');
const part3 = require('./generate-es-character-catalog-part3.cjs');
Object.assign(t, part2, part3);

const es = {};
for (const key of Object.keys(en)) {
  const src = en[key];
  const tr = t[key];
  if (!tr) {
    console.error('Missing translation for:', key);
    process.exit(1);
  }
  es[key] = {
    name: tr.name,
    description: tr.description ?? '',
    winCondition: tr.winCondition,
    powers: (src.powers || []).map((p, i) => ({
      name: tr.powers?.[i]?.name ?? p.name,
      type: p.type,
      description: tr.powers?.[i]?.description ?? p.description,
    })),
    notes: tr.notes ?? [],
  };
  if (src.requiresGroup) {
    es[key].requiresGroup = tr.requiresGroup ?? requiresGroup[src.requiresGroup] ?? src.requiresGroup;
  }
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(es, null, 2) + '\n');
console.log('Wrote', Object.keys(es).length, 'characters to', outPath);
