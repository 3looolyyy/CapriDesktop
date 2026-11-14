import { nativeImage } from 'electron'

/** Vision always uses the local Ollama endpoint, independently of cloud text settings. */

/**
 * Context for every call to the vision model, always the same: a different size makes Ollama load it
 * again (40-50s from disk). A screenshot takes 600-3000 tokens, so 4096 is enough, and it keeps llava
 * at 4.7 GB instead of 8.7 GB when the Ollama app is set to 32k, so it fits next to her text model.
 */
export const VISION_NUM_CTX = process.platform === 'darwin' ? 2048 : 4096
export async function localVisionModels(): Promise<string[]> {
  const response = await fetch('http://127.0.0.1:11434/api/tags', { signal: AbortSignal.timeout(3000) })
  if (!response.ok) throw new Error(`Local Ollama model list failed (${response.status}).`)
  const data = await response.json() as {models?: {name:string}[]}
  return (data.models || []).map(model=>model.name)
}
export async function ollamaErrorText(response: Response): Promise<string> {
  let reason = ''
  try {
    const raw = await response.text()
    try {
      reason = String((JSON.parse(raw) as { error?: unknown }).error || raw)
    } catch {
      reason = raw
    }
  } catch {}
  return reason.replace(/\s+/g, ' ').trim().slice(0, 240)
}

function shrinkImage(base64: string, maxSide: number): string {
  const image = nativeImage.createFromBuffer(Buffer.from(base64, 'base64'))
  const { width, height } = image.getSize()
  if (!width || !height || Math.max(width, height) <= maxSide) return base64
  const scale = maxSide / Math.max(width, height)
  return image.resize({ width: Math.round(width * scale), height: Math.round(height * scale), quality: 'good' }).toJPEG(75).toString('base64')
}

export async function describeLocalImage(model: string, base64: string, prompt: string, releaseAfterUse: boolean): Promise<string> {
  // The entire screen as an image can be over the context limit, so this shrinks the image once, and then again if ollama still refuses it
  const sizes = [/qwen[23](?:\.5)?-?vl/i.test(model) ? 1280 : 768, 512]
  for (let attempt = 0; attempt < sizes.length; attempt++) {
    const response = await fetch('http://127.0.0.1:11434/api/generate', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({model, images:[shrinkImage(base64, sizes[attempt])], prompt, stream:false, keep_alive:releaseAfterUse ? 0 : '15m', options:{temperature:0.2,num_predict:220,num_ctx:VISION_NUM_CTX}}),
      signal: AbortSignal.timeout(90000),
    })
    if (!response.ok) {
      const reason = await ollamaErrorText(response)
      if (response.status === 400 && /context size/i.test(reason) && attempt < sizes.length - 1) continue
      throw new Error(`Local vision model failed (${response.status}). ${reason || 'Check that the installed model supports images.'}`)
    }
    const data = await response.json() as {response?:string}
    const description = data.response?.trim()
    if (!description) throw new Error('The local vision model returned an empty response.')
    return description
  }
  throw new Error('The local vision model could not read the image.')
}

export function isScreenQuestion(text: string): boolean {
  return /(?:what(?:'s| is).*?(?:on|in).*?(?:my|the) screen|(?:check|look at|see|read|scan|describe) (?:my |the )?screen|what (?:can|do) you see(?: on my screen)?(?: right now)?[?.!]*$|what am i looking at)/i.test(text.trim())
}
