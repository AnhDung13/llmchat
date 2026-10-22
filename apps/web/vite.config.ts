import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Đọc .env, .env.local... trong apps/web
  const env = loadEnv(mode, import.meta.dirname)
  // Cổng 8081 vì cổng 8080 trên máy này đã bị một container Docker chiếm
  const apiUrl = env.VITE_API_URL || 'http://localhost:8081'

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      // import '@/...' = import từ src/ (shadcn dùng alias này)
      alias: { '@': path.resolve(import.meta.dirname, './src') },
    },
    server: {
      port: 5173,
      proxy: {
        // Trình duyệt gọi /api/... trên cùng origin với Vite, Vite chuyển tiếp sang Spring → không cần CORS khi dev.
        '/api': { target: apiUrl, changeOrigin: true },
      },
    },
  }
})
