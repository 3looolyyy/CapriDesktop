/** The language of Capri's fixed lines on this side of the app. The companion window keeps it updated */
let current = 'en'

export const getLineLanguage = (): string => current

export function setLineLanguage(lang: string | null | undefined): void {
  current = lang || 'en'
}
