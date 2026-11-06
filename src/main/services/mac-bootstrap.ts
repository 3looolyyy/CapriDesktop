// Run before services read configuration or voice environment paths.
import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import { legacyUserDataDir } from './legacy-data'

if (process.platform === 'darwin') {
  app.setName('Capri Desktop')
  const override = app.commandLine.getSwitchValue('user-data-dir')
  const legacy = override ? null : legacyUserDataDir(app.getPath('appData'), app.isPackaged, fs.existsSync)
  app.setPath('userData', override ? path.resolve(override) : legacy || path.join(app.getPath('appData'), 'Capri Desktop'))
}
