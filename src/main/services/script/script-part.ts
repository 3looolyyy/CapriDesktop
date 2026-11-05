/** A piece of a reply that Capri says with its own look. */

/** 'ojos' is her single eye, 'ojos2' the video of both eyes, 'closed' the red eye */
export type ScriptLook = 'ojos' | 'ojos2' | 'closed' | 'thinking' | 'asustada'

export interface ScriptPart {
  text: string
  /** Without one, the voice detects it */
  lang?: string
  /** Overrides the talking animation for the whole line */
  look?: ScriptLook
  /** After the line has been said, before the next one */
  after?: { look: ScriptLook; holdMs: number }
}

/** What the bubble shows: the emotion tags are only for the voice */
export function bubbleTextOf(text: string): string {
  return text
    .replace(/\[[a-zA-Z0-9_,\s\-]+\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
