import { SendIcon, SquareIcon } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'

type Props = {
  streaming: boolean
  onSend(text: string): void
  onStop(): void
  autoFocusKey?: string | number
}

export function Composer({ streaming, onSend, onStop, autoFocusKey }: Props) {
  const { t } = useTranslation('thread')
  const [text, setText] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    ref.current?.focus()
  }, [autoFocusKey])

  // Ô nhập tự cao lên theo nội dung, tối đa 200px
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [text])

  function submit(e?: FormEvent) {
    e?.preventDefault()
    const value = text.trim()
    if (!value || streaming) return
    onSend(value)
    setText('')
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter gửi, Shift+Enter xuống dòng; bỏ qua khi đang gõ tiếng Việt (IME đang ghép chữ)
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-3xl px-4 pt-2 pb-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/15 dark:border-night-700 dark:bg-night-850 dark:focus-within:border-indigo-500/60">
        <textarea
          ref={ref}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder={t('placeholder')}
          aria-label={t('inputLabel')}
          className="block max-h-[200px] w-full resize-none bg-transparent px-1 py-1 text-[15px] outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="truncate px-1 text-xs text-slate-400 dark:text-slate-500">
            {t('hint')}
          </p>
          {streaming ? (
            <button
              type="button"
              onClick={onStop}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
              aria-label={t('stop')}
              title={t('stop')}
            >
              <SquareIcon size={14} fill="currentColor" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!text.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500 text-white shadow-sm shadow-indigo-500/30 transition hover:bg-indigo-600 disabled:bg-indigo-300 disabled:shadow-none dark:disabled:bg-indigo-500/40"
              aria-label={t('sendLabel')}
              title={t('send')}
            >
              <SendIcon size={15} />
            </button>
          )}
        </div>
      </div>
    </form>
  )
}
