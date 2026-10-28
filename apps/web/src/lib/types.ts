// Khớp với docs/api-contract.md

/** Mọi response JSON của backend (cả thành công lẫn lỗi) đều bọc trong envelope này */
export type ApiEnvelope<T> = {
  status: number
  /** null khi thành công */
  message: string | null
  data: T
}

export type User = {
  /** UUID */
  id: string
  email: string
  displayName: string
  createdAt: string
}

/** Trả về từ POST /api/auth/refresh */
export type TokenResponse = {
  accessToken: string
  tokenType: 'Bearer'
  /** Số giây access token còn hạn */
  expiresIn: number
  refreshToken: string
}

/** Trả về từ POST /api/auth/login */
export type LoginResponse = TokenResponse & { user: User }

export type Conversation = {
  /** UUID */
  id: string
  title: string
  createdAt: string
  modifiedAt: string
}

export type Role = 'user' | 'assistant'

export type Message = {
  /** UUID */
  id: string
  role: Role
  content: string
  /** Phần suy luận của model (chỉ tin assistant); null nếu model không trả reasoning */
  reasoning?: string | null
  createdAt: string
}

/** Các sự kiện frontend nhận được khi gửi một tin nhắn, dù backend trả JSON hay SSE. */
export type ChatEvent =
  | { type: 'reasoning'; text: string }
  | { type: 'delta'; text: string }
  | { type: 'done'; message: Message }

export type RegisterInput = { email: string; password: string; displayName: string }
export type LoginInput = { email: string; password: string }
