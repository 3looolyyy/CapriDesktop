/**
 * The bug report: what Capri is running on and with, plus her recent logs, ready to paste into a
 * GitHub issue or send to the developer. Also forwards what her windows log, and streams new lines
 * to the Logs panel in Settings while it's open.
 */
import { app, clipboard, ipcMain, type WebContents } from 'electron'
import os from 'os'
import { IPC_CHANNELS } from '../ipc/channels'
import { formatLogLine, onLog, pushLog, recentLogs, redact, type LogLevel, type LogLine } from './log-capture'
import { getLlmSettings } from './llm-gateway'
import { consciousnessService } from './consciousness-service'
import { voiceService } from './voice-service'
import { agentManager } from '../agents/agent-manager'
import type { BugReportResult } from '../../shared/logs'

/** GitHub cuts issue bodies at 65,536 characters; the report stays under it with room for a description */
const REPORT_MAX_CHARS = 60000

const CONSOLE_LEVELS: LogLevel[] = ['debug', 'info', 'warn', 'error']

/** What every window prints to its console goes to the same log (mic, UI and render errors) */
export function captureWindowLogs(): void {
  app.on('web-contents-created', (_event, contents) => {
    contents.on('console-message', (_e, level, message, line, sourceId) => {
      const where = sourceId ? ` (${String(sourceId).split(/[\\/]/).pop()}:${line})` : ''
      pushLog(CONSOLE_LEVELS[level] ?? 'log', 'window', `${message}${level >= 2 ? where : ''}`)
    })
    contents.on('render-process-gone', (_e, details) => {
      pushLog('error', 'window', `A window's renderer stopped: ${details.reason} (exit code ${details.exitCode})`)
    })
  })
}

async function ollamaSummary(): Promise<string> {
  try {
    const res = await fetch('http://127.0.0.1:11434/api/tags', { signal: AbortSignal.timeout(1500) })
    if (!res.ok) return `answered HTTP ${res.status}`
    const data = (await res.json()) as { models?: { name: string; size?: number }[] }
    const models = (data.models || []).map((m) => (m.size ? `${m.name} (${(m.size / 1e9).toFixed(1)} GB)` : m.name))
    return `running, ${models.length} model(s): ${models.join(', ') || 'none'}`
  } catch {
    return 'not reachable'
  }
}

async function systemSummary(): Promise<string[]> {
  const llm = getLlmSettings()
  const language = consciousnessService.getLanguageSettings()
  let voiceProvider = 'unknown'
  try {
    voiceProvider = String(voiceService.getConfig()?.provider || 'edge-tts')
  } catch {}
  const brain =
    llm.provider === 'cloud' || llm.provider === 'app'
      ? `${llm.provider} (${llm.preset || 'custom'}), model ${llm.model || 'default'}${llm.provider === 'cloud' ? `, ${llm.hasKey ? 'key saved' : 'no key'}` : ''}`
      : `local (Ollama), model ${agentManager.getConfig().model || 'capri'}`
  const last = llm.lastRequest
  return [
    `- **Capri:** ${app.getVersion()}${app.isPackaged ? '' : ' (dev)'}`,
    `- **System:** ${os.type()} ${os.release()} (${process.arch}), ${Math.round(os.totalmem() / 1024 ** 3)} GB RAM, ${os.cpus()[0]?.model?.trim() || 'unknown CPU'}`,
    `- **Electron:** ${process.versions.electron}`,
    `- **Brain:** ${brain}`,
    `- **Vision model:** ${llm.visionModel || 'local default'}`,
    ...(last ? [`- **Last cloud request:** ${last.host}, ${last.model}, ${last.state}${last.httpStatus ? ` (HTTP ${last.httpStatus})` : ''}`] : []),
    `- **Ollama:** ${await ollamaSummary()}`,
    `- **Voice:** ${voiceProvider}; speech to text ${language.sttEngine || 'whisper-small'}`,
    `- **Languages:** ${JSON.stringify(language)}`
  ].map(redact)
}

export async function buildBugReport(): Promise<{ text: string; lines: number; truncated: boolean }> {
  const header = [
    '### Capri bug report',
    '',
    '**What happened:** (describe it here)',
    '',
    ...(await systemSummary()),
    ''
  ].join('\n')
  const all = recentLogs().map(formatLogLine)
  // The newest lines matter most: the oldest ones go first when it doesn't fit
  const budget = REPORT_MAX_CHARS - header.length - 200
  const kept: string[] = []
  let size = 0
  for (let i = all.length - 1; i >= 0; i--) {
    size += all[i].length + 1
    if (size > budget) break
    kept.push(all[i])
  }
  kept.reverse()
  const truncated = kept.length < all.length
  const text = [
    header,
    `<details><summary>Logs (last ${kept.length} lines${truncated ? ` of ${all.length}` : ''})</summary>`,
    '',
    '```',
    // Backticks in a line would close the block early
    ...kept.map((l) => l.replace(/```/g, "'''")),
    '```',
    '</details>',
    ''
  ].join('\n')
  return { text, lines: kept.length, truncated }
}

const subscribers = new Map<number, { contents: WebContents; stop: () => void }>()

function subscribe(contents: WebContents): void {
  if (subscribers.has(contents.id)) return
  // Lines go out in small batches, not one message per line
  let pending: LogLine[] = []
  let timer: NodeJS.Timeout | null = null
  const flush = (): void => {
    timer = null
    if (contents.isDestroyed()) return unsubscribe(contents.id)
    const batch = pending
    pending = []
    contents.send(IPC_CHANNELS.LOGS_LINES, batch)
  }
  const stopListening = onLog((line) => {
    pending.push(line)
    if (!timer) timer = setTimeout(flush, 250)
  })
  const stop = (): void => {
    stopListening()
    if (timer) clearTimeout(timer)
  }
  subscribers.set(contents.id, { contents, stop })
  contents.once('destroyed', () => unsubscribe(contents.id))
}

function unsubscribe(id: number): void {
  subscribers.get(id)?.stop()
  subscribers.delete(id)
}

export function registerBugReportHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.LOGS_GET, () => recentLogs())
  ipcMain.handle(IPC_CHANNELS.LOGS_SUBSCRIBE, (event) => {
    subscribe(event.sender)
    return true
  })
  ipcMain.handle(IPC_CHANNELS.LOGS_UNSUBSCRIBE, (event) => {
    unsubscribe(event.sender.id)
    return true
  })
  ipcMain.handle(IPC_CHANNELS.BUG_REPORT_COPY, async (): Promise<BugReportResult> => {
    const report = await buildBugReport()
    clipboard.writeText(report.text)
    return { success: true, chars: report.text.length, lines: report.lines, truncated: report.truncated }
  })
}
