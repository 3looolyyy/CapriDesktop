/**
 * Renderer side of the `{name}` placeholder: how Capri calls the user.
 * The name lives in the main process (capri_consciousness.json) and is cached here.
 */

let currentName = 'choom'
let initialized = false

export function initUserName(): void {
  if (initialized || !window.api?.companion?.getUserProfile) return
  initialized = true
  window.api.companion
    .getUserProfile()
    .then((p) => {
      if (p?.name) currentName = p.name
    })
    .catch(() => {})
  window.api.companion.onUserNameChanged?.((name) => {
    if (name) currentName = name
  })
}

export function getUserName(): string {
  return currentName
}

export function personalize<T extends string | null | undefined>(text: T): T {
  if (!text) return text
  return text.replace(/\{name\}/g, currentName) as T
}
