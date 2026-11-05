/**
 * Where her heavy requirements go: voice environment, Whisper, Ollama and its models. They weigh
 * several GB, and C: is often the smallest disk. Empty means the default places.
 */

import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

const settingsFile = (): string => path.join(app.getPath('userData'), 'capri_storage.json')

export function getStorageRoot(): string | null {
  try {
    const root = JSON.parse(fs.readFileSync(settingsFile(), 'utf-8')).root
    return typeof root === 'string' && root ? root : null
  } catch {
    return null
  }
}

export function setStorageRoot(root: string | null): void {
  fs.writeFileSync(settingsFile(), JSON.stringify({ root }, null, 2), 'utf-8')
}

/** A folder inside the chosen location, or null when the default place applies */
export function storageDir(name: string): string | null {
  const root = getStorageRoot()
  return root ? path.join(root, name) : null
}
