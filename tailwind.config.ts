import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#1a2050',
          100: '#161c44',
          DEFAULT: '#0f1437',
          light: '#1f2660',
          dark: '#080b22',
          deepest: '#04061a',
        },
        gold: {
          DEFAULT: '#ffd34a',
          light: '#ffe17a',
          dark: '#c9a227',
        },
        fifaGreen: {
          DEFAULT: '#34d399',
          light: '#6ee7b7',
          dark: '#059669',
        },
        accent: {
          purple: '#7c3aed',
          blue: '#3b82f6',
          pink: '#ec4899',
        },
        success: '#34d399',
        danger: '#f87171',
        warning: '#fbbf24',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'glow-purple': 'radial-gradient(circle at 0% 0%, rgba(124, 58, 237, 0.18) 0%, transparent 50%)',
        'glow-blue': 'radial-gradient(circle at 100% 100%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)',
      },
    },
  },
  plugins: [],
}

export default config
