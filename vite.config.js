import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    open: true,
    proxy: {
      // 1. API 请求转发
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
      // 2. 图片资源转发
      '/uploads': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      }
    }
  }
})