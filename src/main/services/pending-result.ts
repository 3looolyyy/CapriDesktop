/**
 * Result of a finished task (a project's index.html, a folder...) waiting to be opened.
 * Agents queue it instead of opening it themselves; the agent manager opens it once Capri
 * has told the user, so the new window doesn't replace what the user was looking at.
 */

import { shell } from 'electron'

let pending: string | null = null

export function queueResult(target: string): void {
  pending = target
}

export function hasPendingResult(): boolean {
  return pending !== null
}

/** Opens the queued result (if any) and clears it */
export function openPendingResult(): void {
  const target = pending
  pending = null
  if (target) shell.openPath(target).catch(() => {})
}
