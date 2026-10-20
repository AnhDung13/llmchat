import { NavLink } from 'react-router'
import { Logo } from '../auth/AuthPage'
import { useAuth } from '../auth/context'
import type { Conversation } from '../lib/types'

type Props = {
  conversations: Conversation[]
  loading: boolean
  error: string | null
  onNewChat(): void
  onDelete(id: number): void
  onNavigate(): void
}

export function Sidebar({ conversations, loading, error, onNewChat, onDelete, onNavigate }: Props) {
  const { user, logout } = useAuth()

  return (
    <aside className="flex h-full w-72 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
        <Logo size={28} />
        <span className="font-semibold tracking-tight">LLM Chat</span>
      </div>

      <div className="px-3 pb-2">
        <button
          type="button"
          onClick={onNewChat}
          className="flex w-full items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium shadow-sm transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
        >
          <PlusIcon />
          Cuộc trò chuyện mới
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label="Lịch sử trò chuyện">
        <p className="px-2 pb-1.5 text-xs font-medium text-zinc-500">Gần đây</p>
        {loading && <p className="px-2 py-1 text-sm text-zinc-500">Đang tải…</p>}
        {error && <p className="px-2 py-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
        {!loading && !error && conversations.length === 0 && (
          <p className="px-2 py-1 text-sm text-zinc-500">Chưa có cuộc trò chuyện nào</p>
        )}
        <ul className="space-y-0.5">
          {conversations.map((c) => (
            <li key={c.id} className="group relative">
              <NavLink
                to={`/c/${c.id}`}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `block truncate rounded-lg py-2 pr-9 pl-2 text-sm transition ${
                    isActive
                      ? 'bg-zinc-200 font-medium dark:bg-zinc-800'
                      : 'text-zinc-700 hover:bg-zinc-200/60 dark:text-zinc-300 dark:hover:bg-zinc-800/60'
                  }`
                }
                title={c.title}
              >
                {c.title}
              </NavLink>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Xoá "${c.title}"?`)) onDelete(c.id)
                }}
                className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-md p-1 text-zinc-500 opacity-0 transition group-hover:opacity-100 hover:bg-zinc-300 hover:text-red-600 focus:opacity-100 dark:hover:bg-zinc-700"
                aria-label={`Xoá ${c.title}`}
              >
                <TrashIcon />
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex items-center gap-3 border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
          {user?.displayName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user?.displayName}</p>
          <p className="truncate text-xs text-zinc-500">{user?.email}</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="rounded-md px-2 py-1 text-xs text-zinc-600 transition hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Đăng xuất
        </button>
      </div>
    </aside>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
    </svg>
  )
}
