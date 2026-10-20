# API contract — llmchat

Đây là "hợp đồng" giữa frontend (`apps/web`) và backend (`apps/api`).
Frontend đã code theo đúng tài liệu này. Bạn implement backend sao cho khớp,
giao diện sẽ chạy mà không phải sửa gì phía web.

- Base URL: `/api`. Khi dev, Vite proxy `/api/*` sang `http://localhost:8081`
  (xem `apps/web/vite.config.ts`), nên **không cần cấu hình CORS** lúc dev.
- Body request/response là JSON (`Content-Type: application/json`),
  trừ endpoint stream ở bước 6.
- Thời gian là chuỗi ISO-8601 UTC, ví dụ `"2026-10-19T09:30:00Z"`
  (kiểu `java.time.Instant` của Java serialize ra đúng dạng này).
- `id` là số nguyên (`BIGINT` tự tăng trong DB, `long` trong Java).

## Xác thực

Mọi endpoint **trừ** 4 endpoint `POST /api/auth/register`, `/login`, `/refresh`, `/logout` đều cần header:

```
Authorization: Bearer <accessToken>
```

Thiếu token, token sai hoặc token hết hạn → `401`. Khi nhận `401`, frontend gọi `POST /api/auth/refresh`
một lần rồi gửi lại request. Refresh cũng thất bại thì frontend đăng xuất và đưa người dùng về trang đăng nhập.

## Lỗi

Trả lỗi theo chuẩn **Problem Details** (RFC 9457). Spring hỗ trợ sẵn qua lớp `ProblemDetail`.

```json
{ "type": "about:blank", "title": "Conflict", "status": 409, "detail": "Email đã được đăng ký" }
```

Frontend hiển thị `detail`, không có thì hiển thị `title`.

| Mã | Khi nào |
|---|---|
| 400 | Dữ liệu không hợp lệ (validation) |
| 401 | Chưa đăng nhập, sai mật khẩu, token không hợp lệ |
| 404 | Không tìm thấy, **hoặc** conversation không thuộc về user đang đăng nhập |
| 409 | Email đã tồn tại |
| 502 | Gọi LLM thất bại |

## Kiểu dữ liệu

```ts
type User = {
  id: number
  email: string
  displayName: string
  createdAt: string
}

type Conversation = {
  id: number
  title: string
  createdAt: string
  updatedAt: string   // cập nhật mỗi khi có tin nhắn mới
}

type Message = {
  id: number
  role: "user" | "assistant"
  content: string     // assistant trả về Markdown
  createdAt: string
}
```

---

## Bước 2 – Đăng ký

### `POST /api/auth/register`

Request:
```json
{ "email": "an@example.com", "password": "matkhau123", "displayName": "An" }
```

Validation:
- `email`: bắt buộc, đúng định dạng email.
- `password`: bắt buộc, tối thiểu 8 ký tự.
- `displayName`: bắt buộc, 1–50 ký tự.

Response `201 Created`: một `User`. **Không bao giờ trả mật khẩu hay hash.**

Lỗi: `400` (validation), `409` (email đã tồn tại).

---

## Bước 3 – Đăng nhập (JWT)

### `POST /api/auth/login`

Request:
```json
{ "email": "an@example.com", "password": "matkhau123" }
```

Response `200 OK`:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "refreshToken": "x7Kp2v...",
  "user": { "id": 1, "email": "an@example.com", "displayName": "An", "createdAt": "..." }
}
```

- `accessToken`: JWT, sống ngắn (gợi ý 15 phút). Claim `sub` = id của user (dạng chuỗi), cùng `iat` và `exp`.
- `expiresIn`: số giây access token còn hạn. Frontend dựa vào số này để biết khi nào cần refresh.
- `refreshToken`: chuỗi ngẫu nhiên, sống dài (gợi ý 14 ngày). Chi tiết ở phần [Refresh token](#refresh-token).

Lỗi: `401` nếu sai email hoặc mật khẩu. Không nói rõ sai cái nào, để tránh lộ email nào đã đăng ký.

### `GET /api/me`

Response `200 OK`: `User` của người đang đăng nhập (lấy từ claim `sub` trong JWT).

---

## Refresh token

Access token sống ngắn để nếu bị lộ thì cũng nhanh hết hạn. Refresh token sống dài, chỉ dùng để
xin access token mới, nhờ vậy người dùng không phải đăng nhập lại mỗi 15 phút.

| | Access token | Refresh token |
|---|---|---|
| Dạng | JWT (backend kiểm tra bằng chữ ký, không cần DB) | Chuỗi ngẫu nhiên, **không phải JWT** |
| Sống | ~15 phút | ~14 ngày |
| Gửi ở đâu | Header `Authorization` mọi request | Chỉ body của `/auth/refresh` và `/auth/logout` |
| Thu hồi được? | Không (chờ hết hạn) | Có: xoá hoặc đánh dấu trong DB |

### `POST /api/auth/refresh`

Không cần header `Authorization`, vì lúc gọi endpoint này access token thường đã hết hạn.

Request:
```json
{ "refreshToken": "x7Kp2v..." }
```

Response `200 OK`:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "refreshToken": "Qm9r4a..."
}
```

