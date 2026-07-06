/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f4f9f8",
          100: "#d9ece9",
          300: "#8fc8be",
          500: "#2f8f83",
          700: "#21665d",
          900: "#133b36"
        }
      }
    }
  },
  plugins: []
};
