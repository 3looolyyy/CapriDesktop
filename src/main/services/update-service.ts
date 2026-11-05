/**
 * Self-update and patch scripts.
 *
 * - "Capri, actualizate": checks the latest GitHub Release; if it's newer, downloads the
 *   installer, runs it silently and the app restarts on the new version. On Linux an AppImage replaces
 *   itself the same way; a .deb can't without the password, so she opens the release page instead.
 * - First run of a new version: Capri reads the patch scripts in scripts-capri/ for every
 *   version she skipped (one file per version and language, e.g. 0.2.0.es.txt).
 */

import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { spawn } from './hidden-process'
import { app, shell } from 'electron'
import { resourceRoot } from './app-paths'
import { isLinux } from './platform'
import { windowsUpdateScript } from './windows-update'
import { localizeLine } from '../../shared/lines'
import { consciousnessService } from './consciousness-service'
import { personalize } from './user-profile'
import { windowManager } from '../windows/window-manager'
import { IPC_CHANNELS } from '../ipc/channels'

const REPO = 'nunezValen/CapriDesktop'
const SCRIPT_FILE = /^(\d+\.\d+\.\d+)(?:\.(es|en))?\.txt$/i

type Lang = string

/** -1 / 0 / 1, comparing "1.2.3" style versions (a leading "v" is ignored) */
export function compareVersions(a: string, b: string): number {
  const pa = a.replace(/^v/i, '').split(/[.-]/).map((n) => parseInt(n, 10) || 0)
  const pb = b.replace(/^v/i, '').split(/[.-]/).map((n) => parseInt(n, 10) || 0)
  for (let i = 0; i < Math.max(pa.length, pb.length, 3); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0)
    if (d) return d > 0 ? 1 : -1
  }
  return 0
}

function scriptsDir(): string {
  return path.join(resourceRoot(), 'scripts-capri')
}

/** Versions that have a patch script, oldest first */
function scriptVersions(): string[] {
  try {
    const versions = new Set<string>()
    for (const f of fs.readdirSync(scriptsDir())) {
      const m = f.match(SCRIPT_FILE)
      if (m) versions.add(m[1])
    }
    return Array.from(versions).sort(compareVersions)
  } catch {
    return []
  }
}

/** The script for one version in the user's language (falls back to the other language) */
export function readPatchScript(version: string, lang: Lang): string | null {
  for (const name of [`${version}.${lang}.txt`, `${version}.txt`, `${version}.en.txt`, `${version}.es.txt`]) {
    const p = path.join(scriptsDir(), name)
    if (fs.existsSync(p)) {
      const text = fs.readFileSync(p, 'utf-8').replace(/\s+/g, ' ').trim()
      if (text) return text
    }
  }
  return null
}

function speechLang(): Lang {
  const s = consciousnessService.getLanguageSettings()
  return s.speechLang && s.speechLang !== 'auto' ? s.speechLang : consciousnessService.getPreferredLanguage()
}

