// Gọi API backend: gắn Authorization: Bearer, mở envelope { status, message, data },
// tự gọi POST /api/auth/refresh khi access token hết hạn.

import { clearSession, getSession, saveSession } from './session'
import type { ApiEnvelope, TokenResponse } from './types'

/**
 * Trình duyệt luôn gọi /api trên cùng origin với Vite.
 * Lúc dev, Vite chuyển tiếp /api/* sang VITE_API_URL (xem vite.config.ts), nên backend không cần CORS.
 */
const API_BASE = '/api'
const BACKEND_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8081'

/** Làm mới sớm hơn hạn thật một chút, để token không hết hạn giữa đường. */
const EXPIRY_SKEW_MS = 30_000

export class ApiError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

let onSessionExpired: () => void = () => {}

/** AuthProvider đăng ký hàm này để đưa người dùng về trang đăng nhập khi phiên hết hạn. */
export function setSessionExpiredHandler(handler: () => void) {
  onSessionExpired = handler
}

function expireSession() {
  clearSession()
  onSessionExpired()
}

type RequestOptions = {
  /** false cho các endpoint không cần đăng nhập (login, register, refresh, logout) */
  auth?: boolean
}

export async function request(path: string, init: RequestInit = {}, { auth = true }: RequestOptions = {}): Promise<Response> {
  let token = auth ? await getFreshAccessToken() : null
  let res = await send(path, init, token)

  // Token bị từ chối (ví dụ backend khởi động lại với khoá JWT khác) → thử làm mới một lần rồi gửi lại
  if (res.status === 401 && token) {
    token = await refreshAccessToken(token)
    if (token) res = await send(path, init, token)
  }

  if (!res.ok) {
    const message = await readProblem(res)
    // 401 ở endpoint không cần đăng nhập (ví dụ sai mật khẩu) không có nghĩa là phiên hết hạn
    if (res.status === 401 && auth) expireSession()
    throw new ApiError(res.status, message)
  }
  return res
}

export async function json<T>(path: string, init?: RequestInit, options?: RequestOptions): Promise<T> {
  const res = await request(path, init, options)
  return readBody<T>(res)
}

/** Lấy dữ liệu thật trong field `data` của envelope */
export async function readBody<T>(res: Response): Promise<T> {
  return ((await res.json()) as ApiEnvelope<T>).data
}

async function send(path: string, init: RequestInit, token: string | null): Promise<Response> {
  const headers = new Headers(init.headers)
  if (init.body !== undefined && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (!headers.has('Accept')) headers.set('Accept', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  try {
    return await fetch(`${API_BASE}${path}`, { ...init, headers })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new ApiError(0, `Không kết nối được tới backend (${BACKEND_URL}). Spring Boot đã chạy chưa?`)
  }
}

// ---------------------------------------------------------------------------
// Refresh token

/** Access token còn hạn thì dùng luôn, sắp hết hạn thì làm mới trước khi gửi request. */
async function getFreshAccessToken(): Promise<string | null> {
  const session = getSession()
  if (!session) return null
  if (session.accessExpiresAt - EXPIRY_SKEW_MS > Date.now()) return session.accessToken
  return refreshAccessToken(session.accessToken)
}

let refreshing: Promise<string | null> | null = null

/**
 * Trả về access token mới, hoặc null nếu không làm mới được (phải đăng nhập lại).
 * Nhiều request cùng gặp token hết hạn chỉ gọi /auth/refresh một lần: backend xoay vòng refresh token,
 * nên gọi hai lần với cùng một refresh token thì lần thứ hai sẽ bị từ chối.
 */
function refreshAccessToken(staleToken: string): Promise<string | null> {
  refreshing ??= withRefreshLock(() => doRefresh(staleToken)).finally(() => {
    refreshing = null
  })
  return refreshing
}

/** Khoá dùng chung giữa các tab, để hai tab không làm mới cùng lúc bằng cùng một refresh token. */
function withRefreshLock<T>(fn: () => Promise<T>): Promise<T> {
  return 'locks' in navigator ? navigator.locks.request('llmchat.refresh', fn) : fn()
}

async function doRefresh(staleToken: string): Promise<string | null> {
  const session = getSession()
  if (!session) return null

  // Tab khác (hoặc lần gọi trước) đã làm mới xong → dùng token mới luôn
  if (session.accessToken !== staleToken && session.accessExpiresAt - EXPIRY_SKEW_MS > Date.now()) {
    return session.accessToken
  }
  if (!session.refreshToken) return null

  const res = await send('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken: session.refreshToken }) }, null)
  if (res.status === 400 || res.status === 401) {
    // Refresh token hết hạn, đã bị thu hồi hoặc backend chưa có endpoint này
    clearSession()
    return null
  }
  if (!res.ok) {
    // Lỗi server hoặc mạng: giữ phiên, lần sau thử lại
    throw new ApiError(res.status, await readProblem(res))
  }

  const tokens = await readBody<TokenResponse>(res)
  saveSession(tokens, session.refreshToken)
  return tokens.accessToken
}

// ---------------------------------------------------------------------------
// Lỗi

/**
 * Đọc thông báo lỗi: ưu tiên `message` của envelope.
 * Vẫn đọc được Problem Details (`detail`/`title`) phòng khi một lỗi nào đó của Spring chưa được bọc envelope.
 */
async function readProblem(res: Response): Promise<string> {
  const fallback = defaultMessage(res.status)
  try {
    const text = await res.text()
    if (!text) return fallback
    const body = JSON.parse(text) as { message?: string | null; detail?: string; title?: string }
    return body.message || body.detail || body.title || fallback
  } catch {
    return fallback
  }
}

function defaultMessage(status: number): string {
  switch (status) {
    case 400: return 'Dữ liệu không hợp lệ'
    case 401: return 'Bạn cần đăng nhập'
    case 403: return 'Bạn không có quyền làm việc này'
    case 404: return 'Không tìm thấy (backend đã có endpoint này chưa?)'
    case 409: return 'Dữ liệu bị trùng'
    case 500: return 'Lỗi server – xem log của Spring Boot'
    case 502: case 503: case 504: return 'Backend chưa chạy hoặc gọi LLM thất bại'
    default: return `Lỗi ${status}`
  }
}
