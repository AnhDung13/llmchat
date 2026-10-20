import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '../lib/api'
import { ApiError, setSessionExpiredHandler } from '../lib/http'
import { clearSession, getSession, saveSession } from '../lib/session'
import type { LoginInput, RegisterInput, User } from '../lib/types'
import { AuthContext, type AuthState } from './context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(() => getSession() !== null)

  // Mở trang mà đã có phiên → hỏi backend xem còn dùng được không (GET /api/me).
  // Access token hết hạn thì lib/http tự gọi /api/auth/refresh trước.
  useEffect(() => {
    if (!getSession()) return
    let cancelled = false
    api
      .me()
      .then((u) => !cancelled && setUser(u))
      .catch((err: unknown) => {
        // 401 thì lib/http đã xoá phiên. Lỗi khác (backend chưa chạy...) thì giữ phiên để lần sau thử lại.
        if (err instanceof ApiError && err.status !== 0 && err.status !== 401) clearSession()
        if (!cancelled) setUser(null)
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    setSessionExpiredHandler(() => setUser(null))
  }, [])

  const logout = useCallback(() => {
    const refreshToken = getSession()?.refreshToken
    clearSession()
    setUser(null)
    // Báo backend thu hồi refresh token; lỗi cũng không sao vì phía trình duyệt đã xoá phiên
    if (refreshToken) api.logout(refreshToken).catch(() => {})
  }, [])

  const login = useCallback(async (input: LoginInput) => {
    const res = await api.login(input)
    saveSession(res)
    setUser(res.user)
  }, [])

  const register = useCallback(
    async (input: RegisterInput) => {
      await api.register(input)
      await login({ email: input.email, password: input.password })
    },
    [login],
  )

  const value = useMemo<AuthState>(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
