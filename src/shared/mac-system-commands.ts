export type MacSystemAction =
  | {action:'battery'|'storage'|'system-info'|'get-volume'|'mute'|'unmute'}
  | {action:'set-volume'|'change-volume';value:number}
  | {action:'folder'|'settings';name:string}
export const MAC_SETTINGS:Record<string,string>={
  sound:'com.apple.preference.sound',display:'com.apple.preference.displays',displays:'com.apple.preference.displays',
  wifi:'com.apple.wifi-settings-extension','wi-fi':'com.apple.wifi-settings-extension',bluetooth:'com.apple.BluetoothSettings',
  battery:'com.apple.preference.battery',keyboard:'com.apple.preference.keyboard',mouse:'com.apple.preference.mouse',
  trackpad:'com.apple.preference.trackpad',accessibility:'com.apple.preference.universalaccess',
  privacy:'com.apple.preference.security',general:'com.apple.systempreferences',
}
export function parseMacSystemCommand(raw:string):MacSystemAction|null {
  const text=raw.toLowerCase().trim().replace(/[?!.,]+$/,'').replace(/^hey\s+capri[, ]*/,'').replace(/^(?:please\s+|can you\s+|could you\s+)/,'').replace(/\s+please$/,'')
  if(/^(?:(?:what(?:'s| is)|check|show(?: me)?) (?:my |the )?)?(?:battery(?: level| status| percentage)?|how much battery(?: do i have)?(?: left)?)$/.test(text)) return {action:'battery'}
  if(/^(?:how much (?:free )?(?:disk|storage) (?:space )?(?:do i have|is left)|(?:check|show(?: me)?) (?:my |the )?(?:free )?(?:disk|storage) (?:space|status)|how much space is left)$/.test(text)) return {action:'storage'}
  if(/^(?:what (?:macos|mac os) version (?:am i (?:on|using)|is this)|(?:show|check) (?:my )?(?:mac|system) (?:info|information)|about (?:my |this )?mac)$/.test(text)) return {action:'system-info'}
  if(/^(?:what(?:'s| is) (?:my |the )?(?:system )?volume(?: level)?|check (?:the )?volume)$/.test(text)) return {action:'get-volume'}
  if(/^(?:mute (?:the )?(?:system|sound|speakers|volume|mac)|turn (?:the )?(?:sound|system volume) off)$/.test(text)) return {action:'mute'}
  if(/^(?:unmute (?:the )?(?:system|sound|speakers|volume|mac)|turn (?:the )?(?:sound|system volume) on)$/.test(text)) return {action:'unmute'}
  const level=text.match(/^(?:set|turn|change) (?:the )?(?:system )?volume (?:to )?(-?\d+(?:\.\d+)?)\s*(?:%|percent)?$/)
  if(level) return {action:'set-volume',value:Number(level[1])}
  if(/^(?:turn (?:the )?volume up|increase (?:the )?volume|volume up)$/.test(text)) return {action:'change-volume',value:10}
  if(/^(?:turn (?:the )?volume down|decrease (?:the )?volume|volume down)$/.test(text)) return {action:'change-volume',value:-10}
  const folder=text.match(/^(?:open|show(?: me)?) (?:my |the )?(downloads|documents|desktop|home)(?: folder)?$/)
  if(folder) return {action:'folder',name:folder[1]}
  const settings=text.match(/^(?:open|show(?: me)?|take me to) (?:the )?(sound|display|displays|wi-?fi|bluetooth|battery|keyboard|mouse|trackpad|accessibility|privacy|general) settings$/)
  if(settings) return {action:'settings',name:settings[1]}
  if(/^(?:open|show(?: me)?) (?:system settings|system preferences)$/.test(text)) return {action:'settings',name:'general'}
  return null
}
