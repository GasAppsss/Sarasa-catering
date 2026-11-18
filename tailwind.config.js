/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'rgb(var(--sc-primary-rgb) / <alpha-value>)',
          dark: 'rgb(var(--sc-primary-dark-rgb) / <alpha-value>)',
          accent: 'rgb(var(--sc-accent-rgb) / <alpha-value>)',
          bg: 'rgb(var(--sc-bg-rgb) / <alpha-value>)',
          surface: 'rgb(var(--sc-surface-rgb) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
