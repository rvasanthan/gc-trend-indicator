/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        'serif': ['Playfair Display', 'serif'],
      },
      colors: {
        'eb1': '#3B82F6',
        'eb2': '#8B5CF6',
        'eb3': '#F97316',
      }
    },
  },
  plugins: [],
}
