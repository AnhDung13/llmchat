/** Tên app dạng chữ gradient tím, dùng ở sidebar, header và trang đăng nhập. `className` đặt cỡ chữ, độ đậm */
export function BrandName({ className = 'text-xl font-semibold' }: { className?: string }) {
  return (
    <span
      className={`bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 bg-clip-text tracking-tight text-transparent dark:from-violet-400 dark:via-purple-400 dark:to-fuchsia-400 ${className}`}
    >
      LLM Chat
    </span>
  )
}

/** "Anh Dung" → "AD", "dung" → "D" */
function initials(name: string | undefined) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0].charAt(0)
  const last = parts.length > 1 ? parts.at(-1)!.charAt(0) : ''
  return (first + last).toUpperCase()
}

export function Avatar({ name, size = 32 }: { name: string | undefined; size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden
    >
      {initials(name)}
    </div>
  )
}