/** Speaks a line through the companion (bubble + voice) */
function speak(text: string): void {
  const durationMs = Math.min(60000, Math.max(5000, text.length * 75))
  windowManager.broadcast(IPC_CHANNELS.COMPANION_SPEECH_CHANGED, { text: personalize(localizeLine(text, speechLang())), durationMs, speakVoice: true })
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Rough time a spoken line takes, so the next one doesn't cut it off */
const speakTime = (text: string) => Math.max(5000, text.length * 70 + 2000)

class UpdateService {
  private busy = false

  /** On the first run of a newer version, read the scripts of every version that was skipped */
  public async announcePatchNotesIfUpdated(): Promise<void> {
    const current = app.getVersion()
    const last = consciousnessService.getLastRunVersion()
    consciousnessService.setLastRunVersion(current)
    // Fresh install (or the setup wizard is still pending): nothing to compare against
    if (!last || !consciousnessService.isOnboardingDone()) return
    if (compareVersions(current, last) <= 0) return

    const lang = speechLang()
    const skipped = scriptVersions().filter((v) => compareVersions(v, last) > 0 && compareVersions(v, current) <= 0)
    console.log(`[UpdateService] updated ${last} -> ${current}, patch scripts: ${skipped.join(', ') || 'none'}`)
    for (const v of skipped) {
      const script = readPatchScript(v, lang)
      if (!script) continue
      speak(script)
      await wait(speakTime(script))
    }
  }

  /** "¿Qué hay de nuevo?": the script of the version that's running */
  public whatsNew(lang: Lang): string {
    const current = app.getVersion()
    const script = readPatchScript(current, lang)
    if (script) return script
    return lang === 'es'
      ? `[curious] Estoy en la versión ${current}, pero no tengo notas de este parche, choomba.`
      : `[curious] I'm on version ${current}, but there are no notes for this patch, choomba.`
  }

  /** Checks GitHub Releases; if there's a newer version, downloads it, installs it and restarts */
  public async checkAndInstall(lang: Lang): Promise<void> {
    const es = lang === 'es'
    if (this.busy) return
    this.busy = true
    // Let the first "let me check" line play before speaking again
    const started = Date.now()
    const sayAfterIntro = async (text: string) => {
      const left = 4500 - (Date.now() - started)
      if (left > 0) await wait(left)
      speak(text)
    }

    try {
      const current = app.getVersion()
      const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
        headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'CapriDesktop-Updater' }
      })
      if (res.status === 404) {
        await sayAfterIntro(
          es
            ? `[curious] Todavía no hay ninguna versión publicada, choomba. Estoy en la ${current}.`
            : `[curious] No version has been published yet, choomba. I'm on ${current}.`
        )
        return
      }
      if (!res.ok) throw new Error(`GitHub respondió ${res.status}`)
      const release = (await res.json()) as {
        tag_name?: string
        html_url?: string
        assets?: { name: string; size: number; browser_download_url: string }[]
      }
      const latest = String(release.tag_name || '').replace(/^v/i, '')

      if (!latest || compareVersions(latest, current) <= 0) {
        await sayAfterIntro(
          es
            ? `[happy] Ya estoy en la última versión, la ${current}. [playful] Más actualizada imposible, choomba.`
            : `[happy] I'm already on the latest version, ${current}. [playful] Can't get any fresher, choomba.`
        )
        return
      }

      if (!app.isPackaged) {
        await sayAfterIntro(
          es
            ? `[excited] Hay una versión nueva, la ${latest}. [curious] Pero estoy corriendo desde el código: hacé git pull y reiniciame.`
            : `[excited] There's a new version, ${latest}. [curious] But I'm running from source: git pull and restart me.`
        )
        return
      }

      const assets = release.assets || []
      // Installed from a .deb or another package: updating it needs the user's password
      if (isLinux && !process.env.APPIMAGE) {
        await sayAfterIntro(
          es
            ? `[excited] ¡Salió la versión ${latest}! [curious] Te abro la página para que bajes el paquete, porque instalarlo necesita tu contraseña.`
            : `[excited] Version ${latest} is out! [curious] I'm opening the page so you can grab the package, since installing it needs your password.`
        )
        if (release.html_url) await shell.openExternal(release.html_url)
        return
      }
      const asset = isLinux
        ? assets.find((a) => /\.AppImage$/i.test(a.name))
        : assets.find((a) => /setup.*\.exe$/i.test(a.name)) || assets.find((a) => /\.exe$/i.test(a.name))
      if (!asset) {
        await sayAfterIntro(
          es
            ? `[worried] Salió la ${latest}, pero el release no tiene instalador para ${isLinux ? 'Linux' : 'Windows'}.`
            : `[worried] Version ${latest} is out, but the release has no ${isLinux ? 'Linux' : 'Windows'} installer.`
        )
        return
      }

      await sayAfterIntro(
        es
          ? `[excited] ¡Salió la versión ${latest}! Me la bajo, dame un toque.`
          : `[excited] Version ${latest} is out! Downloading it, give me a sec.`
      )

      // Next to the running AppImage: a rename only replaces it in place within the same disk
      const exe = isLinux ? `${process.env.APPIMAGE}.new` : path.join(os.tmpdir(), asset.name)
      await download(asset.browser_download_url, exe)
      const size = fs.statSync(exe).size
      if (asset.size && size !== asset.size) throw new Error(`descarga incompleta (${size} de ${asset.size} bytes)`)

      const bye = es
        ? `[happy] ¡Listo, ya la tengo! [playful] Me reinicio y vuelvo en un toque. [giggles] No me extrañes.`
        : `[happy] Got it! [playful] Restarting, I'll be right back. [giggles] Don't miss me.`
      speak(bye)
      await wait(speakTime(bye))

      if (isLinux) {
        const current = process.env.APPIMAGE as string
        fs.chmodSync(exe, 0o755)
        fs.renameSync(exe, current)
        spawn(current, ['--updated'], { detached: true, stdio: 'ignore' }).unref()
      } else {
        // Silent NSIS install over the current one; --force-run reopens the app when it finishes
        spawn(
          'powershell.exe',
          ['-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-ExecutionPolicy', 'Bypass', '-Command', windowsUpdateScript(exe, process.execPath)],
          { detached: true, stdio: 'ignore', windowsHide: true }
        ).unref()
      }
      setTimeout(() => app.quit(), 1500)
    } catch (err: any) {
      console.warn('[UpdateService] update failed:', err)
      await sayAfterIntro(
        es
          ? `[worried] No pude actualizarme: ${err?.message || err}. Probá de nuevo en un rato.`
          : `[worried] I couldn't update: ${err?.message || err}. Try again in a bit.`
      )
    } finally {
      this.busy = false
    }
  }
}

async function download(url: string, dest: string): Promise<void> {
  const res = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'CapriDesktop-Updater' } })
  if (!res.ok || !res.body) throw new Error(`la descarga respondió ${res.status}`)
  const out = fs.createWriteStream(dest)
  const reader = res.body.getReader()
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    if (!out.write(Buffer.from(value))) await new Promise<void>((r) => out.once('drain', () => r()))
  }
  await new Promise<void>((resolve, reject) => out.end((err?: Error | null) => (err ? reject(err) : resolve())))
}

export const updateService = new UpdateService()
