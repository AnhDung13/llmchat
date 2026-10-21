import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/context'
import { CheckIcon, CopyIcon } from '../ui/icons'
import { Avatar, Logo } from '../ui/Logo'
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
  const { user } = useAuth()
  const { t } = useTranslation('thread')
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
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6">
        {messages.map((m) =>
          m.role === 'user' ? (
            <div key={m.key} className="flex items-start gap-3">
              <Avatar name={user?.displayName} size={30} />
              <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-indigo-50 px-4 py-2.5 text-[15px] whitespace-pre-wrap text-slate-800 dark:bg-night-800 dark:text-slate-100">
                {m.content}
              </div>
            </div>
          ) : (
            <div key={m.key} className="flex items-start gap-3">
              <Logo size={30} />
              <div className="min-w-0 flex-1 pt-1">
                {m.content ? (
                  <Markdown text={m.content} />
                ) : m.streaming ? (
                  <TypingDots />
                ) : null}
                {m.streaming && m.content && <span className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-indigo-400 align-middle" />}
                {m.stopped && <p className="mt-2 text-xs text-slate-500">{t('stopped')}</p>}
                {m.error && (
                  <p role="alert" className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
                    {m.error}
                  </p>
                )}
                {!m.streaming && m.content && <CopyButton text={m.content} />}
              </div>
            </div>
          ),
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const { t } = useTranslation('thread')
  const [copied, setCopied] = useState(false)
  const label = t(copied ? 'copied' : 'copyAnswer')
  return (
    <div className="mt-2 flex">
      <button
        type="button"
        onClick={() =>
          void navigator.clipboard.writeText(text).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          })
        }
        className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-night-800 dark:hover:text-slate-200"
        aria-label={label}
        title={label}
      >
        {copied ? <CheckIcon size={15} /> : <CopyIcon size={15} />}
      </button>
    </div>
  )
}

function TypingDots() {
  const { t } = useTranslation('thread')
  return (
    <div className="flex h-6 items-center gap-1" aria-label={t('typing')}>
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  )
}
