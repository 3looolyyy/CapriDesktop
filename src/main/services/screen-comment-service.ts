import { FRIEND_SCREEN_COMMENT, friendScreenComment } from '../../shared/screen-comment-style'
import { powerMonitor, systemPreferences } from 'electron'
import { featureSettings, saveFeatures } from './mac-feature-settings'
import { isCloudMode, describeCloudImage } from './llm-gateway'
import { scannerService } from './scanner-service'
import { agentManager } from '../agents/agent-manager'
import { isMac } from './platform'
let timer:NodeJS.Timeout|null=null
let generation=0
let busy=false
let locked=false
export function startScreenComments() {
  if(!isMac) return
  powerMonitor.on('lock-screen',()=>{locked=true;generation++})
  powerMonitor.on('unlock-screen',()=>{locked=false})
  powerMonitor.on('suspend',()=>{locked=true;generation++})
  powerMonitor.on('resume',()=>{locked=false})
  scheduleScreenComments()
}
export function scheduleScreenComments() {
  generation++
  if(timer) clearInterval(timer)
  timer=null
  const minutes=featureSettings().screenCommentMinutes
  if(!isMac || !minutes) return
  timer=setInterval(()=>{void tickScreenComment()},minutes*60000)
}
async function tickScreenComment() {
  const blocked=()=>locked || ['thinking','talking','curious','asustada'].includes(agentManager.getCompanionState()) || scannerService.getStatus().isScanning
  if(busy || blocked() || !featureSettings().screenCommentMinutes) return
  if(!isCloudMode() || systemPreferences.getMediaAccessStatus('screen')!=='granted') return
  busy=true
  const current=generation
  try {
    const capture=await scannerService.captureRegionBase64(true)
    if(!capture || generation!==current || blocked()) return
    const text=friendScreenComment(await describeCloudImage(capture.base64,FRIEND_SCREEN_COMMENT))
    if(text && generation===current && !blocked()) agentManager.setCompanionSpeech(text,Math.max(4500,Math.min(12000,text.length*65)),true)
  } catch {
    if(generation===current) {
      saveFeatures({screenCommentMinutes:0});scheduleScreenComments()
      agentManager.setCompanionSpeech('Automatic screen comments paused after an error. Check vision settings before enabling them again.',5000,false)
    }
  } finally {busy=false}
}
