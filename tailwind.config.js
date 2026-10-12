/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81'
        },
        ink: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#080D17'
        },
        mint: '#10B981',
        coral: '#F43F5E',
        sun: '#F59E0B'
      },
      fontFamily: {
        display: ['"Segoe UI"', 'system-ui', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
        word: ['Georgia', '"Times New Roman"', 'serif']
      },
      borderRadius: {
        xl2: '1.25rem',
        xl3: '1.75rem'
      },
      boxShadow: {
        soft: '0 10px 30px -12px rgba(15, 23, 42, 0.25)',
        glow: '0 12px 40px -12px rgba(99, 102, 241, 0.65)',
        card: '0 2px 12px -4px rgba(15, 23, 42, 0.12)'
      },
      keyframes: {
        pop: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '60%': { transform: 'scale(1.03)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        shake: {
          '0%,100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-7px)' },
          '40%': { transform: 'translateX(6px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(3px)' }
        },
        floatUp: {
          '0%': { transform: 'translateY(6px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        heartbeat: {
          '0%,100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.08)' }
        }
      },
      animation: {
        pop: 'pop 260ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        shake: 'shake 400ms ease-in-out',
        floatUp: 'floatUp 220ms ease-out',
        shimmer: 'shimmer 2.4s linear infinite',
        heartbeat: 'heartbeat 1.1s ease-in-out infinite'
      }
    }
  },
  plugins: []
}
