/**
 * Keeps the last lines Capri logged, from the main process and from her windows, so a bug report can
 * copy them and Settings can show them live. Import it first in the entry file, before anything logs.
 * Keys, tokens and the user's home folder are hidden as each line comes in: these logs get sent to
 * someone else.
 */
import { format } from 'util'
import os from 'os'
import type { LogLevel, LogLine } from '../../shared/logs'

export type { LogLevel, LogLine }

const MAX_LINES = 5000
const MAX_LINE_LENGTH = 4000

const lines: LogLine[] = []
const listeners = new Set<(line: LogLine) => void>()
let nextId = 1

const escapeRegex = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// The home folder carries the user's name: C:\Users\Name\... becomes ~\...
const home = os.homedir()
const HOME = home && home.length > 3 ? new RegExp(escapeRegex(home).replace(/\\\\/g, '[\\\\/]'), 'gi') : null
const user = os.userInfo().username
const USER_IN_PATH = user && user.length > 2 ? new RegExp(`([\\\\/](?:Users|home)[\\\\/])${escapeRegex(user)}(?=[\\\\/]|$)`, 'gi') : null

const SECRETS: [RegExp, string][] = [
  // Authorization headers and bearer tokens
  [/\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{8,}/gi, '$1 [hidden]'],
  // key=..., "api_key": "...", token: ..., password=...
  [/\b((?:x-)?api[_-]?key|access[_-]?token|refresh[_-]?token|client[_-]?secret|secret|token|password|passwd|authorization|xi-api-key)(["']?\s*[:=]\s*["']?)[^\s"',;&}]{4,}/gi, '$1$2[hidden]'],
  // Well-known key shapes: OpenAI/Anthropic/OpenRouter style, Google, NVIDIA, GitHub, Slack
  [/\b(?:sk|pk|rk)-[A-Za-z0-9_-]{16,}/g, '[hidden-key]'],
  [/\bAIza[0-9A-Za-z_-]{30,}/g, '[hidden-key]'],
  [/\bnvapi-[A-Za-z0-9_-]{20,}/g, '[hidden-key]'],
  [/\bgh[pousr]_[A-Za-z0-9]{30,}/g, '[hidden-key]'],
  [/\bxox[abp]-[A-Za-z0-9-]{10,}/g, '[hidden-key]'],
  // Credentials inside a URL (the Riot client's riot:password@127.0.0.1)
  [/(\/\/[^/\s:@]+:)[^@\s/]+@/g, '$1[hidden]@']
]

export function redact(text: string): string {
  let out = text
  for (const [pattern, replacement] of SECRETS) out = out.replace(pattern, replacement)
  if (HOME) out = out.replace(HOME, '~')
  if (USER_IN_PATH) out = out.replace(USER_IN_PATH, '$1<user>')
  return out
}

export function pushLog(level: LogLevel, source: LogLine['source'], raw: string): void {
  let text = redact(raw)
  if (text.length > MAX_LINE_LENGTH) text = `${text.slice(0, MAX_LINE_LENGTH)} …[${text.length - MAX_LINE_LENGTH} more chars]`
  const line: LogLine = { id: nextId++, time: Date.now(), level, source, text }
  lines.push(line)
  if (lines.length > MAX_LINES) lines.splice(0, lines.length - MAX_LINES)
  for (const listener of listeners) {
    try {
      listener(line)
    } catch {
      // A listener that breaks must not break logging (and must not log about it)
    }
  }
}

export function recentLogs(): LogLine[] {
  return lines.slice()
}

/** Calls back with every new line; returns the function that stops it */
export function onLog(listener: (line: LogLine) => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const pad = (n: number, size = 2): string => String(n).padStart(size, '0')

export function formatLogLine(line: LogLine): string {
  const d = new Date(line.time)
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`
  const level = line.level === 'log' || line.level === 'info' ? '' : ` ${line.level.toUpperCase()}`
  const source = line.source === 'window' ? ' [window]' : ''
  return `${time}${level}${source} ${line.text}`
}

if (!(console as { __captured?: boolean }).__captured) {
  ;(console as { __captured?: boolean }).__captured = true
  for (const method of ['log', 'info', 'warn', 'error', 'debug'] as LogLevel[]) {
    const original = console[method].bind(console)
    console[method] = (...args: unknown[]): void => {
      original(...args)
      try {
        // util.format keeps the stack of an Error and the %s placeholders, like the terminal shows them
        pushLog(method, 'main', format(...args))
      } catch {
        // Logging never throws
      }
    }
  }
}
