import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Set base to '/' if deploying to Vercel/Netlify, or '/repo-name/' for GitHub Pages
  base: '/gc-trend-indicator/',
})
