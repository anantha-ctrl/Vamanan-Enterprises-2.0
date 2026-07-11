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
    // Pin the HMR websocket so the client always connects to localhost:5173.
    // Without this, `host: true` (0.0.0.0) leaves the browser unable to infer the
    // ws host — the handshake fails and stale modules get served as text/html.
    hmr: {
      host: 'localhost',
      protocol: 'ws',
      clientPort: 5173,
    },
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
