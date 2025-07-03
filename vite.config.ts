import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  base: './',
  server: {
    host: '192.168.178.69', // Replace with your local IP address
    port: 3000, // Default port
    strictPort: true // Fail if port is already in use
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: './index.html'
    }
  }
})