/**
 * Questions about Capri herself: "what can you do?", "how do I make you stay still?", "how do I turn
 * on gaming mode?". They're answered from the capability catalog, in any of her languages, without
 * the model, so they work even when her brain doesn't load. For questions they don't catch, the
 * model gets the matching catalog entries as a short manual.
 */
import {
  CAPABILITIES,
  CATEGORY_TITLES,
  asHelpLang,
  capabilityAvailable,
  capabilityHowTo,
  type Capability,
  type CapabilityCategory,
  type HelpLang
} from '../../shared/capabilities'
import type { HotkeyAction } from '../../shared/hotkeys'

export type HelpRequest = { kind: 'tour' } | { kind: 'how'; capability: Capability }

/** Like spoken-commands: no Latin accents (Cyrillic й stays), no case, no punctuation */
function plain(text: string): string {
  return text
    .normalize('NFD')
    .replace(/([a-z])[̀-ͯ]+/gi, '$1')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[?!.,;:¡¿。！？、，「」"'’…-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const NON_ASCII = /[^\x00-\x7f]/
/** A phrase inside the text: whole words for Latin scripts, anywhere for the rest */
const has = (text: string, phrase: string): boolean => (NON_ASCII.test(phrase) ? text.includes(phrase) : ` ${text} `.includes(` ${phrase} `))
/** A keyword at the start of a word ("muev" finds "muevas") */
const hasPrefix = (text: string, word: string): boolean => (NON_ASCII.test(word) ? text.includes(word) : ` ${text}`.includes(` ${word}`))

const list = (items: string[]): string[] => items.map(plain)

/** "What can you do?" in her ten languages */
const WHAT_CAN_YOU_DO = list([
  'what can you do', 'what else can you do', 'what are you able to do', 'what can i ask you', 'what can i ask you to do', 'what are your features', 'what can you help me with', 'what commands do you know', 'what do you know how to do', 'show me what you can do',
  'que podes hacer', 'que mas podes hacer', 'que puedes hacer', 'que mas puedes hacer', 'que sabes hacer', 'que te puedo pedir', 'que cosas podes hacer', 'que cosas puedes hacer', 'que comandos tenes', 'que comandos tienes', 'que comandos conoces',
  'o que voce pode fazer', 'o que voce sabe fazer', 'o que voce faz', 'o que posso te pedir', 'quais comandos voce conhece',
  'que peux tu faire', 'qu est ce que tu peux faire', 'qu est ce que tu sais faire', 'que sais tu faire', 'quelles commandes connais tu',
  'was kannst du', 'was kannst du alles', 'was kannst du so', 'welche befehle kennst du',
  'cosa sai fare', 'cosa puoi fare', 'che cosa sai fare', 'che cosa puoi fare', 'quali comandi conosci',
  'что ты умеешь', 'что ты можешь', 'что ты умеешь делать', 'какие команды ты знаешь',
  '何ができる', '何ができるの', 'なにができる', 'どんなことができる',
  '뭘 할 수 있어', '뭐 할 수 있어', '무엇을 할 수 있어', '뭐 할 줄 알아',
  '你能做什么', '你会做什么', '你可以做什么', '你都能做什么', '你能干什么'
])
/** "Help" said on its own */
const HELP_ALONE = list(['help', 'help me', 'ayuda', 'ayudame', 'ajuda', 'aide', 'hilfe', 'aiuto', 'помощь', 'помоги', 'ヘルプ', '助けて', '도움말', '도와줘', '帮助', '帮帮我'])

/** "How do I...": a question about using something */
const HOW = list([
  'how do i', 'how can i', 'how to', 'how do you', 'how does', 'how should i', 'how do we', 'what do i say', 'what should i say', 'what do i have to say', 'is there a way to', 'how do i make you', 'how can i make you', 'what do i press',
  'como hago', 'como puedo', 'como se', 'como activo', 'como desactivo', 'como prendo', 'como apago', 'como pongo', 'como cambio', 'como te hago', 'como te', 'como funciona', 'que tengo que decir', 'que te tengo que decir', 'que digo para', 'que tecla', 'como hacer',
  'como eu', 'como faco', 'como posso', 'como ativo', 'como desativo', 'o que eu digo', 'como fazer',
  'comment je', 'comment faire', 'comment on', 'comment activer', 'comment ca marche', 'comment est ce que', 'que dois je dire',
  'wie kann ich', 'wie mache ich', 'wie bringe ich', 'wie aktiviere ich', 'wie schalte ich', 'wie funktioniert', 'was muss ich sagen',
  'come faccio', 'come posso', 'come si', 'come attivo', 'come funziona', 'cosa devo dire',
  'как мне', 'как сделать', 'как включить', 'как выключить', 'как заставить', 'как работает', 'что сказать', 'как можно',
  'どうやって', 'どうすれば', 'やり方', '方法', 'どうしたら',
  '어떻게', '방법',
  // Not 怎么 alone: 怎么样 is "what do you think of", 怎么了 "what happened", 怎么办 "what to do"
  '怎么让', '怎么打开', '怎么开', '怎么关', '怎么用', '怎么把', '怎么设置', '怎么才能', '怎么弄', '怎么做', '怎么换', '怎么切换', '怎么叫', '如何', '怎样才能', '怎样让'
])

/** The question is about her: "you", "te", "du", "你"... (generic keywords need this) */
const ABOUT_HER = list([
  'you', 'your', 'yourself', 'capri', 'she', 'her',
  'te', 'vos', 'tu', 'tus', 'ti', 'contigo',
  'voce', 'seu', 'sua',
  'toi', 'ton', 'ta', 'tes',
  'du', 'dich', 'dir', 'dein', 'deine', 'deinen',
  'tuo', 'tua',
  'ты', 'тебя', 'тебе', 'твой', 'твоя', 'твои', 'тобой', 'капри',
  'あなた', '君', 'カプリ', 'させ', 'てもらう', 'もらえ',
  '너를', '너한테', '너는', '너가', '네가', '카프리',
  '你', '她'
])
const isAboutHer = (text: string): boolean => ABOUT_HER.some((w) => has(text, w))
/** "Can you...?": a question the model answers, with the manual at hand */
const CAN_YOU = list([
  'can you', 'are you able', 'do you know how', 'could you', 'is it possible', 'do you support',
  'podes', 'puedes', 'sabes', 'se puede', 'voce pode', 'voce consegue', 'peux tu', 'sais tu', 'kannst du', 'puoi', 'sai', 'можешь', 'умеешь', 'できる', '할 수 있', '能不能', '会不会', '你能', '你会'
])

function score(text: string, cap: Capability, aboutHer: boolean): number {
  let total = 0
  for (const keyword of aboutHer ? [...cap.keywords, ...(cap.generic ?? [])] : cap.keywords) {
    const k = plain(keyword)
    if (k && hasPrefix(text, k)) total += k.length
  }
  return total
}

/** The catalog entries a question is about, best first */
export function matchCapabilities(text: string, limit = 3): Capability[] {
  const t = plain(text)
  const aboutHer = isAboutHer(t)
  return CAPABILITIES.map((cap) => ({ cap, s: score(t, cap, aboutHer) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.cap)
}

/** A question about what she can do or how to use something of hers, or null */
export function parseHelpRequest(text: string): HelpRequest | null {
  const t = plain(text).replace(/^(?:hey |hola |oye |che )?capri /, '').replace(/ capri$/, '')
  if (!t || t.length > 160) return null
  if (HELP_ALONE.includes(t) || WHAT_CAN_YOU_DO.some((p) => has(t, p))) return { kind: 'tour' }
  if (!HOW.some((p) => has(t, p))) return null
  // Her name counts as being about her, so it's matched on the text that still has it
  const [best] = matchCapabilities(isAboutHer(plain(text)) && !isAboutHer(t) ? `${t} capri` : t, 1)
  return best ? { kind: 'how', capability: best } : null
}

const TOUR_INTRO: Record<HelpLang, string> = {
  en: "[excited] Here's what I can do, choomba:",
  es: '[excited] Esto es todo lo que sé hacer, choomba:',
  pt: '[excited] Olha tudo o que eu sei fazer, choomba:',
  fr: '[excited] Voilà tout ce que je sais faire, choomba :',
  de: '[excited] Das kann ich alles, Choomba:',
  it: '[excited] Ecco tutto quello che so fare, choomba:',
  ru: '[excited] Вот что я умею, choomba:',
  ja: '[excited] 私ができることはこれだよ、choomba：',
  ko: '[excited] 내가 할 수 있는 건 이거야, choomba:',
  zh: '[excited] 这些都是我会做的，choomba：'
}

const TOUR_OUTRO: Record<HelpLang, string> = {
  en: '[playful] Ask me "how do I..." about any of them, or open Settings > Help to see them all with examples.',
  es: '[playful] Preguntame "¿cómo hago...?" sobre cualquiera, o abrí Configuración > Ayuda para verlas todas con ejemplos.',
  pt: '[playful] Me pergunte "como eu faço...?" sobre qualquer uma, ou abra Configurações > Ajuda para ver todas com exemplos.',
  fr: '[playful] Demande-moi "comment je fais...?" pour n\'importe laquelle, ou ouvre Paramètres > Aide pour toutes les voir avec des exemples.',
  de: '[playful] Frag mich "wie mache ich...?" zu irgendwas davon, oder öffne Einstellungen > Hilfe, um alles mit Beispielen zu sehen.',
  it: '[playful] Chiedimi "come faccio...?" su qualsiasi cosa, o apri Impostazioni > Aiuto per vederle tutte con esempi.',
  ru: '[playful] Спроси меня «как мне...?» про что угодно или открой Настройки > Помощь, чтобы увидеть всё с примерами.',
  ja: '[playful] どれでも「どうやって…？」って聞いてね。設定 > ヘルプを開けば、例つきで全部見られるよ。',
  ko: '[playful] 아무거나 "어떻게 해?"라고 물어봐. 설정 > 도움말을 열면 예시와 함께 다 볼 수 있어.',
  zh: '[playful] 任何一项都可以问我“怎么……？”，或者打开设置 > 帮助，看全部功能和例子。'
}

const NOT_ON_THIS_SYSTEM: Record<HelpLang, string> = {
  en: "[sad] Heads up: that one doesn't work on this system yet.",
  es: '[sad] Ojo: eso todavía no funciona en este sistema.',
  pt: '[sad] Atenção: isso ainda não funciona neste sistema.',
  fr: '[sad] Attention : ça ne marche pas encore sur ce système.',
  de: '[sad] Achtung: Das funktioniert auf diesem System noch nicht.',
  it: '[sad] Attenzione: questo non funziona ancora su questo sistema.',
  ru: '[sad] Учти: на этой системе это пока не работает.',
  ja: '[sad] ただ、それはこのシステムではまだ使えないんだ。',
  ko: '[sad] 참고로 그건 이 시스템에서는 아직 안 돼.',
  zh: '[sad] 提醒一下：这个在当前系统上还不能用。'
}

const CATEGORY_ORDER: CapabilityCategory[] = ['move', 'voice', 'screen', 'gaming', 'party', 'music', 'pc', 'memory', 'create', 'app']

/** Her answer to a help request, in her words and the user's language */
export function helpAnswer(request: HelpRequest, language: string, platform: string, hotkeys: Partial<Record<HotkeyAction, string>>): string {
  const lang = asHelpLang(language)
  if (request.kind === 'how') {
    const cap = request.capability
    const how = capabilityHowTo(cap, lang, hotkeys, platform)
    return capabilityAvailable(cap, platform) ? `[cheerful] ${how}` : `[cheerful] ${how} ${NOT_ON_THIS_SYSTEM[lang]}`
  }
  const separator = lang === 'ja' || lang === 'zh' ? '、' : ', '
  const colon = lang === 'ja' || lang === 'zh' ? '：' : lang === 'fr' ? ' : ' : ': '
  const lines = CATEGORY_ORDER.map((category) => {
    const titles = CAPABILITIES.filter((c) => c.category === category && capabilityAvailable(c, platform)).map((c) => c.text[lang][0])
    return titles.length ? `• ${CATEGORY_TITLES[category][lang]}${colon}${titles.join(separator)}` : ''
  }).filter(Boolean)
  return [TOUR_INTRO[lang], ...lines, TOUR_OUTRO[lang]].join('\n')
}

/**
 * For the model: the catalog entries a question about her seems to be about, as a short manual in
 * English (she answers in the user's language). Null when the message isn't about her features.
 */
export function capabilityManual(text: string, platform: string, hotkeys: Partial<Record<HotkeyAction, string>>): string | null {
  const t = plain(text)
  if (!t || t.length > 300) return null
  const asksAboutHer = HOW.some((p) => has(t, p)) || CAN_YOU.some((p) => has(t, p)) || WHAT_CAN_YOU_DO.some((p) => has(t, p))
  if (!asksAboutHer) return null
  const caps = matchCapabilities(t, 2)
  if (!caps.length) return null
  const entries = caps.map((cap) => {
    const where = capabilityAvailable(cap, platform) ? '' : ' (NOT available on this system)'
    return `- ${cap.text.en[0]}${where}: ${capabilityHowTo(cap, 'en', hotkeys, platform)}`
  })
  return `CAPRI MANUAL (facts about your own features; use them if the user is asking how to use you, keep the commands exactly as written, and never invent features that aren't here):\n${entries.join('\n')}`
}
