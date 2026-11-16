import React, { useEffect, useMemo, useState } from 'react'
import { CircleHelp, Play, Search } from 'lucide-react'
import { useT, useUiLang } from '../utils/useUiLang'
import { useAgentStore } from '../stores/useAgentStore'
import { CAPABILITIES, CATEGORY_TITLES, asHelpLang, capabilityAvailable, capabilityHowTo, type CapabilityCategory } from '../../../shared/capabilities'
import type { Hotkeys } from '../../../shared/hotkeys'

const ORDER: CapabilityCategory[] = ['move', 'voice', 'screen', 'gaming', 'party', 'music', 'pc', 'memory', 'create', 'app']

/** Trying these would leave something behind: a saved memory, another language, a match queued */
const NO_TRY = new Set(['memory', 'language', 'valorant', 'league'])

/** Everything Capri can do, from the same catalog she answers help questions with, with a button to try each one */
export const HelpPanel: React.FC<{ isMac: boolean }> = ({ isMac }) => {
  const t = useT()
  const lang = asHelpLang(useUiLang())
  const { projectPath } = useAgentStore()
  const [hotkeys, setHotkeys] = useState<Partial<Hotkeys>>({})
  const [query, setQuery] = useState('')
  const [tried, setTried] = useState<string | null>(null)
  const platform = isMac ? 'darwin' : /Linux/i.test(navigator.userAgent) ? 'linux' : 'win32'

  useEffect(() => {
    window.api.voice
      .getHotkeys()
      .then(setHotkeys)
      .catch(() => {})
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return CAPABILITIES.filter((cap) => !q || `${cap.text[lang][0]} ${capabilityHowTo(cap, lang, hotkeys, platform)}`.toLowerCase().includes(q))
  }, [query, lang, hotkeys, platform])

  const tryIt = (id: string, phrase: string): void => {
    setTried(id)
    void window.api.agent.sendPrompt(phrase, projectPath, undefined, 'pet')
    setTimeout(() => setTried((current) => (current === id ? null : current)), 3000)
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center px-5 py-3.5 border-b border-[var(--cp-red-line)] shrink-0">
        <span className="cp-title text-[18px] text-[var(--cp-red)] flex items-center gap-2">
          <CircleHelp size={16} /> {t('help_title')}
        </span>
      </div>
      <div className="cp-scroll flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
        <p className="text-[13px] text-[var(--cp-muted)]">{t('help_intro')}</p>
        <label className="flex items-center gap-2 px-3 py-2 bg-black/60 border border-stone-800">
          <Search size={13} className="text-[var(--cp-muted)] shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('help_search')}
            className="flex-1 bg-transparent outline-none text-[13px] text-stone-200 placeholder:text-stone-600 select-text"
          />
        </label>

        {filtered.length === 0 && <p className="text-[13px] text-[var(--cp-muted)] py-4 text-center">{t('help_noResults')}</p>}

        {ORDER.map((category) => {
          const caps = filtered.filter((c) => c.category === category)
          if (!caps.length) return null
          return (
            <section key={category} className="space-y-2">
              <h3 className="cp-label">{CATEGORY_TITLES[category][lang]}</h3>
              {caps.map((cap) => {
                const available = capabilityAvailable(cap, platform)
                const phrase = NO_TRY.has(cap.id) ? undefined : (cap.say[lang] ?? cap.say.en)?.[0]
                return (
                  <div key={cap.id} className={`p-3 bg-black/60 border border-stone-800 ${available ? '' : 'opacity-60'}`}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-[14px] text-stone-200">{cap.text[lang][0]}</span>
                      {!available ? (
                        <span className="text-[11px] text-[var(--cp-muted)] shrink-0">{t('help_notHere')}</span>
                      ) : (
                        phrase && (
                          <button
                            type="button"
                            onClick={() => tryIt(cap.id, phrase)}
                            title={phrase}
                            className="cp-cut shrink-0 flex items-center gap-1.5 px-2.5 py-1 text-[12px] border border-[#612f30] bg-[#3c1c1d] text-white hover:bg-[#4a2223] cursor-pointer"
                          >
                            <Play size={11} /> {tried === cap.id ? t('help_sent') : t('help_try')}
                          </button>
                        )
                      )}
                    </div>
                    <p className="mt-1 text-[13px] text-stone-400 leading-snug">{capabilityHowTo(cap, lang, hotkeys, platform)}</p>
                  </div>
                )
              })}
            </section>
          )
        })}
      </div>
    </div>
  )
}
