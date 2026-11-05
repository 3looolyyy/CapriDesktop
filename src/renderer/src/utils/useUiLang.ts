import { useEffect, useMemo, useState } from 'react'
import { toUiLang, translator, Translate, UiLang } from '../i18n'

export { toUiLang }
export type { UiLang }

/** Follows Capri's effective language (the fixed one from the settings, or the auto-detected one) */
export function useUiLang(): UiLang {
  const [lang, setLang] = useState<UiLang>('en')
  useEffect(() => {
    window.api?.companion
      ?.getLanguage?.()
      .then((l: string) => l && setLang(toUiLang(l)))
      .catch(() => {})
    const unsub = window.api?.companion?.onLanguageChanged?.((l: string) => setLang(toUiLang(l)))
    return () => unsub?.()
  }, [])
  return lang
}

/** Interface strings in Capri's current language */
export function useT(): Translate {
  const lang = useUiLang()
  return useMemo(() => translator(lang), [lang])
}
