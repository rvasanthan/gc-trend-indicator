import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base path for deployment
  // - Use '/gc-trend-indicator/' for GitHub Pages or GitLab Pages
  // - Use '/' for Vercel, Netlify, or custom domain
  base: '/gc-trend-indicator/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Optimize chunks for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'chart-vendor': ['recharts'],
        },
      },
    },
  },
})
