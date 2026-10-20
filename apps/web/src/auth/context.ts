import { createContext, use } from 'react'
import type { LoginInput, RegisterInput, User } from '../lib/types'

export type AuthState = {
  user: User | null
  /** true trong lúc kiểm tra token đã lưu khi mở trang */
  loading: boolean
  login(input: LoginInput): Promise<void>
  register(input: RegisterInput): Promise<void>
  logout(): void
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
  const ctx = use(AuthContext)
  if (!ctx) throw new Error('useAuth phải dùng bên trong <AuthProvider>')
  return ctx
}
