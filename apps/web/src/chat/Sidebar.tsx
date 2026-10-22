import { ChevronDownIcon, EllipsisIcon, GlobeIcon, LogOutIcon, MessageSquareIcon, MoonIcon, PanelLeftIcon, PencilIcon, PlusIcon, SettingsIcon, SunIcon, TrashIcon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router'
import { useAuth } from '../auth/context'
import { setLanguage } from '../lib/i18n'
import type { Conversation } from '../lib/types'
import { useTheme } from '../lib/theme'
import { Avatar, Logo } from '../ui/Logo'
import { Menu, iconButton } from '../ui/Menu'

type Props = {
  conversations: Conversation[]
  loading: boolean
  error: string | null
  onNewChat(): void
  /** Mở hộp thoại đổi tên */
  onRename(conversation: Conversation): void
  /** Mở hộp thoại xác nhận xoá */
  onDelete(conversation: Conversation): void
  onNavigate(): void
  /** Thu gọn sidebar (desktop) / đóng ngăn kéo (mobile) */
  onCollapse(): void
}

export function Sidebar({ conversations, loading, error, onNewChat, onRename, onDelete, onNavigate, onCollapse }: Props) {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const { t, i18n } = useTranslation('sidebar')
  const otherLanguage = i18n.resolvedLanguage === 'en' ? 'vi' : 'en'
  const [listOpen, setListOpen] = useState(true)

  return (
    <aside className="flex h-full w-72 flex-col border-r border-slate-200 bg-white dark:border-night-700 dark:bg-night-950">
      <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
        <Logo size={28} />
        <span className="flex-1 font-semibold tracking-tight">LLM Chat</span>
        <button type="button" onClick={onCollapse} className={iconButton} aria-label={t('collapse')} title={t('collapse')}>
          <PanelLeftIcon size={16} />
        </button>
      </div>

      <div className="px-3 pb-2">
        <button
          type="button"
          onClick={onNewChat}
          className="flex w-full items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2.5 text-sm font-medium text-indigo-600 transition hover:bg-indigo-100 dark:bg-indigo-500 dark:text-white dark:hover:bg-indigo-600"
        >
          <PlusIcon size={16} />
          {t('newChat')}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label={t('history')}>
        <button
          type="button"
          onClick={() => setListOpen((o) => !o)}
          aria-expanded={listOpen}
          className="flex w-full items-center justify-between px-2 pt-1 pb-2 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        >
          {t('conversations')}
          <ChevronDownIcon size={14} className={`transition ${listOpen ? 'rotate-180' : ''}`} />
        </button>

        {listOpen && (
          <>
            {loading && <p className="px-2 py-1 text-sm text-slate-500">{t('loading')}</p>}
            {error && <p className="px-2 py-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
            {!loading && !error && conversations.length === 0 && (
              <p className="px-2 py-1 text-sm text-slate-500">{t('empty')}</p>
            )}
            <ul className="space-y-0.5">
              {conversations.map((c) => (
                <li key={c.id} className="group relative">
                  <NavLink
                    to={`/c/${c.id}`}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 rounded-lg py-2 pr-10 pl-2.5 text-sm transition ${
                        isActive
                          ? 'bg-indigo-50 font-medium text-indigo-700 dark:bg-night-800 dark:text-white'
                          : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-night-850'
                      }`
                    }
                    title={c.title}
                  >
                    <MessageSquareIcon size={15} className="shrink-0 opacity-70" />
                    <span className="truncate">{c.title}</span>
                  </NavLink>
                  <div className="absolute top-1/2 right-1 -translate-y-1/2 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100 has-aria-expanded:opacity-100">
                    <Menu
                      label={t('optionsFor', { title: c.title })}
                      // Mở xuống dưới, lệch sang phải (mép trái menu thẳng mép trái nút ⋯) như ChatGPT
                      side="bottom"
                      align="start"
                      trigger={<EllipsisIcon size={16} />}
                      triggerClassName="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-night-700"
                      items={[
                        { label: t('rename'), icon: <PencilIcon size={15} />, onSelect: () => onRename(c) },
                        { label: t('delete'), icon: <TrashIcon size={15} />, danger: true, onSelect: () => onDelete(c) },
                      ]}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>

      <div className="flex items-center gap-3 border-t border-slate-200 px-4 py-3 dark:border-night-700">
        <Avatar name={user?.displayName} size={34} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user?.displayName}</p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
        </div>
        <Menu
          label={t('settings')}
          side="top"
          trigger={<SettingsIcon size={16} />}
          triggerClassName={iconButton}
          items={[
            {
              label: t(theme === 'dark' ? 'lightMode' : 'darkMode'),
              icon: theme === 'dark' ? <SunIcon size={15} /> : <MoonIcon size={15} />,
              onSelect: toggle,
            },
            {
              label: t(`common:language.${otherLanguage}`),
              icon: <GlobeIcon size={15} />,
              onSelect: () => setLanguage(otherLanguage),
            },
            { label: t('logout'), icon: <LogOutIcon size={15} />, danger: true, onSelect: logout },
          ]}
        />
      </div>
    </aside>
  )
}
