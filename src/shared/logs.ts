export type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug'

/** One line Capri logged, from the main process or one of her windows (keys and home folder already hidden) */
export interface LogLine {
  id: number
  time: number
  level: LogLevel
  source: 'main' | 'window'
  text: string
}

export interface BugReportResult {
  success: boolean
  chars: number
  lines: number
  truncated: boolean
}

export { ISSUES_URL } from './links'
