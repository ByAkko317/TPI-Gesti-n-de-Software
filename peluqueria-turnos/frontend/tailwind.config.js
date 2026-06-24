/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FBF8F3",
        clay: {
          50: "#F6EDE6",
          100: "#EAD7C8",
          400: "#C08457",
          500: "#A86A3D",
          600: "#8C5530",
        },
        ink: "#2B2622",
      },
      fontFamily: {
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontWeight: {
        400: "400",
        500: "500",
        600: "600",
      },
    },
  },
  plugins: [],
};