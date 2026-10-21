import { useEffect, useRef, useState, type ReactNode } from 'react'

export type MenuItem = {
  label: string
  icon?: ReactNode
  onSelect(): void
  danger?: boolean
}

type Props = {
  /** Nội dung nút mở menu (thường là một icon) */
  trigger: ReactNode
  label: string
  items: MenuItem[]
  align?: 'left' | 'right'
  /** Mở lên trên thay vì xuống dưới (dùng cho menu ở đáy sidebar) */
  up?: boolean
  triggerClassName?: string
}

export function Menu({ trigger, label, items, align = 'right', up = false, triggerClassName = '' }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // Bấm ra ngoài hoặc nhấn Esc thì đóng
  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        title={label}
        className={triggerClassName}
      >
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          className={`absolute z-50 min-w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-night-700 dark:bg-night-850 ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${up ? 'bottom-full mb-1.5' : 'top-full mt-1.5'}`}
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                item.onSelect()
              }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition ${
                item.danger
                  ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-night-800'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** Kiểu nút icon tròn nhỏ dùng ở header, sidebar */
export const iconButton =
  'flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-night-800 dark:hover:text-slate-100'
