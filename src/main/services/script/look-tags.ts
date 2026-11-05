/**
 * Lets the model change Capri's look in the middle of a reply. It writes a tag before the words it applies to, and the reply is cut there:
 *
 *   "Dejame ver. [look:eye] Mmm, acá hay algo raro. [look:talk] Igual ya lo arreglo."
 *
 * A look lasts until the next tag or the end of the reply. The tags are never read aloud or shown.
 */

import { bubbleTextOf, ScriptLook, ScriptPart } from './script-part'

const LOOK_BY_NAME: Record<string, ScriptLook | null> = {
  eye: 'ojos',
  ojo: 'ojos',
  eyes: 'ojos2',
  ojos: 'ojos2',
  red_eye: 'closed',
  ojo_rojo: 'closed',
  talk: null,
  hablar: null
}

// Local models don't always copy the format: "[ojo rojo]" and "[Look: Red Eye]" are accepted too
const NAMES = 'eyes?|ojos?|red[ _-]?eye|ojo[ _-]?rojo|talk|hablar'
const LOOK_TAG = new RegExp(`\\[\\s*(?:look\\s*:\\s*(?:${NAMES}|[^\\]]*)|${NAMES})\\s*\\]`, 'gi')

/** A look with no words after it is held this long, so it can be seen */
const HOLD_MS = 1500

function lookOf(tag: string): ScriptLook | null {
  const name = tag
    .replace(/[[\]]/g, '')
    .replace(/^\s*look\s*:/i, '')
    .trim()
    .toLowerCase()
    .replace(/[ -]+/g, '_')
    .replace(/^redeye$/, 'red_eye')
    .replace(/^ojorojo$/, 'ojo_rojo')
  return LOOK_BY_NAME[name] ?? null
}

/**
 * The look the user explicitly asked for, in the words of the tag. A small local model mixes up
 * looks that are described in a list, so when there's no doubt it's told which one.
 */
export function requestedLook(prompt: string): 'eye' | 'eyes' | 'red_eye' | null {
  const t = prompt.toLowerCase()
  if (/\b(?:ojo\s+rojo|red\s+eye)\b/.test(t)) return 'red_eye'
  if (/\b(?:(?:los|tus)\s+(?:dos\s+)?ojos|dos\s+ojos|ojos\s+gigantes|(?:your|two|both|big|huge|giant)\s+eyes)\b/.test(t)) return 'eyes'
  if (/\b(?:(?:tu|el)\s+ojo|your\s+eye)\b/.test(t)) return 'eye'
  return null
}

export function stripLookTags(text: string): string {
  return text.replace(LOOK_TAG, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * When the user asked for a look, the reply shows it even if the model picked another one or none:
 * it replaces the first look of the reply, or opens it.
 */
export function ensureRequestedLook(reply: string, asked: 'eye' | 'eyes' | 'red_eye' | null): string {
  if (!asked) return reply
  const wanted = LOOK_BY_NAME[asked]
  const tags = Array.from(reply.matchAll(LOOK_TAG))
  if (tags.some((tag) => lookOf(tag[0]) === wanted)) return reply
  const tag = `[look:${asked}]`
  if (!tags.length) return `${tag} ${reply}`
  const first = tags[0]
  return reply.slice(0, first.index) + tag + reply.slice((first.index as number) + first[0].length)
}

/** The reply cut at each look, or null when it has no look tags and can be said in one go */
export function splitByLooks(text: string): ScriptPart[] | null {
  const tags = Array.from(text.matchAll(LOOK_TAG))
  if (!tags.length) return null

  const parts: ScriptPart[] = []
  let carried = '' // Emotion tags before a look tag belong to the next words: "[excited] [look:eye] Wow"
  const addWords = (raw: string, look: ScriptLook | null) => {
    const words = `${carried} ${raw}`.replace(/\s+/g, ' ').trim()
    carried = ''
    if (!words) return false
    if (!bubbleTextOf(words)) {
      carried = words
      return false
    }
    parts.push(look ? { text: words, look } : { text: words })
    return true
  }

  addWords(text.slice(0, tags[0].index), null)
  tags.forEach((tag, i) => {
    const start = (tag.index as number) + tag[0].length
    const end = i + 1 < tags.length ? (tags[i + 1].index as number) : text.length
    const look = lookOf(tag[0])
    const said = addWords(text.slice(start, end), look)
    // At the very end, or alone: there are no words to carry it, so it's just shown for a moment
    if (!said && i === tags.length - 1 && look) parts.push({ text: '', look, after: { look, holdMs: HOLD_MS } })
  })
  return parts
}
