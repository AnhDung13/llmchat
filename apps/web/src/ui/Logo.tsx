import { SparkleIcon } from './icons'

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30"
      style={{ width: size, height: size, borderRadius: size * 0.28 }}
      aria-hidden
    >
      <SparkleIcon size={size * 0.55} />
    </div>
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
