import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import { commentMinutes } from '../../shared/mac-feature-policy'
import { voiceDataDir, speechModelsDir } from './app-paths'
export function featureSettings() {
  let screenCommentMinutes=0
  let speechModel:'base'|'small'='base'
  try { screenCommentMinutes=commentMinutes(JSON.parse(fs.readFileSync(path.join(app.getPath('userData'),'mac-features.json'),'utf8')).screenCommentMinutes) } catch {}
  try { if(JSON.parse(fs.readFileSync(path.join(voiceDataDir(),'speech-recognition.json'),'utf8')).model==='small') speechModel='small' } catch {}
  const root=path.join(speechModelsDir(),`models--Systran--faster-whisper-${speechModel}`,'snapshots')
  let speechReady=false
  try { speechReady=fs.readdirSync(root).some(dir=>fs.existsSync(path.join(root,dir,'model.bin'))) } catch {}
  return {screenCommentMinutes,speechModel,speechReady}
}
export function saveFeatures(update: {screenCommentMinutes?:number;speechModel?:'base'|'small'}) {
  const previous=featureSettings()
  if(update.screenCommentMinutes!==undefined) {
    const minutes=commentMinutes(update.screenCommentMinutes)
    fs.writeFileSync(path.join(app.getPath('userData'),'mac-features.json'),JSON.stringify({screenCommentMinutes:minutes}))
  }
  if(update.speechModel!==undefined) {
    if(!['base','small'].includes(update.speechModel)) throw new Error('Invalid speech model')
    fs.writeFileSync(path.join(voiceDataDir(),'speech-recognition.json'),JSON.stringify({model:update.speechModel}))
  }
  return {...previous,...featureSettings()}
}
