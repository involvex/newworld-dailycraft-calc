import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  base: process.env.NODE_ENV === 'production' ? '/newworld-dailycraft-calc/' : './',
  server: {
    host: true, // Listen on all addresses
    port: 3000, // Default port
    strictPort: true // Fail if port is already in use
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Disable sourcemaps for production
    rollupOptions: {
      input: './index.html'
    }
  }
})