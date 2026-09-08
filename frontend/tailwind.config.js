/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f1f9ee",
          100: "#dcefd4",
          200: "#bbe0ac",
          300: "#8ecb78",
          400: "#63b04d",
          500: "#43922f",
          600: "#307322",
          700: "#265a1c",
          800: "#1f4718",
          900: "#193b15",
        },
        cream: "#f7faf3",
      },
      fontFamily: {
        display: ["'Poppins'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
