import { agentManager } from '../agents/agent-manager'
import { consciousnessService } from './consciousness-service'
import { getLlmSettings, isCloudMode, cloudVisionModel, describeCloudImage, llmFetch } from './llm-gateway'
import { describeLocalImage, VISION_NUM_CTX } from './local-vision'
import { localAIEnabled } from './local-ai-policy'
import { ollamaService } from './ollama-service'
import { scannerService } from './scanner-service'
import { voiceService } from './voice-service'
import { llmBody } from './user-profile'
import { CAPRI_CHAT_STYLE } from '../../shared/capri-style'
import { scannerVisionMode } from '../../shared/platform-policy'
import { BENCHMARK_LLM_PROMPTS, BENCHMARK_VOICE_PHRASES, type BenchmarkRequest, type BenchmarkResult } from '../../shared/benchmark'

const LLM_MAX_TOKENS = 120
const VISION_PROMPT = 'Describe what is on this screen in one or two short sentences.'

const shorten = (text: string, max = 90): string => {
  const clean = text.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/\s+/g, ' ').trim()
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean
}

const failure = (err: unknown): BenchmarkResult => ({ success: false, error: String((err as Error)?.message || err).slice(0, 200) })

class BenchmarkService {
  private busy = false

  public async run(req: BenchmarkRequest): Promise<BenchmarkResult> {
    // Prevents parallel tests to get accurate times
    if (this.busy) return { success: false, error: 'busy' }
    this.busy = true
    const label = req.index !== undefined ? `${req.step} #${req.index}` : req.step
    let result: BenchmarkResult
    try {
      result = await this.execute(req)
    } catch (err) {
      result = failure(err)
      console.error(`[Benchmark] ${label} threw:`, err)
    } finally {
      this.busy = false
    }
    if (result.success) console.log(`[Benchmark] ${label}: ${Math.round(result.ms ?? 0)}ms (${result.engine || 'n/a'})`)
    else console.warn(`[Benchmark] ${label} failed: ${result.error}`)
    return result
  }

  private async execute(req: BenchmarkRequest): Promise<BenchmarkResult> {
    switch (req.step) {
      case 'stt':
        return this.stt(req.audio)
      case 'llm':
        return this.llm(req.index ?? 0)
      case 'voice':
        return this.voice(req.index ?? 0)
      case 'vision':
        return this.vision(req.index ?? 0)
      default:
        return { success: false, error: 'Unknown test' }
    }
  }

  private async stt(audio?: ArrayBuffer | Uint8Array): Promise<BenchmarkResult> {
    if (!audio || audio.byteLength < 500) return { success: false, error: 'No audio was recorded. Check the microphone.' }
    const buffer = audio instanceof ArrayBuffer ? Buffer.from(audio) : Buffer.from(audio.buffer, audio.byteOffset, audio.byteLength)
    const engine = consciousnessService.getLanguageSettings().sttEngine || 'whisper-small'
    const startedAt = performance.now()
    const res = await voiceService.transcribe(buffer, false)
    const ms = performance.now() - startedAt
    // This is so that even silence works for the transcription
    if (!res.success && res.error !== 'No speech detected') return { success: false, error: res.error || 'Transcription failed' }
    return { success: true, ms, engine, detail: res.text ? shorten(res.text) : '(no speech detected)' }
  }

