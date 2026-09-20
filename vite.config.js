import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Honour the port assigned by the harness/environment; fall back to 5173 locally.
    port: Number(process.env.PORT) || 5173,
    proxy: {
      // Proxy all /api requests to Spring Boot backend (port 8080)
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})