- **Xoay vòng (rotation):** mỗi lần refresh, backend cấp refresh token **mới** và thu hồi cái cũ.
  Refresh token cũ dùng lại → `401`. Frontend đã đảm bảo chỉ gọi refresh một lần, kể cả khi
  nhiều request hay nhiều tab cùng hết hạn một lúc.
- Lỗi: `401` nếu refresh token không tồn tại, hết hạn hoặc đã bị thu hồi. Frontend nhận `401` sẽ đăng xuất.

### `POST /api/auth/logout`

Không cần header `Authorization`.

Request:
```json
{ "refreshToken": "x7Kp2v..." }
```

Response `204 No Content`: thu hồi refresh token đó. Token không tồn tại cũng trả `204`.
Frontend đã tự xoá token phía trình duyệt, endpoint này chỉ để refresh token không dùng lại được nữa.

### Gợi ý phía backend

- Tạo refresh token: 32 byte từ `SecureRandom`, mã hoá Base64 URL-safe.
- **Chỉ lưu hash** (SHA-256) của refresh token trong DB, giống như không lưu mật khẩu gốc.
  Lộ DB thì kẻ tấn công cũng không có token để dùng.
- Bảng gợi ý:

```sql
CREATE TABLE refresh_tokens (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(64) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

- `/auth/refresh`: tìm theo `token_hash`, kiểm tra `revoked_at IS NULL` và `expires_at > now()`,
  đặt `revoked_at = now()` cho token cũ, tạo token mới. Làm tất cả trong một `@Transactional`.

---

## Bước 4–5 – Hội thoại và tin nhắn

### `GET /api/conversations`

Response `200 OK`: `Conversation[]` của user hiện tại, **mới nhất trước** (`updatedAt` giảm dần).

### `POST /api/conversations`

Request (có thể là body rỗng `{}`):
```json
{ "title": "Học Spring" }
```

Response `201 Created`: `Conversation`. Không có `title` thì dùng `"Cuộc trò chuyện mới"`.

### `DELETE /api/conversations/{id}`

Response `204 No Content`. Xoá luôn các tin nhắn của conversation đó. `404` nếu không thuộc user hiện tại.

### `GET /api/conversations/{id}/messages`

Response `200 OK`: `Message[]`, **cũ nhất trước** (`createdAt` tăng dần).

### `POST /api/conversations/{id}/messages` — gửi tin nhắn

Request:
```json
{ "content": "Spring Boot là gì?" }
```

Frontend gửi header `Accept: text/event-stream, application/json`. Backend được chọn **một trong hai** kiểu trả lời. Frontend xử lý được cả hai, nên bạn làm kiểu A trước rồi nâng cấp lên kiểu B.

Việc backend phải làm:
1. Lưu tin nhắn của user.
2. Lấy lịch sử tin nhắn của conversation, gửi cho LLM.
3. Lưu câu trả lời của LLM thành tin nhắn `assistant`.
4. Cập nhật `updatedAt` của conversation. Nếu đây là tin nhắn đầu tiên, nên đặt `title` = khoảng 40 ký tự đầu của tin nhắn.

#### Kiểu A — JSON, không stream (bước 4–5)

`200 OK`, `Content-Type: application/json`:
```json
{
  "userMessage":      { "id": 10, "role": "user",      "content": "Spring Boot là gì?", "createdAt": "..." },
  "assistantMessage": { "id": 11, "role": "assistant", "content": "**Spring Boot** là ...", "createdAt": "..." }
}
```

#### Kiểu B — SSE stream (bước 6)

`200 OK`, `Content-Type: text/event-stream`. Mỗi event có dạng `event:` + `data:` (JSON) + một dòng trống:

```
event: delta
data: {"text":"**Spring"}

event: delta
data: {"text":" Boot** là"}

event: done
data: {"id":11,"role":"assistant","content":"**Spring Boot** là ...","createdAt":"..."}

```

| Event | `data` | Ý nghĩa |
|---|---|---|
| `delta` | `{"text": "..."}` | Một đoạn chữ mới. Frontend nối dần vào câu trả lời |
| `done` | `Message` | Câu trả lời đầy đủ, đã lưu DB. Kết thúc stream |
| `error` | `{"message": "..."}` | Lỗi giữa chừng (ví dụ LLM lỗi). Kết thúc stream |

Gợi ý phía Spring: `SseEmitter` với `SseEmitter.event().name("delta").data(...)`.

Người dùng bấm **Dừng** thì frontend huỷ request (`AbortController`). Phía Spring sẽ thấy kết nối bị đóng (`IOException` khi gửi tiếp), lúc đó nên ngừng đọc từ LLM.

---

## Thứ tự làm và endpoint cần có

| Bước | Endpoint | Giao diện dùng được |
|---|---|---|
| 2 | `POST /api/auth/register` | Trang đăng ký |
| 3 | `POST /api/auth/login`, `GET /api/me` | Đăng nhập, vào trang chat (danh sách trống, báo lỗi khi gửi tin) |
| 4–5 | 4 endpoint conversations/messages, trả kiểu A | Chat đầy đủ, câu trả lời hiện một lần |
| 6 | Gửi tin nhắn trả kiểu B | Chữ hiện dần, nút Dừng |
| 7 | `POST /api/auth/refresh`, `POST /api/auth/logout` | Không bị đăng xuất sau khi access token hết hạn |
