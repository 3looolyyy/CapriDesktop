import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Bug, Check, ExternalLink, Pause, Play, ScrollText, Trash2 } from 'lucide-react'
import { useT } from '../utils/useUiLang'
import { ISSUES_URL, type LogLine } from '../../../shared/logs'

const MAX_SHOWN = 3000

const pad = (n: number, size = 2): string => String(n).padStart(size, '0')
const clock = (time: number): string => {
  const d = new Date(time)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`
}

const LEVEL_COLOR: Record<LogLine['level'], string> = {
  log: 'text-stone-300',
  info: 'text-stone-300',
  debug: 'text-stone-500',
  warn: 'text-amber-300',
  error: 'text-[var(--cp-red-hi)]'
}

/** Copies the bug report (system info + recent logs) and says how it went */
export const BugReportButton: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const t = useT()
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'failed'>('idle')
  const [note, setNote] = useState('')

  const copy = async (): Promise<void> => {
    if (state === 'busy') return
    setState('busy')
    try {
      const result = await window.api.logs.copyBugReport()
      setNote(result.truncated ? t('logs_copiedTrunc', { lines: result.lines }) : t('logs_copied', { lines: result.lines }))
      setState('done')
    } catch {
      setNote(t('logs_copyFailed'))
      setState('failed')
    }
    setTimeout(() => setState((s) => (s === 'busy' ? s : 'idle')), 6000)
  }

  return (
    <div className={compact ? 'space-y-1' : 'flex flex-wrap items-center gap-3'}>
      <button
        type="button"
        onClick={() => void copy()}
        disabled={state === 'busy'}
        title={t('logs_bugHelp')}
        className={`cp-cut flex items-center gap-2 px-3 py-2 text-[13px] border border-[#612f30] bg-[#3c1c1d] text-white hover:bg-[#4a2223] cursor-pointer disabled:opacity-50 disabled:cursor-wait ${compact ? 'w-full' : ''}`}
      >
        {state === 'done' ? <Check size={13} className="text-cyan-400" /> : <Bug size={13} />} {t('logs_bugReport')}
      </button>
      {state !== 'idle' && state !== 'busy' && (
        <span className={`text-[12px] ${state === 'failed' ? 'text-[var(--cp-red-hi)]' : 'text-cyan-300/90'} ${compact ? 'block px-1' : ''}`}>{note}</span>
      )}
    </div>
  )
}

/** Everything Capri logs, as it happens, plus the bug report button */
export const LogsPanel: React.FC = () => {
  const t = useT()
  const [lines, setLines] = useState<LogLine[]>([])
  const [paused, setPaused] = useState(false)
  const [problemsOnly, setProblemsOnly] = useState(false)
  const pausedRef = useRef(false)
  const queued = useRef<LogLine[]>([])
  const scroller = useRef<HTMLDivElement>(null)
  const stick = useRef(true)

  useEffect(() => {
    let alive = true
    const add = (incoming: LogLine[]): void => {
      if (!alive || !incoming.length) return
      if (pausedRef.current) {
        queued.current.push(...incoming)
        return
      }
      setLines((prev) => {
        // The history and the live stream can overlap by a few lines when the panel opens
        const lastId = prev.length ? prev[prev.length - 1].id : 0
        const fresh = incoming.filter((l) => l.id > lastId)
        if (!fresh.length) return prev
        const next = prev.concat(fresh)
        return next.length > MAX_SHOWN ? next.slice(next.length - MAX_SHOWN) : next
      })
    }
    const stop = window.api.logs.watch(add)
    void window.api.logs.get().then((history) => {
      if (!alive) return
      setLines((prev) => {
        const firstLive = prev.length ? prev[0].id : Infinity
        const merged = history.filter((l) => l.id < firstLive).concat(prev)
        return merged.slice(-MAX_SHOWN)
      })
    })
    return () => {
      alive = false
      stop()
    }
  }, [])

  const togglePause = (): void => {
    const next = !paused
    pausedRef.current = next
    setPaused(next)
    if (!next && queued.current.length) {
      const pending = queued.current
      queued.current = []
      setLines((prev) => {
        const lastId = prev.length ? prev[prev.length - 1].id : 0
        return prev.concat(pending.filter((l) => l.id > lastId)).slice(-MAX_SHOWN)
      })
    }
  }

  const shown = useMemo(() => (problemsOnly ? lines.filter((l) => l.level === 'warn' || l.level === 'error') : lines), [lines, problemsOnly])

  // Follows the newest line unless the user scrolled up to read
  useEffect(() => {
    const el = scroller.current
    if (el && stick.current) el.scrollTop = el.scrollHeight
  }, [shown])

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center px-5 py-3.5 border-b border-[var(--cp-red-line)] shrink-0">
        <span className="cp-title text-[18px] text-[var(--cp-red)] flex items-center gap-2">
          <ScrollText size={16} /> {t('logs_title')}
        </span>
      </div>
      <div className="flex-1 min-h-0 flex flex-col p-5 gap-3">
        <p className="text-[13px] text-[var(--cp-muted)] shrink-0">{t('logs_intro')}</p>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <BugReportButton />
          <button
            type="button"
            onClick={() => void window.api.game.openExternal(ISSUES_URL)}
            className="flex items-center gap-1.5 text-[13px] text-cyan-400 hover:text-cyan-300 cursor-pointer"
          >
            <ExternalLink size={13} /> {t('logs_openIssue')}
          </button>
        </div>
        <div className="flex items-center gap-3 text-[13px] shrink-0">
          <button type="button" onClick={togglePause} className="flex items-center gap-1.5 text-stone-300 hover:text-white cursor-pointer">
            {paused ? <Play size={13} /> : <Pause size={13} />} {paused ? t('logs_resume') : t('logs_pause')}
          </button>
          <button type="button" onClick={() => setLines([])} className="flex items-center gap-1.5 text-stone-300 hover:text-white cursor-pointer">
            <Trash2 size={13} /> {t('logs_clear')}
          </button>
          <label className="flex items-center gap-1.5 text-stone-300 cursor-pointer">
            <input type="checkbox" checked={problemsOnly} onChange={(e) => setProblemsOnly(e.target.checked)} className="accent-[var(--cp-red)]" />
            {t('logs_problemsOnly')}
          </label>
          <span className="ml-auto text-[12px] text-[var(--cp-muted)] tabular-nums">{shown.length}</span>
        </div>
        <div
          ref={scroller}
          onScroll={(e) => {
            const el = e.currentTarget
            stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40
          }}
          className="cp-scroll flex-1 min-h-0 overflow-auto bg-black/70 border border-stone-800 p-2 font-mono text-[11.5px] leading-[1.45] select-text"
        >
          {shown.length === 0 ? (
            <p className="text-[var(--cp-muted)] p-2">{t('logs_empty')}</p>
          ) : (
            shown.map((l) => (
              <div key={l.id} className={`whitespace-pre-wrap break-words ${LEVEL_COLOR[l.level]}`}>
                <span className="text-stone-600">{clock(l.time)} </span>
                {l.source === 'window' && <span className="text-cyan-700">[window] </span>}
                {l.text}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
