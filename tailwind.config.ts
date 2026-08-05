import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#FFF1F2',
        ink:   '#23211D',
        line:  '#FFE4E6',
        botanical: {
          50:  '#FFF1F2',
          100: '#FFE4E6',
          200: '#FECDD3',
          300: '#FDA4AF',
          400: '#FB7185',
          500: '#F43F5E',
          600: '#E11D48',
        },
        safe: {
          DEFAULT: '#3F6B4E',
          bg:      '#E8EEE9',
        },
        caution: {
          DEFAULT: '#B4772A',
          bg:      '#F5EBDD',
        },
        unsafe: {
          DEFAULT: '#A23B32',
          bg:      '#F3E4E2',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body:    ['var(--font-body)', 'sans-serif'],
        mono:    ['var(--font-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
