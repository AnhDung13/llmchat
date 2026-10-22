import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarIcon, CodeXmlIcon, EllipsisVerticalIcon, FileTextIcon, LightbulbIcon, MenuIcon, MessageSquareIcon, MoonIcon, PanelLeftIcon, PencilIcon, SunIcon, TrashIcon } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useMatch, useNavigate } from 'react-router'
import { useAuth } from '../auth/context'
import { api } from '../lib/api'
import { errorMessage } from '../lib/i18n'
import { keys } from '../lib/queryClient'
import { useTheme } from '../lib/theme'
import type { Conversation, Message } from '../lib/types'
import { Logo } from '../ui/Logo'
import { Menu, iconButton } from '../ui/Menu'
import { Composer } from './Composer'
import { DeleteDialog, RenameDialog } from './ConversationDialogs'
import { MessageList, type UiMessage } from './MessageList'
import { Sidebar } from './Sidebar'

// Chữ của từng gợi ý nằm trong locales/<lang>/chat.json: suggestions.<id>.title / subtitle / prompt
const SUGGESTIONS: { id: string; icon: ReactNode; tint: string }[] = [
  { id: 'explain', icon: <LightbulbIcon size={18} />, tint: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400' },
  { id: 'code', icon: <CodeXmlIcon size={18} />, tint: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400' },
  { id: 'plan', icon: <CalendarIcon size={18} />, tint: 'bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400' },
  { id: 'summarize', icon: <FileTextIcon size={18} />, tint: 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400' },
]

type DialogTarget = Pick<Conversation, 'id' | 'title'>

const toUi = (m: Message): UiMessage => ({ key: String(m.id), role: m.role, content: m.content })
const isAbort = (err: unknown) => err instanceof DOMException && err.name === 'AbortError'

/**
 * Tin nhắn của một cuộc trò chuyện. Cache này cũng là nơi giữ tin nhắn đang stream,
 * nên staleTime: Infinity để không bao giờ có lần tải lại nào đè lên.
 */
const messagesQuery = (conversationId: string) =>
  queryOptions({
    queryKey: keys.messages(conversationId),
    queryFn: async ({ signal }) => (await api.listMessages(conversationId, signal)).map(toUi),
    staleTime: Infinity,
  })

export function ChatPage() {
  const { t } = useTranslation('chat')
  const match = useMatch('/c/:id')
  const conversationId = match?.params.id ?? null
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { theme, toggle: toggleTheme } = useTheme()

  const conversationsQuery = useQuery({
    queryKey: keys.conversations,
    queryFn: ({ signal }) => api.listConversations(signal),
  })
  const conversations = conversationsQuery.data ?? []

  const messagesResult = useQuery({ ...messagesQuery(conversationId ?? ''), enabled: conversationId !== null })
  const messages = conversationId === null ? [] : (messagesResult.data ?? [])
  const messagesLoading = conversationId !== null && messagesResult.isPending

  // Lỗi đã hiện toast qua QueryCache/MutationCache (lib/queryClient.ts), ở đây không cần try/catch
  const createConversation = useMutation({ mutationFn: (title: string) => api.createConversation(title) })
  const deleteConversation = useMutation({
    mutationFn: (id: string) => api.deleteConversation(id),
    onSuccess: (_data, id) => {
      queryClient.setQueryData<Conversation[]>(keys.conversations, (prev) => prev?.filter((c) => c.id !== id))
      queryClient.removeQueries({ queryKey: keys.messages(id) })
    },
  })

  const renameConversation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => api.renameConversation(id, title),
    onSuccess: (conv) => {
      queryClient.setQueryData<Conversation[]>(keys.conversations, (prev) => prev?.map((c) => (c.id === conv.id ? conv : c)))
    },
  })

  // Conversation đang mở hộp thoại đổi tên / xoá (null = đóng)
  const [renaming, setRenaming] = useState<DialogTarget | null>(null)
  const [deleting, setDeleting] = useState<DialogTarget | null>(null)

  const [streaming, setStreaming] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false) // ngăn kéo trên mobile
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false) // thu gọn trên desktop

  const abortRef = useRef<AbortController | null>(null)
  const streamingConvRef = useRef<string | null>(null)
  const seqRef = useRef(0)

  // Huỷ stream đang chạy khi rời trang (ví dụ đăng xuất)
  useEffect(() => () => abortRef.current?.abort(), [])

  // Người dùng chuyển sang cuộc trò chuyện khác → huỷ stream đang chạy ở cuộc cũ.
  // Chỉ phụ thuộc URL: React Router đổi URL trong một transition.
  useEffect(() => {
    if (streamingConvRef.current !== null && streamingConvRef.current !== conversationId) abortRef.current?.abort()
  }, [conversationId])

  async function send(content: string) {
    const seq = ++seqRef.current
    const aiKey = `pending-ai-${seq}`
    const pending: UiMessage[] = [
      { key: `pending-user-${seq}`, role: 'user', content },
      { key: aiKey, role: 'assistant', content: '', streaming: true },
    ]

    let convId: string
    if (conversationId === null) {
      let conv: Conversation
      try {
        // Tiêu đề theo ngôn ngữ giao diện đang chọn
        conv = await createConversation.mutateAsync(t('newChat', { ns: 'sidebar' }))
      } catch {
        return // toast do MutationCache hiện
      }
      convId = conv.id
      queryClient.setQueryData<Conversation[]>(keys.conversations, (prev) => [conv, ...(prev ?? [])])
      // Gieo sẵn tin nhắn vào cache → trang /c/:id mới không phải tải từ backend
      queryClient.setQueryData(keys.messages(conv.id), pending)
      navigate(`/c/${conv.id}`)
    } else {
      convId = conversationId
      // Tin nhắn cũ đang tải dở thì đợi tải xong rồi mới nối thêm, để lần tải đó không đè mất tin mới
      await queryClient.ensureQueryData(messagesQuery(convId)).catch(() => {})
      queryClient.setQueryData<UiMessage[]>(keys.messages(convId), (prev) => [...(prev ?? []), ...pending])
    }

    const updateAi = (fn: (m: UiMessage) => UiMessage) =>
      queryClient.setQueryData<UiMessage[]>(keys.messages(convId), (prev) => prev?.map((m) => (m.key === aiKey ? fn(m) : m)))

    const controller = new AbortController()
    abortRef.current = controller
    streamingConvRef.current = convId
    setStreaming(true)
    try {
      for await (const ev of api.sendMessage(convId, content, controller.signal)) {
        if (ev.type === 'delta') updateAi((m) => ({ ...m, content: m.content + ev.text }))
        else updateAi(() => toUi(ev.message))
      }
    } catch (err) {
      if (isAbort(err)) updateAi((m) => ({ ...m, streaming: false, stopped: true }))
      else updateAi((m) => ({ ...m, streaming: false, error: errorMessage(err) }))
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
        streamingConvRef.current = null
      }
      setStreaming(false)
      // Tiêu đề và thứ tự có thể đã đổi
      void queryClient.invalidateQueries({ queryKey: keys.conversations })
    }
  }

  function remove(id: string) {
    deleteConversation.mutate(id, {
      onSuccess: () => {
        if (id === conversationId) navigate('/')
      },
    })
  }

  const current = conversations.find((c) => c.id === conversationId)
  // Trang chào (gợi ý) cho cả trang / lẫn conversation chưa có tin nhắn nào
  const empty = !messagesLoading && messages.length === 0

  const sidebarProps = {
    conversations,
    loading: conversationsQuery.isPending,
    error: conversationsQuery.error ? errorMessage(conversationsQuery.error) : null,
    onRename: setRenaming,
    onDelete: setDeleting,
  }

  return (
    <div className="flex h-full">
      {/* Sidebar: cố định trên desktop (có thể thu gọn), trượt ra trên mobile */}
      {!sidebarCollapsed && (
        <div className="hidden md:block">
          <Sidebar
            {...sidebarProps}
            onNewChat={() => navigate('/')}
            onNavigate={() => {}}
            onCollapse={() => setSidebarCollapsed(true)}
          />
        </div>
      )}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative h-full w-72 shadow-xl">
            <Sidebar
              {...sidebarProps}
              onNewChat={() => {
                navigate('/')
                setSidebarOpen(false)
              }}
              onNavigate={() => setSidebarOpen(false)}
              onCollapse={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      <main className="flex min-w-0 flex-1 flex-col">
        <header
          className={`flex h-14 shrink-0 items-center gap-2 px-4 ${
            conversationId !== null ? 'border-b border-slate-200 dark:border-night-700' : ''
          }`}
        >
          <button type="button" className={`${iconButton} -ml-1 md:hidden`} onClick={() => setSidebarOpen(true)} aria-label={t('openConversationList')}>
            <MenuIcon size={18} />
          </button>
          {sidebarCollapsed && (
            <button
              type="button"
              className={`${iconButton} -ml-1 hidden md:flex`}
              onClick={() => setSidebarCollapsed(false)}
              aria-label={t('openSidebar')}
              title={t('openSidebar')}
            >
              <PanelLeftIcon size={16} />
            </button>
          )}
          {conversationId !== null && (
            <h1 className="flex min-w-0 items-center gap-2 text-sm font-medium">
              <MessageSquareIcon size={16} className="shrink-0 text-slate-500 dark:text-slate-400" />
              <span className="truncate">{current?.title ?? t('conversationFallback')}</span>
            </h1>
          )}

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={toggleTheme}
              className={iconButton}
              aria-label={theme === 'dark' ? t('switchToLight') : t('switchToDark')}
              title={theme === 'dark' ? t('lightTheme') : t('darkTheme')}
            >
              {theme === 'dark' ? <SunIcon size={17} /> : <MoonIcon size={17} />}
            </button>
            {conversationId !== null && (
              <Menu
                label={t('conversationOptions')}
                trigger={<EllipsisVerticalIcon size={17} />}
                triggerClassName={iconButton}
                items={[
                  // Conversation không có trong trang danh sách đã tải thì chưa biết tên → chỉ cho xoá
                  ...(current ? [{ label: t('renameConversation'), icon: <PencilIcon size={15} />, onSelect: () => setRenaming(current) }] : []),
                  {
                    label: t('deleteConversation'),
                    icon: <TrashIcon size={15} />,
                    danger: true,
                    onSelect: () => setDeleting({ id: conversationId, title: current?.title ?? t('thisConversation') }),
                  },
                ]}
              />
            )}
          </div>
        </header>

        {empty ? (
          <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-8">
            <Logo size={64} />
            <h2 className="mt-6 mb-3 text-center text-3xl font-semibold tracking-tight">{t('greeting', { name: user?.displayName })}</h2>
            <p className="mb-10 max-w-md text-center text-sm leading-relaxed text-slate-500 dark:text-slate-400">{t('intro')}</p>
            <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => {
                const prompt = t(`suggestions.${s.id}.prompt`)
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => void send(prompt)}
                    title={prompt}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-left text-sm shadow-sm transition hover:border-indigo-300 hover:shadow-md dark:border-night-700 dark:bg-night-850 dark:hover:border-indigo-500/50"
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${s.tint}`}>{s.icon}</span>
                    <span className="leading-snug">
                      <span className="block text-slate-800 dark:text-slate-100">{t(`suggestions.${s.id}.title`)}</span>
                      <span className="block text-slate-500 dark:text-slate-400">{t(`suggestions.${s.id}.subtitle`)}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : messagesLoading ? (
          <div className="flex flex-1 items-center justify-center text-sm text-slate-500">{t('loadingMessages')}</div>
        ) : (
          <MessageList messages={messages} />
        )}

        <Composer
          streaming={streaming}
          onSend={(text) => void send(text)}
          onStop={() => abortRef.current?.abort()}
          autoFocusKey={conversationId ?? 'new'}
        />
      </main>

      <RenameDialog target={renaming} onClose={() => setRenaming(null)} onRename={(id, title) => renameConversation.mutate({ id, title })} />
      <DeleteDialog target={deleting} onClose={() => setDeleting(null)} onDelete={remove} />
    </div>
  )
}
