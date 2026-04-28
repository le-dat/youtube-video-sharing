/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FDC800',
        secondary: '#432DD7',
        success: '#16A34A',
        warning: '#D97706',
        danger: '#DC2626',
        surface: '#FBFBF9',
        'text-primary': '#1C293C',
        'text-secondary': '#6B7280',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': '13px',
        xs: '15px',
        sm: '17px',
        base: '21px',
        lg: '27px',
        '2xl': '35px',
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '6': '24px',
        '8': '32px',
      },
      boxShadow: {
        'neo': '4px 4px 0px 0px #1C293C',
        'neo-sm': '2px 2px 0px 0px #1C293C',
        'neo-lg': '6px 6px 0px 0px #1C293C',
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
}
