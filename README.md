# llmchat

Ứng dụng chat với LLM, dự án học Java Spring Boot làm backend.

```
llmchat/
├── apps/
│   ├── api/    Spring Boot 4 · Java 17 · Spring JDBC (không ORM) · Spring Security + JWT · PostgreSQL
│   └── web/    React · Vite · TypeScript · Tailwind
└── docs/
    └── api-contract.md   ← hợp đồng API giữa web và api
```

## Chạy

Cần: Java 17, Node 20+, Docker (chạy `docker compose up -d` để bật PostgreSQL).

```
npm install                                     # lần đầu
cp apps/web/.env.example apps/web/.env.local    # lần đầu, nếu chưa có .env.local
npm run dev          # chạy cả api (http://localhost:8081) và web (http://localhost:5173)
npm run dev:api      # chỉ chạy Spring Boot
npm run test:api     # chạy test của Spring Boot
```

Mở http://localhost:5173. Web gọi `/api/...`, Vite chuyển tiếp sang `VITE_API_URL` (trong `apps/web/.env.local`) nên lúc dev backend không cần CORS.

## Lộ trình backend

| Bước | Việc | Endpoint |
|---|---|---|
| 1 | Controller đầu tiên | `GET /api/hello` |
| 2 | Bảng `users`, đăng ký (BCrypt, JdbcClient) | `POST /api/auth/register` |
| 3 | Đăng nhập trả JWT, khoá API | `POST /api/auth/login`, `GET /api/me` |
| 4 | Gọi LLM miễn phí (RestClient) | `POST /api/conversations/{id}/messages` (JSON) |
| 5 | Lưu hội thoại và tin nhắn | `GET/POST/DELETE /api/conversations...` |
| 6 | Streaming | Gửi tin nhắn trả về SSE |
| 7 | Refresh token, đăng xuất | `POST /api/auth/refresh`, `POST /api/auth/logout` |

Chi tiết từng endpoint: [docs/api-contract.md](docs/api-contract.md).
