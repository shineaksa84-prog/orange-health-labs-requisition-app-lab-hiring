/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        orange: {
          50: '#FFF8F2',
          100: '#FFF0E5',
          200: '#FFE0CC',
          300: '#FFC299',
          400: '#FF944D',
          500: '#FF6B00', // Primary Brand Color
          600: '#E65A00',
          700: '#B84500',
          800: '#8A3200',
          900: '#5C2000',
        },
        brand: {
          primary: '#FF6B00',
          hover: '#E65A00',
          light: '#FFF4EC',
          subtle: '#FFE8D6',
        },
        surface: {
          bg: '#F7F7F5',
          card: '#FFFFFF',
          border: '#E8E8E8',
          hover: '#F2F2F0',
        },
        neutral: {
          900: '#171717', // Primary text
          600: '#6B6B6B', // Secondary text
          400: '#A3A3A3', // Placeholder text
          200: '#E8E8E8', // Borders
          100: '#F5F5F5',
          50: '#FAFAFA',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        'popover': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        'card': '12px',
        'badge': '6px',
      }
    },
  },
  plugins: [],
}
