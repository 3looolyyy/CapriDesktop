import React from 'react'
import { ExternalLink, GitPullRequest, Users } from 'lucide-react'
import collaboratorsData from '../data/collaborators.json'
import { useT } from '../utils/useUiLang'

/** Someone whose code is in Capri: their GitHub account, their name and what they built */
interface Collaborator {
  login: string
  name?: string
  work?: string[]
}

const collaborators: Collaborator[] = (collaboratorsData as Collaborator[]).filter((c) => c?.login)

/** Everyone who wrote part of Capri on GitHub. Clicking a name opens their profile */
export const CollaboratorsPanel: React.FC = () => {
  const t = useT()

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--cp-red-line)] shrink-0">
        <span className="cp-title text-[18px] text-[var(--cp-red)] flex items-center gap-2">
          <Users size={16} /> {t('collab_title')}
        </span>
        <span className="text-[12px] text-[var(--cp-muted)]">{collaborators.length}</span>
      </div>

      <div className="cp-scroll flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
        <p className="text-[13px] text-[var(--cp-muted)]">{t('collab_intro')}</p>

        {collaborators.length === 0 ? (
          <p className="text-[13px] text-[var(--cp-muted)] py-6 text-center">{t('collab_empty')}</p>
        ) : (
          <ul className="grid grid-cols-2 gap-2">
            {collaborators.map((c) => (
              <li key={c.login}>
                <button
                  type="button"
                  onClick={() => void window.api.game.openExternal(`https://github.com/${encodeURIComponent(c.login)}`)}
                  title={t('collab_open')}
                  className="cp-cut w-full h-full flex flex-col gap-1.5 px-3 py-2.5 text-left border bg-[#210f10] border-[#3c1c1d] text-stone-200 hover:text-white hover:border-[#612f30] transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2 w-full">
                    <GitPullRequest size={12} className="shrink-0 text-cyan-400" />
                    <span className="truncate font-semibold text-[14px]">{c.name || c.login}</span>
                    <ExternalLink size={11} className="ml-auto shrink-0 text-[var(--cp-muted)]" />
                  </span>
                  <span className="text-[12px] text-[var(--cp-muted)]">@{c.login}</span>
                  {!!c.work?.length && (
                    <ul className="text-[12px] text-stone-400 list-disc pl-4 space-y-0.5">
                      {c.work.map((w) => (
                        <li key={w}>{w}</li>
                      ))}
                    </ul>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={() => void window.api.game.openExternal('https://github.com/nunezValen/CapriDesktop')}
          className="flex items-center gap-1.5 text-[13px] text-cyan-400 hover:text-cyan-300 cursor-pointer"
        >
          <ExternalLink size={13} /> {t('collab_join')}
        </button>
      </div>
    </div>
  )
}
