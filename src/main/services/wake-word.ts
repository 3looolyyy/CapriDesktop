/** Always-listening filter: only utterances that mention Capri (or match a macro) get an answer. */

import { macroService } from './macro-service'

export interface WakeCheckResult {
  addressed: boolean
  /** Text with the wake word removed, ready to send as a prompt */
  text: string
  reason: 'wake_word' | 'macro' | 'none'
}

const WAKE_WORD =
  /\b(?:hey\s+|hola\s+|oye\s+|oi\s+|ey\s+|che\s+|ok\s+|okay\s+)?(?:capri|kapri|capry|kapry|capr[ií]e?|cabri|caprii|capricornio|capricorn|caprice)\b[,.!?:;]*/i

// Things Whisper "hears" in silence/noise
const HALLUCINATIONS = /^(?:thank you\.?|thanks for watching!?|gracias\.?|subt[ií]tulos.*|subtitles by.*|\.+|you|bye\.?)$/i

export function checkAddressed(raw: string): WakeCheckResult {
  const text = (raw || '').trim()
  if (!text || HALLUCINATIONS.test(text)) return { addressed: false, text: '', reason: 'none' }

  if (WAKE_WORD.test(text)) {
    const stripped = text
      .replace(WAKE_WORD, ' ')
      .replace(/^[\s,.!?:;-]+/, '')
      .replace(/[\s,;:-]+$/, '')
      .replace(/\s+/g, ' ')
      .trim()
    // "Capri?" alone still counts: she answers like a friend who heard her name
    return { addressed: true, text: stripped || text, reason: 'wake_word' }
  }

  try {
    const macro = macroService.findMatch(text, 0.9)
    if (macro) return { addressed: true, text, reason: 'macro' }
  } catch {}

  return { addressed: false, text: '', reason: 'none' }
}
