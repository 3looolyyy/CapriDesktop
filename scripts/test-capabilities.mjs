// The capability catalog can't drift from what Capri understands: every example phrase must trigger
// its command, every text exists in her ten languages, and help questions find the right entry.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { test } from 'node:test'
import ts from 'typescript'

function load(file, dependencies = {}) {
  const source = readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
  const exports = {}
  runInNewContext(outputText, { exports, require: (name) => dependencies[name] || {}, console: { log() {}, warn() {} } })
  return exports
}

const catalog = load('shared/capabilities.ts')
const spoken = load('main/agents/spoken-commands.ts')
const translations = load('main/agents/command-translations.ts')
const help = load('main/agents/help-requests.ts', { '../../shared/capabilities': catalog })
const { CAPABILITIES, HELP_LANGS, CATEGORY_TITLES, capabilityHowTo } = catalog

const DETECTORS = {
  hold: spoken.isHoldStillRequest,
  move: spoken.isMoveAgainRequest,
  watch: spoken.isWatchScreenRequest,
  stopWatch: spoken.isStopWatchScreenRequest,
  apps: spoken.isKnownAppsRequest,
  version: spoken.isVersionRequest
}
const commandPattern = (command) => new RegExp(`^${command.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace('{x}', '.+').replace('{w}', '\\S+')}$`, 'i')
const matchesCommand = (cap, english) => (cap.commands || []).some((c) => commandPattern(c).test(english.trim()))
const HOTKEYS = { talk: 'Down', listen: 'Right', chat: 'Left', gaming: 'Control+Alt+M', away: 'Control+Alt+H' }

test('every capability is written in all ten languages, with nothing left unfilled', () => {
  const ids = new Set()
  for (const cap of CAPABILITIES) {
    assert.ok(!ids.has(cap.id), `duplicate id ${cap.id}`)
    ids.add(cap.id)
    assert.ok(CATEGORY_TITLES[cap.category], `${cap.id}: unknown category`)
    assert.ok(cap.keywords.length + (cap.generic?.length ?? 0) > 0, `${cap.id}: no keywords`)
    for (const lang of HELP_LANGS) {
      const [title, how] = cap.text[lang] || []
      assert.ok(title && how, `${cap.id}: missing ${lang} text`)
      const filled = capabilityHowTo(cap, lang, HOTKEYS)
      assert.doesNotMatch(filled, /\{[a-z:]+\}/i, `${cap.id} (${lang}) left a placeholder: ${filled}`)
      assert.doesNotMatch(filled, /""|「」|“”/, `${cap.id} (${lang}) quotes an empty example`)
    }
  }
})

test('every example phrase really triggers its command', () => {
  const problems = []
  for (const cap of CAPABILITIES) {
    for (const [lang, phrases] of Object.entries(cap.say)) {
      for (const phrase of phrases) {
        const where = `${cap.id} (${lang}) "${phrase}"`
        if (cap.check) {
          // Only the first example belongs to the detector; a second one is a command of its own
          if (phrase === phrases[0] && !DETECTORS[cap.check](phrase)) problems.push(`${where} is not recognized`)
          continue
        }
        if (lang === 'en') {
          if (cap.commands && !matchesCommand(cap, phrase)) problems.push(`${where} isn't one of ${cap.commands}`)
        } else if (translations.COMMAND_LANGS.includes(lang) && cap.commands) {
          const english = translations.commandInEnglish(phrase)
          if (!english || !matchesCommand(cap, english.text)) problems.push(`${where} became ${JSON.stringify(english?.text)}, not ${cap.commands}`)
        }
      }
    }
  }
  assert.deepEqual(problems, [])
})

const QUESTIONS = {
  'hold-still': ['how do I make you stay still?', '¿cómo hago para que te quedes quieta?', 'como eu faço você ficar parada?', 'comment je fais pour que tu ne bouges pas ?', 'wie bringe ich dich dazu stillzuhalten?', 'come faccio a farti stare ferma?', 'как сделать чтобы ты не двигалась?', 'どうやってじっとさせるの？', '어떻게 하면 가만히 있어?', '怎么让你别动？'],
  'gaming-mode': ['how do I turn on gaming mode?', '¿cómo activo el modo gaming?', 'como ativo o modo jogo?', 'comment activer le mode gaming ?', 'wie aktiviere ich den spielmodus?', 'come attivo la modalità gioco?', 'как включить игровой режим?', 'ゲームモードはどうやって使うの？', '게임 모드 어떻게 켜?', '怎么打开游戏模式？'],
  'watch-screen': ['how do I make you watch my screen?', '¿cómo hago para que mires mi pantalla?', 'como faço você olhar minha tela?', 'comment faire pour que tu regardes mon écran ?', 'wie kann ich dich meinen bildschirm ansehen lassen?', 'come faccio a farti guardare il mio schermo?', 'как сделать чтобы ты смотрела мой экран?', 'どうやって画面を見てもらうの？', '어떻게 내 화면을 보게 해?', '怎么让你看我的屏幕？'],
  'music': ['how do I play music?', '¿cómo pongo música?'],
  'bug-report': ['how do I report a bug?', '¿cómo hago un reporte de bug?'],
  'away': ['how do I hide you?', '¿cómo te escondo?']
}

