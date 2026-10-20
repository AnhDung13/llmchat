/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Địa chỉ backend Spring Boot, ví dụ http://localhost:8081 (đặt trong .env.local) */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
