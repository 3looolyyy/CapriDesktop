/** The user's name. Text uses a `{name}` placeholder that is filled in on output and in LLM prompts. */

import { consciousnessService } from './consciousness-service'

export const DEFAULT_USER_NAME = 'choom'

export function getUserName(): string {
  return consciousnessService.getUserName() || DEFAULT_USER_NAME
}

/** Replaces the `{name}` placeholder with the configured user name. */
export function personalize<T extends string | undefined | null>(text: T): T {
  if (!text) return text
  return text.replace(/\{name\}/g, getUserName()) as T
}

/** Same as personalize() but safe inside an already serialized JSON string (e.g. a fetch body). */
export function personalizeJson(json: string): string {
  const escaped = JSON.stringify(getUserName()).slice(1, -1)
  return json.replace(/\{name\}/g, escaped)
}

/** JSON body for a local LLM request with the {name} placeholder filled in. */
export function llmBody(payload: unknown): string {
  return personalizeJson(JSON.stringify(payload))
}
