import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost/Vamanan1/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      // Serve backend-uploaded files (payment receipts, product images) through the dev server.
      '/uploads': {
        target: 'http://localhost/Vamanan1',
        changeOrigin: true
      }
    }
  },
})
