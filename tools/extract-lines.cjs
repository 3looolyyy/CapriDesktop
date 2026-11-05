// Finds Capri's fixed English lines in the code and writes src/shared/lines/en.json, the source that
// every other language in that folder translates line by line. Run it after adding fixed lines:
//   node tools/extract-lines.cjs        -> updates en.json, keeping known lines in their position
//   node tools/extract-lines.cjs --list -> prints the lines with no Spanish version in the code
const ts = require('typescript')
const fs = require('fs')
const path = require('path')

const roots = ['src/main', 'src/renderer/src/companion', 'src/renderer/src/deck/AgentChat.tsx']
// The donations script is for a video and stays as written
const skipFile = /donation-script|look-tags|\/shared\/lines\//
const LANG = /\b(isEs|isSpanish|es)\b|===? *'es'|!== *'es'/
const SPEAK = /^(setCompanionSpeech|emitAssistant|setSpeech|speak|sayAfterIntro|triggerCapriReaction|say|speakWithCapriVoice)$/

// Not dialogue: instructions for the model, internal notes, debug tools and bits of Spanish
const NOT_A_LINE = [
  /^Simulating /,
  /^Mock game simulation/,
  /^English$/,
  /^casual English with/,
  /^(checking|watching|drawing)$/,
  /^OBJECTS & DRAWINGS/,
  /asks: "\{0\}"\. Respond in character/,
  /^Tell \{name\} what you see/,
  /^Technique learned directly/,
  /^(Scanned screen content|Visual content detected|Updated content inside frame)$/,
  /^\/\/ Created by Capri/,
  /^Could not capture region/,
  /^\[(CANCEL|SEND)\]$/
]
const SPANISH = /[áéíóúñ¿¡]|\b(Tus macros|Modo Scanner|Auto-aceptar|Fallo al|Uff, hubo|No pude|No puedo|Audio silenciado|Listo, dejo)\b/

const files = []
const walk = (p) => {
  if (fs.statSync(p).isDirectory()) fs.readdirSync(p).forEach((f) => walk(path.join(p, f)))
  else if (/\.tsx?$/.test(p) && !skipFile.test(p.replace(/\\/g, '/'))) files.push(p)
}
roots.forEach(walk)

const found = new Map()
const add = (text, hasSpanish) => {
  const t = text.replace(/\s+/g, ' ').trim()
  if (t.length < 4 || !/[a-zA-Z]{2}/.test(t) || t.length > 420) return
  if (SPANISH.test(t) || NOT_A_LINE.some((re) => re.test(t))) return
  found.set(t, (found.get(t) ?? false) || hasSpanish)
}
const literal = (n) => {
  if (ts.isStringLiteralLike(n)) return n.text
  if (ts.isTemplateExpression(n)) {
    let s = n.head.text
    n.templateSpans.forEach((span, i) => (s += `{${i}}` + span.literal.text))
    return s
  }
  return null
}
const collect = (n, hasSpanish) => {
  const l = literal(n)
  if (l !== null) return add(l, hasSpanish)
  if (ts.isArrayLiteralExpression(n)) n.elements.forEach((e) => collect(e, hasSpanish))
  else if (ts.isParenthesizedExpression(n)) collect(n.expression, hasSpanish)
  else if (ts.isConditionalExpression(n)) {
    collect(n.whenTrue, hasSpanish)
    collect(n.whenFalse, hasSpanish)
  } else if (ts.isBinaryExpression(n)) {
    collect(n.left, hasSpanish)
    collect(n.right, hasSpanish)
  }
}
const inBlock = (n) => {
  const l = literal(n)
  if (l !== null && l.includes(' ')) add(l, true)
  ts.forEachChild(n, inBlock)
}

for (const f of files) {
  const sf = ts.createSourceFile(f, fs.readFileSync(f, 'utf8'), ts.ScriptTarget.Latest, true, f.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const visit = (n) => {
    if (ts.isConditionalExpression(n) && LANG.test(n.condition.getText(sf))) {
      const c = n.condition.getText(sf)
      collect(/!== *'es'|^!/.test(c) ? n.whenTrue : n.whenFalse, true)
    }
    if (ts.isIfStatement(n) && LANG.test(n.expression.getText(sf)) && n.expression.getText(sf).length < 60) {
      if (n.elseStatement) inBlock(n.elseStatement)
    }
    if (ts.isVariableDeclaration(n) && n.initializer && /(_EN|En)$/.test(n.name.getText(sf))) collect(n.initializer, true)
    if (ts.isPropertyAssignment(n) && n.name.getText(sf) === 'en') collect(n.initializer, true)
    if (ts.isCallExpression(n) && n.arguments[0] && SPEAK.test(n.expression.getText(sf).split('.').pop())) {
      const inTernary = ts.isConditionalExpression(n.arguments[0])
      if (!inTernary) collect(n.arguments[0], false)
    }
    ts.forEachChild(n, visit)
  }
  visit(sf)
}

const output = 'src/shared/lines/en.json'
const known = fs.existsSync(output) ? JSON.parse(fs.readFileSync(output, 'utf8')) : []
const fresh = [...found.keys()].filter((t) => !known.includes(t))
const lines = [...known, ...fresh]

if (process.argv.includes('--list')) {
  console.log(JSON.stringify([...found.entries()].filter(([, s]) => !s).map(([t]) => t), null, 1))
} else {
  fs.mkdirSync(path.dirname(output), { recursive: true })
  fs.writeFileSync(output, JSON.stringify(lines, null, 1) + '\n')
  console.log(`${lines.length} lines, ${fresh.length} new`)
}
