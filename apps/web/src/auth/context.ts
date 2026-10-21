import { createContext, use } from 'react'
import type { LoginInput, RegisterInput, User } from '../lib/types'

export type AuthState = {
  user: User | null
  /** true trong lúc kiểm tra token đã lưu khi mở trang */
  loading: boolean
  /** Trả về message key backend gửi kèm (vd "auth.loginSuccess"), null nếu không có */
  login(input: LoginInput): Promise<string | null>
  /** Trả về message key của bước đăng ký (vd "auth.registerSuccess"), null nếu không có */
  register(input: RegisterInput): Promise<string | null>
  logout(): void
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
  const ctx = use(AuthContext)
  if (!ctx) throw new Error('useAuth phải dùng bên trong <AuthProvider>')
  return ctx
}
