/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Terracotta-brick — primary action color
        primary: {
          50:  '#fff4f0',
          100: '#ffe4d9',
          200: '#ffc4aa',
          300: '#f99a76',
          400: '#e96848',
          500: '#C8432B',
          600: '#B03825',
          700: '#8F2D1E',
        },
        // Deep navy — structural / text accent
        navy: {
          50:  '#EEF2FF',
          100: '#C7D2FE',
          500: '#2E4080',
          700: '#1A2744',
          900: '#0F1A30',
        },
        // Warm gold — secondary accent
        gold: {
          400: '#ffd700',
          500: '#FFD635',
          600: '#e6b800',
        },
        // Reddit semantic tokens (mapped to CSS vars, auto-switch light/dark)
        reddit: {
          bg:        'var(--r-bg)',
          card:      'var(--r-card)',
          nav:       'var(--r-nav)',
          border:    'var(--r-border)',
          text:      'var(--r-text)',
          meta:      'var(--r-meta)',
          hover:     'var(--r-hover)',
          input:     'var(--r-input)',
          'input-border': 'var(--r-input-border)',
        },
      }
    }
  },
  plugins: []
}
