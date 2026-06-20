/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#C9A84C',
          50:  '#FBF5E6',
          100: '#F4E4B8',
          200: '#EDD28A',
          300: '#E6C05C',
          400: '#C9A84C',
          500: '#A8893D',
          600: '#876A2E',
          700: '#664B1F',
          800: '#452C10',
          900: '#240D01',
        },
      },
    },
  },
  plugins: [],
}
