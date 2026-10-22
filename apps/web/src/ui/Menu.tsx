import type { ReactNode } from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

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
  /** Menu mở về phía nào của nút (mặc định: bên dưới) */
  side?: 'top' | 'right' | 'bottom' | 'left'
  /** Căn theo mép đầu hay mép cuối của nút: side top/bottom → trái/phải, side left/right → trên/dưới */
  align?: 'start' | 'end'
  triggerClassName?: string
}

/**
 * Menu thả xuống, dựng trên DropdownMenu của shadcn (Radix).
 * Nội dung render qua portal ra cuối <body>, nên không bị phần tử xung quanh đè lên
 * hay làm mờ theo; bấm ra ngoài, Esc, phím mũi tên đều có sẵn.
 */
export function Menu({ trigger, label, items, side = 'bottom', align = 'end', triggerClassName = '' }: Props) {
  return (
    // modal={false}: Radix mặc định đặt pointer-events: none cho <body> khi menu mở, làm mất con trỏ
    // bàn tay và hiệu ứng hover ở mọi chỗ ngoài menu (kể cả chính nút vừa bấm)
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger aria-label={label} title={label} className={triggerClassName}>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent side={side} align={align} className="min-w-44">
        {items.map((item) => (
          <DropdownMenuItem key={item.label} variant={item.danger ? 'destructive' : 'default'} onSelect={item.onSelect}>
            {item.icon}
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Kiểu nút icon tròn nhỏ dùng ở header, sidebar */
export const iconButton =
  'flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-night-800 dark:hover:text-slate-100'
