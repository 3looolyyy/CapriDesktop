/**
 * League of Legends Champion Select Reactions
 *
 * Provides unique, in-character commentary when champions are locked in during Champ Select.
 */

export interface ChampionComment {
  es: string
  en: string
}

export const CHAMPION_PICK_REACTIONS: Record<string, ChampionComment> = {
  fizz: {
    es: '¡Fizz! El terror del carril central. A esquivar habilidades con el juguetón y meter el tiburón, choomba.',
    en: 'Fizz! Mid lane nightmare. Dodge everything with Playful/Trickster and feed them the shark, {name}.'
  },
  jinx: {
    es: '¡Jinx! Caos, explosiones y minigun. Me gusta tu estilo, choomba, hagamos volar la grieta en pedazos.',
    en: 'Jinx! Pure chaos, explosions and Pow-Pow. Love your style, {name}, let us blow up the Rift.'
  },
  yasuo: {
    es: 'Yasuo... Espero que ese 0/10 powerspike no se active hoy, {name}. A meter esos tornados limpios.',
    en: 'Yasuo... Hope the 0/10 powerspike stays inactive today, {name}. Land those clean tornadoes.'
  },
  yone: {
    es: 'Yone en la grieta. Desatemos ese daño híbrido y partamos la teamfight en dos, choomba.',
    en: 'Yone on the Rift. Let us unleash that hybrid damage and split their teamfight in half, choomba.'
  },
  zed: {
    es: 'Zed... A las sombras les gusta tu estilo. Que no pestañeen sus carries porque desaparecen.',
    en: 'Zed... Shadows suit you, {name}. Their carries better not blink or they disappear.'
  },
  ahri: {
    es: '¡Ahri! Encanto, movilidad y orbes. A cazar carries desprevenidos por los arbustos, choomba.',
    en: 'Ahri! Charm, mobility and spirit orbs. Time to ambush squishies from the brush, {name}.'
  },
  warwick: {
    es: 'Warwick... Van a oler la sangre a kilómetros de distancia. No dejes escapar a ninguno, choomba.',
    en: 'Warwick... They will smell the blood from across the map. Hunt them down without mercy, {name}.'
  },
  teemo: {
    es: 'Teemo... Sos un peligro para la sociedad, choomba. Llenemos la grieta de hongos venenosos.',
    en: 'Teemo... You are a menace to society, choomba! Let us paint the Rift with toxic mushrooms.'
  },
  jhin: {
    es: '¡Jhin! Cuatro disparos, una obra de arte. La perfección es el único estándar aceptable, {name}.',
    en: 'Jhin! Four shots, a pure masterpiece. Perfection is our only standard, {name}.'
  },
  ekko: {
    es: 'Ekko, el que quiebra el tiempo. Si te mandás una macana, siempre podés retroceder el reloj, choomba.',
    en: 'Ekko, shattering time. If things get sketchy, rewind the clock and wipe them out, {name}.'
  },
  leesin: {
    es: 'Lee Sin... Mostrales cómo se hace un Insec legendario de verdad, choomba.',
    en: 'Lee Sin... Show them how a real legendary Insec kick is done, {name}.'
  },
  'lee sin': {
    es: 'Lee Sin... Mostrales cómo se hace un Insec legendario de verdad, choomba.',
    en: 'Lee Sin... Show them how a real legendary Insec kick is done, {name}.'
  },
  viego: {
    es: 'Viego, el Rey Arruinado. Poseé a todos los rivales caídos y rompeles el nexo en la cara.',
    en: 'Viego, the Ruined King. Possess their fallen carries and smash their Nexus to dust, choomba.'
  },
  samira: {
    es: '¡Samira! Rango S en camino. Saltá al medio de los cinco y desatá el torbellino de plomo, choomba.',
    en: 'Samira! S-rank incoming. Jump into all five of them and spin the lead hurricane, {name}.'
  },
  kaisa: {
    es: '¡Kai\'Sa! Sobreviviente del Vacío. Adaptación total y ráfagas de plasma, choomba.',
    en: 'Kai\'Sa! Void survivor. Total adaptation and plasma bursts, {name}.'
  },
  "kai'sa": {
    es: '¡Kai\'Sa! Sobreviviente del Vacío. Adaptación total y ráfagas de plasma, choomba.',
    en: 'Kai\'Sa! Void survivor. Total adaptation and plasma bursts, {name}.'
  },
  katarina: {
    es: 'Katarina... Resets de habilidades y dagas volando. Hacé pedazos esa teamfight, choomba.',
    en: 'Katarina... Resets and flying daggers. Shred through that teamfight like butter, {name}.'
  },
  riven: {
    es: 'Riven... A encadenar las cancelaciones de animación perfecto, {name}. Mostrales tus mecánicas.',
    en: 'Riven... Chain those animation cancels perfectly, {name}. Show off your mechanics.'
  },
  thresh: {
    es: 'Thresh... Sentencias de muerte precisas. Si tirás la linterna, rezá para que la agarren, choomba.',
    en: 'Thresh... Death sentences on point. If you drop the lantern, pray they actually click it, choomba.'
  },
  lux: {
    es: '¡Lux! A meter esa Chispa Final a través de todo el mapa. Que sientan el destello del láser.',
    en: 'Lux! Fire that Final Spark right through the map. Let them feel the laser burn, {name}.'
  },
  caitlyn: {
    es: 'Caitlyn, rango kilométrico y trampas. Mantenelos a distancia y cazalos con As en la Manga.',
    en: 'Caitlyn, sniper range and cupcakes. Keep them at bay and snipe them down with Ace in the Hole.'
  },
  aatrox: {
    es: 'Aatrox, el Destructor de Mundos. Activá Destructor y revoleá esa espada gigante, choomba.',
    en: 'Aatrox, the World Ender. Pop World Ender and cleave them to pieces, {name}.'
  },
  vladimir: {
    es: 'Vladimir... Charco de sangre y robo masivo de vida en late game. A escalar tranquilos, {name}.',
    en: 'Vladimir... Blood pool and massive late game sustain. Scale up and delete them, {name}.'
  },
  akali: {
    es: 'Akali... Entrás en el humo, ejecutás y salís limpia. Que no sepan ni de dónde vino el golpe.',
    en: 'Akali... Step into the shroud, assassinate, and vanish. Leave them guessing where it came from.'
  },
  vayne: {
    es: 'Vayne... Daño verdadero en tres impactos. A kitear con paciencia que en late game sos un monstruo.',
    en: 'Vayne... Silver bolts true damage. Kite carefully, because late game you become a monster, {name}.'
  },
  darius: {
    es: 'Darius... Cinco cargas de hemorragia y guillotinazo en la frente. No les tengas piedad, choomba.',
    en: 'Darius... Five stacks of Hemorrhage and guillotine their heads. No mercy, choomba.'
  },
  garen: {
    es: 'Garen... Por Demacia y a girar sin parar con la espada. Sencillo, efectivo y destructivo.',
    en: 'Garen... Spin to win for Demacia! Simple, brutally effective and tanky, {name}.'
  },
  blitzcrank: {
    es: '¡Blitzcrank! Una mano cohete y se terminó la partida para su tirador. A conectar esos ganchos.',
    en: 'Blitzcrank! One rocket grab and their carry is deleted. Land those hooks, {name}!'
  },
  mordekaiser: {
    es: 'Mordekaiser... Mandá a su carry directo al Reino de las Sombras y aplastalo con la maza, choomba.',
    en: 'Mordekaiser... Drag their carry to the Death Realm and smash them with your mace, {name}.'
  },
  ashe: {
    es: 'Ashe... Flecha de cristal cruzando el mapa entero. Frenalos en seco con ese hielo.',
    en: 'Ashe... Crystal arrow flying across the entire map. Freeze them in their tracks, {name}.'
  }
}

/**
 * Normalizes champion name for map lookup (lowercased, removes apostrophes and spaces)
 */
export function normalizeChampionKey(name: string): string {
  return name.toLowerCase().replace(/['\s._-]/g, '')
}

/**
 * Returns a personalized champion pick quote, or a high-energy fallback.
 */
export function getChampionPickComment(championName: string, lang: 'es' | 'en' = 'es'): string {
  const normKey = normalizeChampionKey(championName)
  const comment = CHAMPION_PICK_REACTIONS[normKey] || CHAMPION_PICK_REACTIONS[championName.toLowerCase()]

  if (comment) {
    return lang === 'es' ? comment.es : comment.en
  }

  return lang === 'es'
    ? `¡Excelente elección con ${championName}, choomba! Vamos a stompear esa grieta con furia cibernética.`
    : `Solid pick with ${championName}, {name}! Let's dominate the Rift and claim that victory!`
}