  private async llm(index: number): Promise<BenchmarkResult> {
    const model = isCloudMode() ? getLlmSettings().model || getLlmSettings().preset : agentManager.getConfig().model
    if (!isCloudMode()) {
      if (process.platform === 'darwin' && !localAIEnabled()) return { success: false, error: 'Local AI is disabled in the settings.' }
      const local = await ollamaService.ensureRunning(true)
      if (!local.running) return { success: false, error: 'Ollama is not running.' }
    }

    // This makes sure the model is first loaded separately before it's tested, so the time isn't skewed by load time
    const warmup = index < 0
    const prompt = warmup ? 'Say hi.' : BENCHMARK_LLM_PROMPTS[index]
    if (!prompt) return { success: false, error: 'Unknown prompt' }

    const payload: Record<string, unknown> = {
      model,
      messages: [
        { role: 'system', content: CAPRI_CHAT_STYLE },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: LLM_MAX_TOKENS,
      stream: false
    }
    if (process.platform === 'darwin' && !isCloudMode() && /qwen3|^capri$/i.test(model)) payload.reasoning_effort = 'none'

    const startedAt = performance.now()
    const response = await llmFetch('http://127.0.0.1:11434/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: llmBody(payload),
      signal: AbortSignal.timeout(warmup ? 180000 : 90000)
    })
    if (!response.ok) return { success: false, error: `The model answered HTTP ${response.status}.` }
    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] }
    const ms = performance.now() - startedAt
    const text = data.choices?.[0]?.message?.content || ''
    if (!text.trim() && !warmup) return { success: false, error: 'The model returned an empty answer.' }
    return { success: true, ms, engine: model, detail: shorten(text) }
  }

  private async voice(index: number): Promise<BenchmarkResult> {
    const phrase = BENCHMARK_VOICE_PHRASES[index]
    if (!phrase) return { success: false, error: 'Unknown phrase' }
    const provider = String(voiceService.getConfig()?.provider || 'edge-tts')
    const startedAt = performance.now()
    // Ignore audio cache, needed for accurate time otherwise reports 0ms
    const res = await voiceService.synthesize(phrase, 'en', { silent: true, fresh: true })
    const ms = performance.now() - startedAt
    if (!res.success) return { success: false, error: res.error || 'The voice engine did not answer.' }
    if (res.fallback) return { success: false, error: `${provider} failed and Edge-TTS answered instead, so the time is not ${provider}'s.` }
    return { success: true, ms, engine: provider, detail: `${phrase.length} chars` }
  }

  private async vision(index: number): Promise<BenchmarkResult> {
    const mode = scannerVisionMode(process.platform, isCloudMode(), localAIEnabled())
    if (mode === 'disabled') return { success: false, error: 'Local AI is disabled in the settings.' }

    let model = cloudVisionModel()
    if (mode !== 'cloud') {
      const local = await ollamaService.ensureRunning(true)
      if (!local.running) return { success: false, error: 'Ollama is not running.' }
      // Ollama does the vision here even with a cloud brain saved, so it needs an installed local model
      model = (await scannerService.detectVisionModel(true)) || ''
      if (!model) return { success: false, error: 'No vision model is installed.' }
    } else if (!model) {
      return { success: false, error: 'Choose a Vision model in the model settings first.' }
    }

    // Warmup only loads the local model; a cloud model has nothing to load, so no paid call is spent on it
    if (index < 0) {
      if (mode === 'cloud') return { success: true, engine: model }
      const response = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, keep_alive: '5m', options: { num_ctx: VISION_NUM_CTX } }),
        signal: AbortSignal.timeout(180000)
      })
      if (!response.ok) return { success: false, error: `Ollama could not load ${model} (HTTP ${response.status}).` }
      return { success: true, engine: model }
    }

    const startedAt = performance.now()
    const capture = await scannerService.captureRegionBase64(true)
    if (!capture) return { success: false, error: 'The screen could not be captured.' }
    const captured = performance.now()
    const answer =
      mode === 'cloud'
        ? await describeCloudImage(capture.base64, VISION_PROMPT)
        : await describeLocalImage(model, capture.base64, VISION_PROMPT, process.platform === 'darwin')
    const ms = performance.now() - startedAt
    return {
      success: true,
      ms,
      engine: model,
      detail: `${Math.round(captured - startedAt)} ms capture · ${shorten(answer, 70)}`
    }
  }
}

export const benchmarkService = new BenchmarkService()
