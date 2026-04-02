/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // DOLU LOGISTICS — Brand Blues (from logo)
        primary: {
          50: '#EFF6FF',  // very light blue
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#1558B0', // Main Brand Blue
          600: '#0F4C9E',
          700: '#0B3C7A', // Deep Navy
          800: '#082F61',
          900: '#06244B',
        },

        // DOLU LOGISTICS — Lemon Accent (from logo text)
        accent: {
          50: '#F7FEE7',
          100: '#ECFCCB',
          200: '#D9F99D',
          300: '#BEF264',
          400: '#A6E22E', // Lemon / Electric Green
          500: '#8BCF1A', // Accent Dark (hover/active)
          600: '#76B312',
          700: '#5E8F0E',
          800: '#466B0A',
          900: '#2E4706',
        },

        // Background / text tuned for a clean bluish-light feel (not loud)
        background: '#F7FAFF', // Cool light blue-white
        text: '#0F172A',       // Slightly blue-tinted dark (better than pure black)
        muted: '#334155',      // Secondary text
        border: '#E2E8F0',

        success: '#16A34A',    // Clean green (for success states)
      },

      // Brand gradient utility (use: bg-brand-gradient)
      backgroundImage: {
        'brand-gradient':
          'linear-gradient(135deg, #0B3C7A 0%, #1558B0 50%, #2F7EDB 100%)',
      },

      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },

      boxShadow: {
        'custom-sm': '0 2px 4px rgba(2, 6, 23, 0.05)',
        'custom-md': '0 4px 10px rgba(2, 6, 23, 0.10)',
        'custom-lg': '0 16px 30px rgba(2, 6, 23, 0.12)',
      },

      animation: {
        'fade-in': 'fadeIn 0.6s ease-in-out',
        'slide-up': 'slideUp 0.6s ease-in-out',
        'ping-subtle': 'pingSubtle 2.5s cubic-bezier(0, 0, 0.2, 1) infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pingSubtle: {
          '75%, 100%': { transform: 'scale(1.4)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
