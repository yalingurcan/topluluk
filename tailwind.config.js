/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Reddit OrangeRed — primary action color (same in both modes)
        primary: {
          50:  '#fff3ee',
          100: '#ffe2d0',
          200: '#ffc09a',
          300: '#ff9563',
          400: '#ff6a30',
          500: '#FF4500',
          600: '#e03d00',
          700: '#b83200',
        },
        // German Gold — secondary accent (bookmarks, highlights)
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
