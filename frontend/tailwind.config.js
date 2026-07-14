/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          950: 'var(--bg-main)',
          900: 'var(--bg-card)',
          850: 'var(--bg-input)',
          800: 'var(--border-color)',
          700: 'var(--border-hover)',
          600: 'var(--text-muted)',
          500: 'var(--text-muted)',
          400: 'var(--text-muted)',
          300: 'var(--text-main)',
          200: 'var(--text-main)',
          100: 'var(--text-title)',
        },
        blue: {
          600: 'var(--accent-primary)',
          500: 'var(--accent-hover)',
          400: 'var(--accent-light)',
        }
      }
    },
  },
  plugins: [],
}

