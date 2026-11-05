import { assetPath } from '../services/app-paths'
import { BrowserWindow, app } from 'electron'
import { join } from 'path'
import { windowManager } from './window-manager'

export function createDeckWindow(): BrowserWindow {
  const preloadPath = join(__dirname, '../preload/index.mjs')
  const iconPath = assetPath('icon.png')

  const deckWindow = new BrowserWindow({
    title: 'Capricorn // Dev Deck',
    icon: iconPath,
    width: 1040,
    height: 720,
    minWidth: 840,
    minHeight: 580,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#07080e',
    webPreferences: {
      preload: preloadPath,
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // Hash route for dev deck view
  const devUrl = process.env['ELECTRON_RENDERER_URL']
  if (!app.isPackaged && devUrl) {
    deckWindow.loadURL(`${devUrl}#/deck`)
  } else {
    deckWindow.loadFile(join(__dirname, '../renderer/index.html'), {
      hash: 'deck'
    })
  }

  // Intercept close: hide deck and restore desktop companion
  deckWindow.on('close', (event) => {
    if (!(app as unknown as { isQuitting?: boolean }).isQuitting) {
      event.preventDefault()
      windowManager.hideDeck()
    }
  })

  return deckWindow
}
