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
          gold: '#D4AF37',
          'gold-light': '#F7E8AC',
          'gold-dark': '#A37F16',
          maroon: '#3B1B10',
          'maroon-dark': '#1F0B05',
          cream: '#FAF6F0',
          'cream-card': '#FFFFFF',
          leaf: '#1E5128',
        },
        primary: {
          50: '#FAF4E1',
          100: '#F4E5B8',
          200: '#ECCB75',
          300: '#E5C158',
          400: '#DEB041',
          500: '#D4AF37', // Brand Royal Gold
          600: '#C59B27',
          700: '#9C781A',
          800: '#735711',
          900: '#4A370A',
        },
        secondary: {
          50: '#F7F2EF',
          100: '#ECE0DA',
          500: '#542819',
          800: '#3B1B10', // Deep Royal Maroon
          900: '#240F08', // Dark Cocoa
        },
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif'],
        serif: ['Playfair Display', 'Merriweather', 'serif'],
      },
      boxShadow: {
        'glass-light': '0 8px 32px 0 rgba(212, 175, 55, 0.12)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'gold-glow': '0 0 25px rgba(212, 175, 55, 0.3)',
      },
    },
  },
  plugins: [],
}
