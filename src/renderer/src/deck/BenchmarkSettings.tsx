import React, { useEffect, useRef, useState } from 'react'
import { Eye, Gauge, Loader2, Play, Square } from 'lucide-react'
import { openMicrophone, micErrorKind } from '../utils/microphone'
import { useT } from '../utils/useUiLang'
import {
  BENCHMARK_LLM_PROMPTS,
  BENCHMARK_RECORD_MS,
  BENCHMARK_VOICE_PHRASES,
  type BenchmarkResult
} from '../../../shared/benchmark'

type Slot = BenchmarkResult | null

const fmt = (ms: number): string => (ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(2)} s`)

const average = (slots: Slot[]): number | null => {
  const ok = slots.filter((s): s is BenchmarkResult => !!s?.success && s.ms !== undefined)
  return ok.length === slots.length && ok.length > 0 ? ok.reduce((sum, s) => sum + (s.ms as number), 0) / ok.length : null
}

async function recordClip(ms: number, onTick: (secondsLeft: number) => void): Promise<ArrayBuffer> {
  const stream = await openMicrophone()
  const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm'
  const rec = new MediaRecorder(stream, { mimeType })
  const chunks: Blob[] = []
  rec.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }
  const stopped = new Promise<void>((resolve) => {
    rec.onstop = () => resolve()
  })
  const startedAt = Date.now()
  onTick(Math.ceil(ms / 1000))
  rec.start()
  const ticker = setInterval(() => onTick(Math.max(0, Math.ceil((ms - (Date.now() - startedAt)) / 1000))), 250)
  await new Promise((resolve) => setTimeout(resolve, ms))
  clearInterval(ticker)
  rec.stop()
  await stopped
  stream.getTracks().forEach((track) => track.stop())
  return new Blob(chunks, { type: mimeType }).arrayBuffer()
}

const Row: React.FC<{ label: string; slot: Slot; active?: boolean; notRun: string; failed: (error: string) => string }> = ({ label, slot, active, notRun, failed }) => (
  <div className="flex items-start justify-between gap-3 text-[13px] py-1.5 border-t border-stone-800/70 first:border-t-0">
    <div className="min-w-0">
      <div className="text-stone-300">{label}</div>
      {slot?.success && slot.detail && <div className="text-[12px] text-[var(--cp-muted)] truncate" title={slot.detail}>{slot.detail}</div>}
      {slot && !slot.success && <div className="text-[12px] text-[var(--cp-red-hi)]">{failed(slot.error || '')}</div>}
    </div>
    <div className="shrink-0 tabular-nums text-stone-200">
      {active ? <Loader2 size={14} className="animate-spin text-cp-400" /> : slot?.success ? fmt(slot.ms ?? 0) : <span className="text-[var(--cp-muted)]">{slot ? '-' : notRun}</span>}
    </div>
  </div>
)

const Section: React.FC<{ title: string; help: string; engine?: string; children: React.ReactNode }> = ({ title, help, engine, children }) => (
  <div className="p-3 bg-black/60 border border-stone-800">
    <div className="flex items-baseline justify-between gap-3">
      <span className="font-semibold text-[14px] text-stone-200">{title}</span>
      {engine && <span className="text-[12px] text-[var(--cp-muted)] truncate">{engine}</span>}
    </div>
    <p className="text-[12px] text-[var(--cp-muted)] mb-1.5">{help}</p>
    {children}
  </div>
)

export const BenchmarkSettings: React.FC = () => {
  const t = useT()
  const [running, setRunning] = useState<'main' | 'vision' | null>(null)
  const [status, setStatus] = useState('')
  const [active, setActive] = useState<string | null>(null)
  const [stt, setStt] = useState<Slot>(null)
  const [llm, setLlm] = useState<Slot[]>(BENCHMARK_LLM_PROMPTS.map(() => null))
  const [voice, setVoice] = useState<Slot[]>(BENCHMARK_VOICE_PHRASES.map(() => null))
  const [vision, setVision] = useState<Slot>(null)
  const stopRef = useRef(false)
  const aliveRef = useRef(true)

  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
      stopRef.current = true
    }
  }, [])

  const run = async (req: Parameters<typeof window.api.benchmark.run>[0]): Promise<BenchmarkResult> => {
    try {
      const result = await window.api.benchmark.run(req)
      return result.error === 'busy' ? { ...result, error: t('bm_busy') } : result
    } catch (err) {
      return { success: false, error: String((err as Error)?.message || err) }
    }
  }
  const alive = (): boolean => aliveRef.current && !stopRef.current

  const runMain = async (): Promise<void> => {
    if (running) return
    stopRef.current = false
    setRunning('main')
    setStt(null)
    setLlm(BENCHMARK_LLM_PROMPTS.map(() => null))
    setVoice(BENCHMARK_VOICE_PHRASES.map(() => null))

    setActive('stt')
    try {
      setStatus(t('bm_listening', { seconds: Math.ceil(BENCHMARK_RECORD_MS / 1000) }))
      const audio = await recordClip(BENCHMARK_RECORD_MS, (left) => aliveRef.current && setStatus(t('bm_listening', { seconds: left })))
      if (!alive()) return finish()
      setStatus(t('bm_transcribing'))
      setStt(await run({ step: 'stt', audio }))
    } catch (err) {
      setStt({ success: false, error: t('bm_micError') + ` (${micErrorKind(err)})` })
    }

    if (!alive()) return finish()
    setStatus(t('bm_loadingModel'))
    await run({ step: 'llm', index: -1 })
    const llmResults: Slot[] = BENCHMARK_LLM_PROMPTS.map(() => null)
    for (let i = 0; i < BENCHMARK_LLM_PROMPTS.length && alive(); i++) {
      setActive(`llm${i}`)
      setStatus(t('bm_testingLlm', { n: i + 1, total: BENCHMARK_LLM_PROMPTS.length }))
      llmResults[i] = await run({ step: 'llm', index: i })
      setLlm([...llmResults])
    }

    const voiceResults: Slot[] = BENCHMARK_VOICE_PHRASES.map(() => null)
    for (let i = 0; i < BENCHMARK_VOICE_PHRASES.length && alive(); i++) {
      setActive(`voice${i}`)
      setStatus(t('bm_testingVoice', { n: i + 1, total: BENCHMARK_VOICE_PHRASES.length }))
      voiceResults[i] = await run({ step: 'voice', index: i })
      setVoice([...voiceResults])
    }
    finish()
  }

  const runVision = async (): Promise<void> => {
    if (running) return
    stopRef.current = false
    setRunning('vision')
    setVision(null)
    setActive('vision')
    setStatus(t('bm_loadingModel'))
    // This makes sure the model is first loaded separately before it's tested, so the time isn't skewed by load time
    const warmup = await run({ step: 'vision', index: -1 })
    if (warmup.success && alive()) {
      setStatus(t('bm_lookingAtScreen'))
      setVision(await run({ step: 'vision', index: 0 }))
    } else {
      setVision(warmup)
    }
    finish()
  }

  const finish = (): void => {
    if (!aliveRef.current) return
    setActive(null)
    setStatus('')
    setRunning(null)
  }

  const llmAvg = average(llm)
  const voiceAvg = average(voice)
  const sttMs = stt?.success ? (stt.ms ?? null) : null
  const parts = [
    { id: 'stt', label: t('bm_stt'), ms: sttMs, color: 'bg-cyan-400' },
    { id: 'llm', label: t('bm_llm'), ms: llmAvg, color: 'bg-cp-400' },
    { id: 'voice', label: t('bm_voice'), ms: voiceAvg, color: 'bg-amber-400' }
  ]
  const complete = parts.every((p) => p.ms !== null)
  const total = parts.reduce((sum, p) => sum + (p.ms ?? 0), 0)
  const anyResult = parts.some((p) => p.ms !== null)
  const failedText = (error: string): string => t('bm_failed', { error })
  const rowProps = { notRun: t('bm_notRun'), failed: failedText }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center px-5 py-3.5 border-b border-[var(--cp-red-line)] shrink-0">
        <span className="cp-title text-[18px] text-[var(--cp-red)] flex items-center gap-2">
          <Gauge size={16} /> {t('bm_title')}
        </span>
      </div>
      <div className="cp-scroll flex-1 min-h-0 overflow-y-auto p-5 space-y-3">
        <p className="text-[13px] text-[var(--cp-muted)]">{t('bm_intro')}</p>

        <div className="flex items-center gap-3">
          {running === 'main' ? (
            <button
              type="button"
              onClick={() => {
                stopRef.current = true
              }}
              className="cp-cut flex items-center gap-2 px-3 py-2 text-[13px] border border-[#612f30] bg-[#3c1c1d] text-white cursor-pointer"
            >
              <Square size={13} /> {t('bm_stop')}
            </button>
          ) : (
            <button
              type="button"
              disabled={running !== null}
              onClick={() => void runMain()}
              className="cp-cut flex items-center gap-2 px-3 py-2 text-[13px] border border-[#612f30] bg-[#3c1c1d] text-white hover:bg-[#4a2223] cursor-pointer disabled:opacity-40 disabled:cursor-default"
            >
              <Play size={13} /> {t('bm_run')}
            </button>
          )}
          {running && <span className="text-[13px] text-stone-300 truncate">{status}</span>}
        </div>

        <Section title={t('bm_stt')} help={t('bm_sttHelp')} engine={stt?.engine}>
          <Row label={t('bm_sttRow')} slot={stt} active={active === 'stt'} {...rowProps} />
        </Section>

        <Section title={t('bm_llm')} help={t('bm_llmHelp', { count: BENCHMARK_LLM_PROMPTS.length })} engine={llm.find((s) => s?.engine)?.engine}>
          {BENCHMARK_LLM_PROMPTS.map((prompt, i) => (
            <Row key={i} label={t('bm_prompt', { n: i + 1, lines: prompt.split('\n').length })} slot={llm[i]} active={active === `llm${i}`} {...rowProps} />
          ))}
          <div className="flex justify-between text-[13px] pt-1.5 border-t border-stone-700 font-semibold text-stone-100">
            <span>{t('bm_average')}</span>
            <span className="tabular-nums">{llmAvg !== null ? fmt(llmAvg) : '-'}</span>
          </div>
        </Section>

        <Section title={t('bm_voice')} help={t('bm_voiceHelp')} engine={voice.find((s) => s?.engine)?.engine}>
          {BENCHMARK_VOICE_PHRASES.map((_, i) => (
            <Row key={i} label={t('bm_phrase', { n: i + 1 })} slot={voice[i]} active={active === `voice${i}`} {...rowProps} />
          ))}
          <div className="flex justify-between text-[13px] pt-1.5 border-t border-stone-700 font-semibold text-stone-100">
            <span>{t('bm_average')}</span>
            <span className="tabular-nums">{voiceAvg !== null ? fmt(voiceAvg) : '-'}</span>
          </div>
        </Section>

        <div className="p-3 bg-black/60 border border-[var(--cp-red-line)]">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-semibold text-[14px] text-stone-100">{t('bm_total')}</span>
            <span className="text-[18px] font-semibold tabular-nums text-[var(--cp-red-hi)]">{complete ? fmt(total) : '-'}</span>
          </div>
          <p className="text-[12px] text-[var(--cp-muted)] mb-2">{t('bm_totalHelp')}</p>
          {anyResult && (
            <>
              <div className="flex h-2 w-full overflow-hidden bg-stone-900" role="img" aria-label={t('bm_total')}>
                {parts.map((p) => (
                  <div key={p.id} className={p.color} style={{ width: `${total > 0 && p.ms ? (p.ms / total) * 100 : 0}%` }} title={`${p.label}: ${p.ms !== null ? fmt(p.ms) : '-'}`} />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[12px] text-stone-300">
                {parts.map((p) => (
                  <span key={p.id} className="flex items-center gap-1.5">
                    <span className={`inline-block w-2 h-2 ${p.color}`} />
                    {p.label}: <span className="tabular-nums">{p.ms !== null ? fmt(p.ms) : '-'}</span>
                  </span>
                ))}
              </div>
              {!complete && running === null && <p className="text-[12px] text-[var(--cp-red-hi)] mt-2">{t('bm_incomplete')}</p>}
              {complete && <p className="text-[12px] text-[var(--cp-muted)] mt-2">{t('bm_tip')}</p>}
            </>
          )}
        </div>

        <Section title={t('bm_visionTitle')} help={t('bm_visionHelp')} engine={vision?.engine}>
          <div className="flex items-center gap-3 mb-1.5">
            <button
              type="button"
              disabled={running !== null}
              onClick={() => void runVision()}
              className="cp-cut flex items-center gap-2 px-3 py-2 text-[13px] border border-[#612f30] bg-[#3c1c1d] text-white hover:bg-[#4a2223] cursor-pointer disabled:opacity-40 disabled:cursor-default"
            >
              <Eye size={13} /> {t('bm_runVision')}
            </button>
            {running === 'vision' && <span className="text-[13px] text-stone-300 truncate">{status}</span>}
          </div>
          <Row label={t('bm_visionRow')} slot={vision} active={active === 'vision'} {...rowProps} />
          <p className="text-[12px] text-[var(--cp-muted)] mt-1">{t('bm_visionNote')}</p>
        </Section>
      </div>
    </div>
  )
}
