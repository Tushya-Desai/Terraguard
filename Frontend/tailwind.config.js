/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#4C8C5C',
          dark: '#2F5C3A',
          gold: '#B8863B',
          light: '#EBF4ED',
        },
        risk: {
          low: '#3E9142',
          mod: '#E0A526',
          high: '#C24C3D',
        },
        tg: {
          bg: '#FAF7F0',
          'bg-dark': '#141813',
          surface: '#FFFFFF',
          'surface-dark': '#1E241C',
          text: '#22221E',
          'text-dark': '#F2EFE9',
          muted: '#6B6A63',
          'muted-dark': '#9E9D95',
        }
      },
      fontFamily: {
        serif: ['Lora', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(34, 34, 30, 0.06), 0 2px 6px -1px rgba(34, 34, 30, 0.04)',
        'soft-dark': '0 4px 20px -2px rgba(0, 0, 0, 0.4), 0 2px 6px -1px rgba(0, 0, 0, 0.3)',
        'lift': '0 10px 25px -5px rgba(76, 140, 92, 0.15)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
      }
    },
  },
  plugins: [],
}
