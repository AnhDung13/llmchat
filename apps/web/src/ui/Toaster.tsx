import { Toaster as Sonner } from 'sonner'
import { useTheme } from '../lib/theme'

// Gọi toast ở bất kỳ đâu: import { toast } from 'sonner'; toast.success('...'), toast.error('...')
export function Toaster() {
  const { theme } = useTheme()
  return <Sonner theme={theme} position="bottom-right" richColors closeButton />
}
