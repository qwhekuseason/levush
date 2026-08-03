/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // White Theme Flip
        ink: {
          DEFAULT: '#ffffff', // page background
          800: '#f8f9fa', // surface
          700: '#f1f3f5', // cards
          600: '#e9ecef', // borders
        },
        bone: {
          DEFAULT: '#181618', // primary dark text
          muted: '#3b3c36', // muted dark text
        },
        silver: '#c0c0c0',
        royal: {
          DEFAULT: '#00416a', // Dark Imperial Blue — accent
          deep: '#002147', // Oxford Blue — accent dark
          light: '#1a5c89',
        },
        gold: {
          DEFAULT: '#ff402c', // vibrant brand red accent (#ff402c)
          light: '#ff6352',
          deep: '#d92b18',
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        // High-contrast display serif for big all-caps landing headlines.
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      letterSpacing: {
        widest2: '0.28em',
      },
      maxWidth: {
        site: '1280px',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'ken-burns': {
          '0%': { transform: 'scale(1) translate(0, 0)' },
          '100%': { transform: 'scale(1.12) translate(-2%, -1%)' },
        },
        'slide-up-in': {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'progress-bar': {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.8s ease both',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ken-burns': 'ken-burns 5.5s ease-in-out forwards',
        'slide-up-in': 'slide-up-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        'progress-bar': 'progress-bar 5.5s linear forwards',
      },
    },
  },
  plugins: [],
};
