import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'



export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
  plugins: [react()],
  define: {
    'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
  },
  publicDir: 'public',
  base: process.env.VITE_BASE_URL || './',
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
      input: './index.html',
      external: [
        "fokusnewworldscreenshot.ps1"
      ]
    }
  },
}
});