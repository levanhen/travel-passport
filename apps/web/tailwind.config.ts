import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#0891b2',
          foreground: '#ffffff',
          hover: '#0e7490',
        },
        ocean: {
          DEFAULT: '#0891b2',
          dark: '#0e7490',
          light: '#e0f2fe',
        },
        sand: {
          DEFAULT: '#fef7ed',
          dark: '#fed7aa',
        },
        admin: {
          DEFAULT: '#1e40af',
          foreground: '#ffffff',
        },
        merchant: {
          DEFAULT: '#ea580c',
          foreground: '#ffffff',
        },
        muted: '#64748b',
        border: '#e2e8f0',
        surface: '#f8fafc',
        error: '#b00020',
        success: '#2e7d32',
      },
      maxWidth: {
        tourist: '480px',
        'login-form': '400px',
      },
      width: {
        sidebar: '240px',
      },
      boxShadow: {
        card: '0 4px 14px rgba(8, 145, 178, 0.08)',
        'card-hover': '0 8px 24px rgba(8, 145, 178, 0.12)',
      },
      backgroundImage: {
        'tourist-shell': 'linear-gradient(180deg, #e0f2fe 0%, #fef7ed 45%, #ffffff 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
