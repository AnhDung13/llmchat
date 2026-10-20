import { useEffect, useRef } from 'react'
import { Markdown } from './Markdown'

export type UiMessage = {
  /** id từ backend; tin nhắn đang chờ lưu dùng id tạm dạng chuỗi */
  key: string
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
  stopped?: boolean
  error?: string
}

export function MessageList({ messages }: { messages: UiMessage[] }) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const last = messages.at(-1)

  // Tự cuộn xuống cuối khi có chữ mới, trừ khi người dùng đang kéo lên đọc tin cũ
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 160
    if (nearBottom || last?.role === 'user') bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, last?.content, last?.role])

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
        {messages.map((m) =>
          m.role === 'user' ? (
            <div key={m.key} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-md bg-emerald-600 px-4 py-2.5 text-[15px] whitespace-pre-wrap text-white">
                {m.content}
              </div>
            </div>
          ) : (
            <div key={m.key} className="flex gap-3">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                AI
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                {m.content ? (
                  <Markdown text={m.content} />
                ) : m.streaming ? (
                  <TypingDots />
                ) : null}
                {m.streaming && m.content && <span className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-zinc-400 align-middle" />}
                {m.stopped && <p className="mt-2 text-xs text-zinc-500">Đã dừng</p>}
                {m.error && (
                  <p role="alert" className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
                    {m.error}
                  </p>
                )}
              </div>
            </div>
          ),
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

function TypingDots() {
  return (
    <div className="flex h-6 items-center gap-1" aria-label="AI đang trả lời">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  )
}
