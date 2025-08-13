/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        background: '#fefcfa',
        foreground: '#2c2621',
        card: {
          DEFAULT: '#ffffff',
          foreground: '#2c2621',
        },
        popover: {
          DEFAULT: '#ffffff',
          foreground: '#2c2621',
        },
        primary: {
          DEFAULT: '#d4a574',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#f4efe8',
          foreground: '#2c2621',
        },
        muted: {
          DEFAULT: '#f7f3f0',
          foreground: '#6b6358',
        },
        accent: {
          DEFAULT: '#e8d5c4',
          foreground: '#2c2621',
        },
        destructive: {
          DEFAULT: '#e07b7b',
          foreground: '#ffffff',
        },
        border: 'rgba(212, 165, 116, 0.2)',
        input: {
          DEFAULT: 'transparent',
          background: '#f7f3f0',
        },
        ring: '#d4a574',
        memory: {
          peach: '#f2c9a1',
          coral: '#f4b4a0',
          lavender: '#ddc7e8',
          mint: '#b8e6d3',
          cream: '#f9f5f1',
          sage: '#c8d5b8',
        },
      },
      borderRadius: {
        lg: '0.75rem',
        md: 'calc(0.75rem - 2px)',
        sm: 'calc(0.75rem - 4px)',
      },
      fontWeight: {
        normal: '400',
        medium: '500',
      },
    },
  },
  plugins: [],
}