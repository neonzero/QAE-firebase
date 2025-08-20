/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // This enables the dark mode feature
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Scans all your source files
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}