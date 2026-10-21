// Các endpoint của backend, khớp với docs/api-contract.md

import { ApiError, json, readBody, request } from './http'
import { readSse } from './sse'
import type { ChatEvent, Conversation, LoginInput, LoginResponse, Message, RegisterInput, User } from './types'

const post = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) })

export const api = {
  register: (input: RegisterInput) => json<User>('/auth/register', post(input), { auth: false }),

  login: (input: LoginInput) => json<LoginResponse>('/auth/login', post(input), { auth: false }),

  /** Thu hồi refresh token ở backend */
  logout: async (refreshToken: string) => {
    await request('/auth/logout', post({ refreshToken }), { auth: false })
  },

  me: () => json<User>('/me'),

  listConversations: () => json<Conversation[]>('/conversations'),

  createConversation: (title?: string) => json<Conversation>('/conversations', post(title ? { title } : {})),

  deleteConversation: async (id: number) => {
    await request(`/conversations/${id}`, { method: 'DELETE' })
  },

  listMessages: (conversationId: number) => json<Message[]>(`/conversations/${conversationId}/messages`),

  async *sendMessage(conversationId: number, content: string, signal: AbortSignal): AsyncGenerator<ChatEvent> {
    const res = await request(`/conversations/${conversationId}/messages`, {
      ...post({ content }),
      headers: { Accept: 'text/event-stream, application/json' },
      signal,
    })

    // Kiểu A: backend trả JSON một lần
    if (!res.headers.get('Content-Type')?.includes('text/event-stream')) {
      const body = await readBody<{ assistantMessage: Message }>(res)
      yield { type: 'done', message: body.assistantMessage }
      return
    }

    // Kiểu B: SSE
    if (!res.body) throw new ApiError(0, 'Trình duyệt không đọc được stream')
    for await (const ev of readSse(res.body)) {
      if (ev.event === 'delta') {
        yield { type: 'delta', text: (JSON.parse(ev.data) as { text: string }).text }
      } else if (ev.event === 'done') {
        yield { type: 'done', message: JSON.parse(ev.data) as Message }
        return
      } else if (ev.event === 'error') {
        throw new ApiError(502, (JSON.parse(ev.data) as { message: string }).message)
      }
    }
    throw new ApiError(0, 'Stream kết thúc mà không có event "done"')
  },
}
