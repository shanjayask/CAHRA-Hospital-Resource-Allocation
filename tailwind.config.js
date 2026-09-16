/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        navy: {
          50: '#f0f4fa',
          100: '#dae4f2',
          200: '#b6c9e5',
          300: '#88a5d4',
          400: '#5878bf',
          500: '#3a5ba0',
          600: '#2d4884',
          700: '#243a6a',
          800: '#1c2d52',
          900: '#15223f',
          950: '#0d1629',
        },
      },
      animation: {
        'ripple-flow': 'rippleFlow 2s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-right': 'slideRight 0.5s ease-out',
        'radar-sweep': 'radarSweep 4s linear infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'bar-grow': 'barGrow 0.8s ease-out forwards',
        'count-up': 'countUp 1s ease-out',
      },
      keyframes: {
        rippleFlow: {
          '0%': { transform: 'translateY(0)', opacity: '0.3' },
          '50%': { transform: 'translateY(8px)', opacity: '1' },
          '100%': { transform: 'translateY(0)', opacity: '0.3' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(58,91,160,0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(58,91,160,0.6)' },
        },
        barGrow: {
          '0%': { width: '0%' },
          '100%': { width: 'var(--target-width)' },
        },
      },
    },
  },
  plugins: [],
};
