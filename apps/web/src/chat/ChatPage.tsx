import { useCallback, useEffect, useRef, useState } from 'react'
import { useMatch, useNavigate } from 'react-router'
import { api } from '../lib/api'
import type { Conversation, Message } from '../lib/types'
import { Composer } from './Composer'
import { MessageList, type UiMessage } from './MessageList'
import { Sidebar } from './Sidebar'

const SUGGESTIONS = [
  'Giải thích Dependency Injection trong Spring bằng ví dụ đời thường',
  'JWT gồm những phần nào và vì sao không cần lưu session?',
  'So sánh SSE và WebSocket cho ứng dụng chat',
  'Viết câu SQL tạo bảng users cho H2',
]

const toUi = (m: Message): UiMessage => ({ key: String(m.id), role: m.role, content: m.content })
const errorText = (err: unknown) => (err instanceof Error ? err.message : 'Có lỗi xảy ra')
const isAbort = (err: unknown) => err instanceof DOMException && err.name === 'AbortError'

type Thread = { conversationId: number | null; messages: UiMessage[]; error?: string }

export function ChatPage() {
  const match = useMatch('/c/:id')
  const conversationId = match?.params.id ? Number(match.params.id) : null
  const navigate = useNavigate()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [convLoading, setConvLoading] = useState(true)
  const [convError, setConvError] = useState<string | null>(null)

  // Tin nhắn luôn đi kèm id cuộc trò chuyện của chúng: đổi cuộc trò chuyện thì
  // thread cũ tự "không khớp" và bị coi là đang tải, không cần reset state trong effect.
  const [thread, setThread] = useState<Thread>({ conversationId: null, messages: [] })
  const [sendError, setSendError] = useState<string | null>(null)
  const [streaming, setStreaming] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const abortRef = useRef<AbortController | null>(null)
  const streamingConvRef = useRef<number | null>(null)
  const seqRef = useRef(0)

  const refreshConversations = useCallback(
    () =>
      api
        .listConversations()
        .then(
          (list) => {
            setConversations(list)
            setConvError(null)
          },
          (err: unknown) => setConvError(errorText(err)),
        )
        .finally(() => setConvLoading(false)),
    [],
  )

  useEffect(() => {
    void refreshConversations()
  }, [refreshConversations])

  // Huỷ stream đang chạy khi rời trang (ví dụ đăng xuất)
  useEffect(() => () => abortRef.current?.abort(), [])

  // Người dùng chuyển sang cuộc trò chuyện khác → huỷ stream đang chạy ở cuộc cũ.
  // Chỉ phụ thuộc URL: React Router đổi URL trong một transition, nên có lúc thread đã là cuộc mới mà URL chưa đổi.
  useEffect(() => {
    if (streamingConvRef.current !== null && streamingConvRef.current !== conversationId) abortRef.current?.abort()
  }, [conversationId])

  // Tải tin nhắn của cuộc trò chuyện đang mở (nếu chưa có)
  const loadedId = thread.conversationId
  useEffect(() => {
    if (conversationId === null || loadedId === conversationId) return
    let cancelled = false
    api.listMessages(conversationId).then(
      (ms) => !cancelled && setThread({ conversationId, messages: ms.map(toUi) }),
      (err: unknown) => !cancelled && setThread({ conversationId, messages: [], error: errorText(err) }),
    )
    return () => {
      cancelled = true
    }
  }, [conversationId, loadedId])

  const messages = loadedId === conversationId ? thread.messages : []
  const messagesLoading = conversationId !== null && loadedId !== conversationId
  const pageError = sendError ?? (loadedId === conversationId ? thread.error : undefined)

  async function send(content: string) {
    setSendError(null)
    const seq = ++seqRef.current
    const aiKey = `pending-ai-${seq}`
    const pending: UiMessage[] = [
      { key: `pending-user-${seq}`, role: 'user', content },
      { key: aiKey, role: 'assistant', content: '', streaming: true },
    ]

    let convId = conversationId
    if (convId === null) {
      try {
        const conv = await api.createConversation()
        convId = conv.id
        setConversations((prev) => [conv, ...prev])
        setThread({ conversationId: conv.id, messages: pending }) // đã có sẵn → effect không tải lại
        navigate(`/c/${conv.id}`)
      } catch (err) {
        setSendError(errorText(err))
        return
      }
    } else {
      setThread((t) => ({ ...t, messages: [...t.messages, ...pending] }))
    }

    const updateAi = (fn: (m: UiMessage) => UiMessage) =>
      setThread((t) => ({ ...t, messages: t.messages.map((m) => (m.key === aiKey ? fn(m) : m)) }))

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
      else updateAi((m) => ({ ...m, streaming: false, error: errorText(err) }))
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
        streamingConvRef.current = null
      }
      setStreaming(false)
      void refreshConversations() // tiêu đề và thứ tự có thể đã đổi
    }
  }

  async function remove(id: number) {
    try {
      await api.deleteConversation(id)
      setConversations((prev) => prev.filter((c) => c.id !== id))
      if (id === conversationId) navigate('/')
    } catch (err) {
      setConvError(errorText(err))
    }
  }

  const current = conversations.find((c) => c.id === conversationId)
  const empty = conversationId === null && messages.length === 0

  return (
    <div className="flex h-full">
      {/* Sidebar: cố định trên desktop, trượt ra trên mobile */}
      <div className="hidden md:block">
        <Sidebar
          conversations={conversations}
          loading={convLoading}
          error={convError}
          onNewChat={() => {
            setSendError(null)
            navigate('/')
          }}
          onDelete={remove}
          onNavigate={() => setSendError(null)}
        />
      </div>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="relative h-full w-72 shadow-xl">
            <Sidebar
              conversations={conversations}
              loading={convLoading}
              error={convError}
              onNewChat={() => {
                setSendError(null)
                navigate('/')
                setSidebarOpen(false)
              }}
              onDelete={remove}
              onNavigate={() => {
                setSendError(null)
                setSidebarOpen(false)
              }}
            />
          </div>
        </div>
      )}

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-zinc-200 px-4 dark:border-zinc-800">
          <button
            type="button"
            className="-ml-1 rounded-md p-1.5 hover:bg-zinc-100 md:hidden dark:hover:bg-zinc-800"
            onClick={() => setSidebarOpen(true)}
            aria-label="Mở danh sách trò chuyện"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="truncate text-sm font-medium">{current?.title ?? 'Cuộc trò chuyện mới'}</h1>
        </header>

        {pageError && (
          <div role="alert" className="mx-auto mt-4 w-full max-w-3xl px-4">
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">{pageError}</p>
          </div>
        )}

        {empty ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4">
            <h2 className="mb-2 text-2xl font-semibold tracking-tight">Hôm nay bạn muốn hỏi gì?</h2>
            <p className="mb-8 text-sm text-zinc-500">Bắt đầu bằng một câu hỏi, hoặc chọn một gợi ý</p>
            <div className="grid w-full max-w-2xl gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void send(s)}
                  className="rounded-xl border border-zinc-200 px-4 py-3 text-left text-sm text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : messagesLoading ? (
          <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">Đang tải tin nhắn…</div>
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
    </div>
  )
}
