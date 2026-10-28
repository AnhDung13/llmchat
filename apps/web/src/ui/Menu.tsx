import type { ReactNode } from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export type MenuItem = {
  label: string
  icon?: ReactNode
  onSelect(): void
  danger?: boolean
  /** Bấm xong vẫn giữ menu mở (ví dụ đổi ngôn ngữ để thấy chữ đổi ngay trong menu) */
  keepOpen?: boolean
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
        {/* key theo vị trí: chữ của item đổi theo ngôn ngữ, key theo label sẽ làm item bị mount lại và mất focus */}
        {items.map((item, i) => (
          <DropdownMenuItem
            key={i}
            variant={item.danger ? 'destructive' : 'default'}
            onSelect={(e) => {
              // Radix đóng menu sau onSelect, trừ khi preventDefault
              if (item.keepOpen) e.preventDefault()
              item.onSelect()
            }}
          >
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
  'flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-night-800 dark:hover:text-neutral-100'
