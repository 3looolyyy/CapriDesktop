/**
 * The app used to be called Cyber Companion, and its name decides the folder of the user's data:
 * memories, macros, voice settings and the Python environment. Whoever already has that folder keeps
 * using it, so renaming the app doesn't look like a fresh install.
 */

import * as path from 'path'

export function legacyUserDataDir(appData: string, isPackaged: boolean, exists: (dir: string) => boolean): string | null {
  // Installed, the name came from productName; running from source, from package.json
  const dir = path.join(appData, isPackaged ? 'Cyber Companion' : 'cyber-companion')
  return exists(dir) ? dir : null
}
