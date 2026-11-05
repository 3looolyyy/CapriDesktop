/**
 * Plays a reply from the model that changes Capri's look (see look-tags.ts) part by part. Audio is
 * prepared ahead in order, so one part follows the other with no wait. While it plays, nothing else
 * makes Capri talk or move. Pressing the talk hotkey cancels it.
 */

import { IPC_CHANNELS, ScriptEventPayload } from '../../ipc/channels'
import { windowManager } from '../../windows/window-manager'
import { personalize } from '../user-profile'
import { voiceService } from '../voice-service'
import { bubbleTextOf, ScriptPart } from './script-part'

const GAP_MS = 350

class ScriptPlayer {
  private playing = false
  private cancelled = false
  private nextId = 1
  private lineDone: { id: number; resolve: () => void } | null = null
  private queue: ScriptPart[][] = []
  /** A reply keeps her look while the next words get ready: a pause reads better than flashing another pose */
  private isReply = false

  public isPlaying(): boolean {
    return this.playing
  }

  /** A reply that came while another is playing waits for its turn instead of talking over it */
  public playParts(parts: ScriptPart[]): void {
    if (this.playing) {
      this.queue.push(parts)
      return
    }
    this.isReply = true
    void this.play(parts)
  }

  public cancel(): void {
    if (!this.playing) return
    console.log('[ScriptPlayer] Cancelled by the user.')
    this.cancelled = true
    this.queue = []
    this.lineDone?.resolve()
  }

  /** The renderer finished saying a line */
  public onLineDone(id: number): void {
    if (this.lineDone?.id === id) this.lineDone.resolve()
  }

  private send(event: ScriptEventPayload): void {
    windowManager.broadcast(IPC_CHANNELS.COMPANION_SCRIPT_EVENT, event)
  }

  private async play(parts: ScriptPart[]): Promise<void> {
    if (this.playing) return
    this.playing = true
    this.cancelled = false
    console.log(`[ScriptPlayer] Starting a script of ${parts.length} parts.`)
    if (windowManager.isDeckVisible()) windowManager.hideDeck()
    this.send({ kind: 'start' })

    try {
      for (let current: ScriptPart[] | undefined = parts; current && !this.cancelled; current = this.queue.shift()) {
        // In order and one at a time: the voice service would otherwise pay for the same line twice
        let chain: Promise<unknown> = Promise.resolve()
        const audio = current.map((part) => {
          const ready = chain.then(() =>
            this.cancelled || !part.text
              ? null
              : voiceService.synthesize(personalize(part.text), part.lang, { silent: true }).catch(() => null)
          )
          chain = ready
          return ready
        })

        for (let i = 0; i < current.length && !this.cancelled; i++) {
          await this.playPart(current[i], audio[i], i)
          if (!this.cancelled) await this.wait(current[i].after ? 0 : GAP_MS)
        }
      }
    } catch (err) {
      console.warn('[ScriptPlayer] Script stopped:', err)
    } finally {
      this.playing = false
      this.send({ kind: 'end' })
      console.log('[ScriptPlayer] Script finished.')
    }
  }

  private async playPart(part: ScriptPart, ready: Promise<any>, index: number): Promise<void> {
    // A look with no words: there's nothing to say or to wait for
    if (!part.text) {
      if (part.after) {
        this.send({ kind: 'look', look: part.after.look })
        await this.wait(part.after.holdMs)
      }
      return
    }

    // Only a line that isn't ready yet shows her thinking
    let isReady = false
    void ready.then(() => (isReady = true))
    await this.wait(60)
    if (!isReady && (index === 0 || !this.isReply)) this.send({ kind: 'look', look: 'thinking' })
    const res = await ready
    if (this.cancelled) return

    const id = this.nextId++
    const text = personalize(part.text)
    await new Promise<void>((resolve) => {
      // If the renderer never answers, the script moves on instead of hanging forever
      const watchdog = setTimeout(resolve, text.length * 130 + 20000)
      this.lineDone = {
        id,
        resolve: () => {
          clearTimeout(watchdog)
          resolve()
        }
      }
      console.log(`[ScriptPlayer] Part ${index + 1}${res?.success ? '' : ' (no audio)'}: ${bubbleTextOf(text).slice(0, 70)}`)
      this.send({
        kind: 'line',
        id,
        text: bubbleTextOf(text),
        audioDataUrl: res?.success ? res.audioDataUrl : undefined,
        look: part.look
      })
    })
    this.lineDone = null
    if (this.cancelled || !part.after) return

    this.send({ kind: 'look', look: part.after.look })
    await this.wait(part.after.holdMs)
  }

  private wait(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms))
  }
}

export const scriptPlayer = new ScriptPlayer()
