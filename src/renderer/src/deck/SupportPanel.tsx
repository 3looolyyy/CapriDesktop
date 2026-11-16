import React from 'react'
import { Coffee, ExternalLink, HandHeart } from 'lucide-react'
import { useT } from '../utils/useUiLang'
import { GITHUB_URL, KOFI_URL, X_URL } from '../../../shared/links'

/** The X logo: lucide has no brand icon for it */
const XLogo: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

/** The GitHub mark: this lucide version has no brand icons */
const GithubLogo: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.4-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
  </svg>
)

const open = (url: string): void => void window.api.game.openExternal(url)

/** How to support Capri (Ko-fi) and where to follow her */
export const SupportPanel: React.FC = () => {
  const t = useT()

  const links = [
    { id: 'kofi', url: KOFI_URL, icon: <Coffee size={18} />, title: t('support_kofi'), help: t('support_kofiHelp'), accent: true },
    { id: 'x', url: X_URL, icon: <XLogo size={16} />, title: t('support_x'), help: t('support_xHelp'), accent: false },
    { id: 'github', url: GITHUB_URL, icon: <GithubLogo size={17} />, title: t('support_github'), help: t('support_githubHelp'), accent: false }
  ]

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center px-5 py-3.5 border-b border-[var(--cp-red-line)] shrink-0">
        <span className="cp-title text-[18px] text-[var(--cp-red)] flex items-center gap-2">
          <HandHeart size={16} /> {t('support_title')}
        </span>
      </div>
      <div className="cp-scroll flex-1 min-h-0 overflow-y-auto p-5 space-y-3">
        <p className="text-[13px] text-[var(--cp-muted)]">{t('support_intro')}</p>
        {links.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => open(l.url)}
            className={`cp-cut w-full flex items-center gap-3 px-4 py-3 text-left border transition-colors cursor-pointer ${
              l.accent ? 'bg-[#3c1c1d] border-[#612f30] hover:bg-[#4a2223] text-white' : 'bg-[#210f10] border-[#3c1c1d] hover:border-[#612f30] text-stone-200'
            }`}
          >
            <span className={l.accent ? 'text-cp-400' : 'text-cyan-400'}>{l.icon}</span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-[14px]">{l.title}</span>
              <span className="block text-[12px] text-[var(--cp-muted)]">{l.help}</span>
            </span>
            <ExternalLink size={13} className="shrink-0 text-[var(--cp-muted)]" />
          </button>
        ))}
      </div>
    </div>
  )
}
