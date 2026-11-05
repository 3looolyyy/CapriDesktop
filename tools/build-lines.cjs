// Turns numbered translations ("123<TAB>text", one per line) into src/shared/lines/<lang>.json and
// checks them against en.json: same variables, every emotion tag still in English, nothing skipped.
//   node tools/build-lines.cjs <lang> <folder with <lang>*.txt>
const fs = require('fs')
const path = require('path')

const [lang, folder] = process.argv.slice(2)
const source = JSON.parse(fs.readFileSync('src/shared/lines/en.json', 'utf8'))
const output = `src/shared/lines/${lang}.json`
const lines = fs.existsSync(output) ? JSON.parse(fs.readFileSync(output, 'utf8')) : []
while (lines.length < source.length) lines.push(null)

const SLOT = /\{(\d+|[a-zA-Z]+)\}/g
const TAG = /\[[a-zA-Z][a-zA-Z0-9_ ,-]*\]/g
const slots = (t) => Array.from(t.matchAll(SLOT), (m) => m[0]).sort()
const problems = []

for (const file of fs.readdirSync(folder).filter((f) => f.startsWith(lang) && f.endsWith('.txt'))) {
  for (const row of fs.readFileSync(path.join(folder, file), 'utf8').split(/\r?\n/)) {
    if (!row.trim()) continue
    const tab = row.indexOf('\t')
    const index = Number(row.slice(0, tab))
    const text = row.slice(tab + 1).trim()
    if (tab < 0 || !Number.isInteger(index) || index < 0 || index >= source.length || !text) {
      problems.push(`${file}: bad row "${row.slice(0, 50)}"`)
      continue
    }
    const en = source[index]
    // A translation can drop a variable that only makes a plural, but can't invent one
    const missing = slots(en).filter((s) => !text.includes(s) && !/macro\{1\}|time\{1\}|\{1\}$/.test(en))
    const invented = slots(text).filter((s) => !en.includes(s))
    if (missing.length) problems.push(`${index}: missing ${missing.join(' ')}`)
    if (invented.length) problems.push(`${index}: invented ${invented.join(' ')}`)
    const enTags = (en.match(TAG) || []).length
    if (enTags && !(text.match(TAG) || []).length) problems.push(`${index}: lost its emotion tags`)
    lines[index] = text
  }
}

fs.writeFileSync(output, JSON.stringify(lines, null, 0) + '\n')
const done = lines.filter(Boolean).length
console.log(`${lang}: ${done} of ${source.length}. Missing: ${lines.map((l, i) => (l ? null : i)).filter((i) => i !== null).slice(0, 30).join(' ')}`)
problems.slice(0, 40).forEach((p) => console.log('  ' + p))
process.exit(problems.length ? 1 : 0)
