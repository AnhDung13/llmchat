// Khớp với docs/api-contract.md

export type User = {
  id: number
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
  id: number
  title: string
  createdAt: string
  updatedAt: string
}

export type Role = 'user' | 'assistant'

export type Message = {
  id: number
  role: Role
  content: string
  createdAt: string
}

/** Các sự kiện frontend nhận được khi gửi một tin nhắn, dù backend trả JSON hay SSE. */
export type ChatEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; message: Message }

export type RegisterInput = { email: string; password: string; displayName: string }
export type LoginInput = { email: string; password: string }
