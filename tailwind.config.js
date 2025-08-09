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
        'slide-in': {
          'from': { transform: 'translateX(-100%)' },
          'to': { transform: 'translateX(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { 
            borderColor: 'rgba(168, 85, 247, 0.4)',
            boxShadow: '0 0 10px rgba(168, 85, 247, 0.2)'
          },
          '50%': { 
            borderColor: 'rgba(34, 211, 238, 0.4)',
            boxShadow: '0 0 20px rgba(34, 211, 238, 0.2)'
           },
        },
        // --- PENAMBAHAN BARU ---
        'background-pan': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        }
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out forwards',
        'fade-in-fast': 'fade-in-fast 0.2s ease-out forwards',
        'slide-up-fade': 'slide-up-fade 0.5s ease-out forwards',
        'slide-in': 'slide-in 0.3s ease-out forwards',
        'pulse-glow': 'pulse-glow 4s ease-in-out infinite',
        // --- PENAMBAHAN BARU ---
        'background-pan': 'background-pan 15s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
