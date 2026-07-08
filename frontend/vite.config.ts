/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    css: true,
    server: {
      deps: {
        inline: [/@mui\/material/, /@mui\/x-date-pickers/, /@date-io\/date-fns/],
      },
    },
    exclude: ['e2e/**/*', 'node_modules/**/*'],
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://tfg-backend:8080',
        changeOrigin: true,
      }
    }
  }
} as any)