test('help questions find the right capability in every language', () => {
  const problems = []
  for (const [id, questions] of Object.entries(QUESTIONS)) {
    for (const q of questions) {
      const req = help.parseHelpRequest(q)
      if (req?.kind !== 'how') problems.push(`"${q}" was not read as a help question`)
      else if (req.capability.id !== id) problems.push(`"${q}" went to ${req.capability.id}, not ${id}`)
    }
  }
  assert.deepEqual(problems, [])
})

test('"what can you do?" gives the tour in every language', () => {
  for (const q of ['what can you do?', 'Capri, ¿qué podés hacer?', 'o que você pode fazer?', "qu'est-ce que tu peux faire ?", 'was kannst du alles?', 'cosa sai fare?', 'что ты умеешь?', '何ができる？', '뭘 할 수 있어?', '你能做什么？', 'help']) {
    assert.equal(help.parseHelpRequest(q)?.kind, 'tour', `"${q}" didn't give the tour`)
  }
  for (const lang of HELP_LANGS) {
    const tour = help.helpAnswer({ kind: 'tour' }, lang, 'win32', HOTKEYS)
    assert.ok(tour.split('\n').length >= 8, `${lang}: tour too short`)
    assert.doesNotMatch(tour, /\{/, `${lang}: tour left a placeholder`)
  }
  // Windows-only things stay out of the tour elsewhere
  assert.doesNotMatch(help.helpAnswer({ kind: 'tour' }, 'en', 'darwin', HOTKEYS), /Draw in Paint|VALORANT/)
})

test('commands and ordinary questions are not taken for help', () => {
  for (const q of [
    'turn on gaming mode', 'quedate quieta', 'stay still', 'how do I fix this error in my code?', 'cómo se dice gato en inglés', 'how do I open a port on my router?', 'how do I stay motivated?', 'what is the weather like?', 'how do I make a pizza?', '¿cómo hago una pizza grande?',
    // Questions about other things that share a word with one of her features (the Dev Deck chat goes through here too)
    'how do I update node?', 'how do I check the python version?', 'how do I build an app?', 'how do I hide a div?', 'how do I copy to the clipboard?', 'how do I install microsoft office?',
    '这首歌怎么样？', 'как сделать больше денег', 'how do I write an excel macro?', 'how do I upload a video to youtube?', 'how do I draw a circle in css?', 'how do I change the language in python?',
    'how do I read the logs in docker?', '¿cómo actualizo windows?', 'how do I scan a document?', 'how do I make music in fl studio?', 'how do I rank up in valorant?', 'how do I search a list in python?',
    'how do I take a screenshot of my screen?', '¿cómo hago una app en react?', 'comment installer une appli ?', 'wie aktualisiere ich windows?', '怎么办？'
  ]) {
    assert.equal(help.parseHelpRequest(q), null, `"${q}" was taken for a help question`)
  }
})

test('answers use the user\'s own keys and say when something is not on this system', () => {
  const gaming = CAPABILITIES.find((c) => c.id === 'gaming-mode')
  assert.match(help.helpAnswer({ kind: 'how', capability: gaming }, 'en', 'win32', { ...HOTKEYS, gaming: 'Control+Shift+G' }), /Ctrl\+Shift\+G/)
  assert.match(help.helpAnswer({ kind: 'how', capability: gaming }, 'en', 'darwin', { ...HOTKEYS, gaming: 'Alt+Super+M' }), /Option\+Cmd\+M/)
  const draw = CAPABILITIES.find((c) => c.id === 'draw')
  assert.match(help.helpAnswer({ kind: 'how', capability: draw }, 'es', 'darwin', HOTKEYS), /todavía no funciona en este sistema/)
})

test('the model only gets the manual for questions about her', () => {
  assert.equal(help.capabilityManual('tell me a joke about cyberpunk', 'win32', HOTKEYS), null)
  assert.equal(help.capabilityManual('qué opinás de esta canción', 'win32', HOTKEYS), null)
  const manual = help.capabilityManual('can you play music on spotify for me?', 'win32', HOTKEYS)
  assert.match(manual, /CAPRI MANUAL/)
  assert.match(manual, /Play music/)
})
