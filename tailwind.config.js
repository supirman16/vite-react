/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      keyframes: {
        'fade-in': {
          'from': { opacity: '0', transform: 'scale(0.95)' },
          'to': { opacity: '1', transform: 'scale(1)' },
        },
        'fade-in-fast': {
            'from': { opacity: '0' },
            'to': { opacity: '1' },
        },
        'slide-up-fade': {
            'from': { opacity: '0', transform: 'translateY(10px)' },
            'to': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': { // <-- Animasi baru
          'from': { transform: 'translateX(-100%)' },
          'to': { transform: 'translateX(0)' },
        }
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out forwards',
        'fade-in-fast': 'fade-in-fast 0.2s ease-out forwards',
        'slide-up-fade': 'slide-up-fade 0.5s ease-out forwards',
        'slide-in': 'slide-in 0.3s ease-out forwards', // <-- Animasi baru
      }
    },
  },
  plugins: [],
}
