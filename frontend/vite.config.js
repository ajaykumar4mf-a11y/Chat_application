import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// Auto-reloaded for react-router-dom and react-hot-toast
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://chat-application-backend-eafa.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'https://chat-application-backend-eafa.onrender.com',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
