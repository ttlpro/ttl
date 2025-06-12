/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './renderer/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './renderer/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // Enable dark mode với class strategy
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        tiktok: {
          primary: '#fe2c55',
          secondary: '#25f4ee',
          dark: '#161823',
          darker: '#0f0f0f',
        }
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
