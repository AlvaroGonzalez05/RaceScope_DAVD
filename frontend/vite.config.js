import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    },
  },
  // --- AÑADE ESTO PARA EL DESARROLLO LOCAL ---
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
      '/strategies': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/maps': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      }
    }
  }
})