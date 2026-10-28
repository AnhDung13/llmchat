import { ChevronDownIcon, EllipsisIcon, GlobeIcon, LogOutIcon, MoonIcon, PanelLeftIcon, PencilIcon, SettingsIcon, SquarePenIcon, SunIcon, TrashIcon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router'
import { useAuth } from '../auth/context'
import { setLanguage } from '../lib/i18n'
import type { Conversation } from '../lib/types'
import { useTheme } from '../lib/theme'
import { Avatar, BrandName } from '../ui/Logo'
import { MarqueeText } from '../ui/MarqueeText'
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

const rowHover = 'hover:bg-violet-100/60 dark:hover:bg-violet-500/10'

export function Sidebar({ conversations, loading, error, onNewChat, onRename, onDelete, onNavigate, onCollapse }: Props) {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const { t, i18n } = useTranslation('sidebar')
  const otherLanguage = i18n.resolvedLanguage === 'en' ? 'vi' : 'en'
  const [listOpen, setListOpen] = useState(true)

  return (
    <aside className="flex h-full w-[260px] flex-col border-r border-violet-100 bg-violet-50/80 dark:border-violet-500/10 dark:bg-night-950">
      <div className="flex h-[52px] shrink-0 items-center justify-between px-2">
        <button type="button" onClick={onNewChat} className={`rounded-lg px-2 py-1 ${rowHover}`} title={t('newChat')}>
          <BrandName />
        </button>
        <button type="button" onClick={onCollapse} className={iconButton} aria-label={t('collapse')} title={t('collapse')}>
          <PanelLeftIcon size={18} />
        </button>
      </div>

      <div className="px-2 pb-2">
        <button type="button" onClick={onNewChat} className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm ${rowHover}`}>
          <SquarePenIcon size={17} />
          {t('newChat')}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-2" aria-label={t('history')}>
        <button
          type="button"
          onClick={() => setListOpen((o) => !o)}
          aria-expanded={listOpen}
          className="group flex items-center gap-1 px-2.5 pt-4 pb-1.5 text-sm text-neutral-500 dark:text-neutral-400"
        >
          {t('conversations')}
          <ChevronDownIcon size={14} className={`opacity-0 transition group-hover:opacity-100 ${listOpen ? '' : '-rotate-90'}`} />
        </button>

        {listOpen && (
          <>
            {loading && <p className="px-2.5 py-1 text-sm text-neutral-500">{t('loading')}</p>}
            {error && <p className="px-2.5 py-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
            {!loading && !error && conversations.length === 0 && (
              <p className="px-2.5 py-1 text-sm text-neutral-500">{t('empty')}</p>
            )}
            <ul>
              {conversations.map((c) => (
                // Nút ⋯ chỉ hiện (và chỉ chiếm chỗ bên phải tên) khi rê chuột, focus, hoặc menu đang mở
                <li key={c.id} className="group relative">
                  <NavLink
                    to={`/c/${c.id}`}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `marquee-host block rounded-lg py-2 pr-2.5 pl-2.5 text-sm transition group-focus-within:pr-9 group-hover:pr-9 group-has-aria-expanded:pr-9 ${
                        isActive ? 'bg-violet-100 font-medium text-violet-900 dark:bg-violet-500/15 dark:text-violet-100' : rowHover
                      }`
                    }
                  >
                    <MarqueeText text={c.title} />
                  </NavLink>
                  <div className="absolute top-1/2 right-1 -translate-y-1/2 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100 has-aria-expanded:opacity-100">
                    <Menu
                      label={t('optionsFor', { title: c.title })}
                      // Mở xuống dưới, lệch sang phải (mép trái menu thẳng mép trái nút ⋯) như ChatGPT
                      side="bottom"
                      align="start"
                      trigger={<EllipsisIcon size={16} />}
                      triggerClassName="flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
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

      <div className="flex items-center gap-2.5 p-2 pl-4">
        <Avatar name={user?.displayName} size={28} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm">{user?.displayName}</p>
          <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">{user?.email}</p>
        </div>
        <Menu
          label={t('settings')}
          side="top"
          align="end"
          trigger={<SettingsIcon size={17} />}
          triggerClassName={iconButton}
          items={[
            {
              label: t(theme === 'dark' ? 'lightMode' : 'darkMode'),
              icon: theme === 'dark' ? <SunIcon size={15} /> : <MoonIcon size={15} />,
              onSelect: toggle,
              keepOpen: true,
            },
            {
              label: t(`common:language.${otherLanguage}`),
              icon: <GlobeIcon size={15} />,
              onSelect: () => setLanguage(otherLanguage),
              keepOpen: true,
            },
            { label: t('logout'), icon: <LogOutIcon size={15} />, danger: true, onSelect: logout },
          ]}
        />
      </div>
    </aside>
  )
}
