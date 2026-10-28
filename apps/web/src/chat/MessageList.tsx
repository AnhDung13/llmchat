import { ArrowDownIcon, CheckIcon, ChevronRightIcon, CopyIcon } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Markdown } from './Markdown'

export type UiMessage = {
  /** id từ backend; tin nhắn đang chờ lưu dùng id tạm dạng chuỗi */
  key: string
  role: 'user' | 'assistant'
  content: string
  /** Phần suy luận của model, hiện trong khối thu gọn phía trên câu trả lời */
  reasoning?: string
  streaming?: boolean
  stopped?: boolean
  error?: string
}

/** Cách đáy dưới mức này (px) thì coi như đang ở cuối */
const NEAR_BOTTOM = 160

export function MessageList({ messages }: { messages: UiMessage[] }) {
  const { t } = useTranslation('thread')
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [atBottom, setAtBottom] = useState(true)
  const last = messages.at(-1)

  // Mở một cuộc trò chuyện → nhảy thẳng xuống tin mới nhất (ChatPage đặt key theo conversation nên mỗi lần đổi là mount lại)
  useLayoutEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [])

  // Tự cuộn xuống cuối khi có chữ mới, trừ khi người dùng đang kéo lên đọc tin cũ
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM
    if (nearBottom || last?.role === 'user') bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, last?.content, last?.reasoning, last?.role])

  function onScroll() {
    const el = containerRef.current
    if (el) setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM)
  }

  return (
    <div className="relative min-h-0 flex-1">
      <div ref={containerRef} onScroll={onScroll} className="h-full overflow-y-auto">
        <div className="mx-auto flex max-w-3xl flex-col px-4 pt-6 pb-10">
          {messages.map((m) =>
            m.role === 'user' ? (
              <div key={m.key} className="group mt-8 flex flex-col items-end first:mt-0">
                <div className="max-w-[70%] rounded-3xl bg-violet-100 px-5 py-2.5 text-base break-words whitespace-pre-wrap dark:bg-violet-500/15">
                  {m.content}
                </div>
                <div className="mt-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                  <CopyButton text={m.content} label={t('copyMessage')} />
                </div>
              </div>
            ) : (
              <div key={m.key} className="group mt-2">
                {m.reasoning && <Reasoning text={m.reasoning} thinking={!!m.streaming && !m.content} />}
                {m.content ? (
                  <Markdown text={m.content} streaming={m.streaming} />
                ) : m.streaming && !m.reasoning ? (
                  <PendingDot />
                ) : null}
                {m.stopped && <p className="mt-2 text-sm text-neutral-500">{t('stopped')}</p>}
                {m.error && (
                  <p role="alert" className="mt-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
                    {m.error}
                  </p>
                )}
                {!m.streaming && m.content && (
                  // Tin mới nhất luôn hiện nút, tin cũ chỉ hiện khi rê chuột vào
                  <div className={`mt-1 -ml-2 flex ${m === last ? '' : 'opacity-0 transition group-hover:opacity-100 focus-within:opacity-100'}`}>
                    <CopyButton text={m.content} label={t('copyAnswer')} />
                  </div>
                )}
              </div>
            ),
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {!atBottom && (
        <button
          type="button"
          onClick={() => bottomRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })}
          className="absolute bottom-4 left-1/2 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-md transition hover:bg-neutral-50 dark:border-night-700 dark:bg-night-800 dark:text-neutral-200 dark:hover:bg-night-700"
          aria-label={t('scrollToBottom')}
          title={t('scrollToBottom')}
        >
          <ArrowDownIcon size={18} />
        </button>
      )}
    </div>
  )
}

/** Mở sẵn khi model đang suy nghĩ, tự thu lại khi câu trả lời bắt đầu — trừ khi người dùng đã tự bấm mở/đóng */
function Reasoning({ text, thinking }: { text: string; thinking: boolean }) {
  const { t } = useTranslation('thread')
  const [manualOpen, setManualOpen] = useState<boolean | null>(null)
  const open = manualOpen ?? thinking
  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setManualOpen(!open)}
        aria-expanded={open}
        className="flex items-center gap-1 py-0.5 text-[15px] text-neutral-500 transition hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
      >
        <span className={thinking ? 'text-shimmer' : ''}>{t(thinking ? 'thinking' : 'thought')}</span>
        <ChevronRightIcon size={16} className={`transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="mt-2 max-h-80 overflow-y-auto border-l-2 border-violet-200 pl-4 text-sm leading-relaxed whitespace-pre-wrap text-neutral-500 dark:border-violet-500/30 dark:text-neutral-400">
          {text}
        </div>
      )}
    </div>
  )
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const { t } = useTranslation('thread')
  const [copied, setCopied] = useState(false)
  const title = copied ? t('copied') : label
  return (
    <button
      type="button"
      onClick={() =>
        void navigator.clipboard.writeText(text).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        })
      }
      className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-night-800 dark:hover:text-neutral-100"
      aria-label={title}
      title={title}
    >
      {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
    </button>
  )
}

/** Chấm tròn nhấp nháy khi đang chờ chữ đầu tiên, như ChatGPT */
function PendingDot() {
  const { t } = useTranslation('thread')
  return (
    <div className="flex h-7 items-center" role="status" aria-label={t('typing')}>
      <span className="h-3.5 w-3.5 animate-pulse rounded-full bg-violet-500 dark:bg-violet-400" />
    </div>
  )
}
