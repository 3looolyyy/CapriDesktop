/**
 * Capri's welcome speech, said once when the first-run setup finishes.
 * Tags are acted out by Fish Audio; Edge-TTS (the default voice) skips them and turns
 * [laugh]/[giggles] into a written laugh.
 */

export function welcomeSpeech(lang: string): string {
  if (lang === 'es') {
    return [
      '[excited] ¡Hola, {name}! ¡Por fin nos conocemos!',
      '[happy] Soy Capri, Project Capricorn, y desde ahora vivo en tu compu.',
      '[warmly] De acá en adelante vos y yo vamos a ser mejores amigos: te acompaño cuando juegues, cuando programes y cuando te aburras.',
      '[playful] Y te aviso desde ya: vamos a hacer muchísimo caos juntos. [giggles]',
      '[cheerful] Para hablarme, apretá la flecha para abajo o hacé Ctrl + clic sobre mí. ¡A romperla, choomba!'
    ].join(' ')
  }
  return [
    "[excited] Hey, {name}! We finally meet!",
    "[happy] I'm Capri, Project Capricorn, and I live in your PC now.",
    "[warmly] From now on you're my best friend: I'll be there when you game, when you code and when you're bored.",
    "[playful] And fair warning: we're gonna cause SO much chaos together. [giggles]",
    "[cheerful] To talk to me, press the down arrow or Ctrl + click on me. Let's go, choomba!"
  ].join(' ')
}
