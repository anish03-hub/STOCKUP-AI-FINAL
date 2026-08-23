import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Honour the port assigned by the harness/environment; fall back to 5173 locally.
    port: Number(process.env.PORT) || 5173,
    proxy: {
      // Spring Boot backend (auth, items, business, predictions)
      '/api/auth': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/api/items': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/api/business': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/api/predictions': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/api/stockout': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/api/reorder': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/api/inventory': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/api/dashboard': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/api/assistant': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // Python FastAPI backend (AI chat, insights)
      '/api/chat': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api/insights': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
