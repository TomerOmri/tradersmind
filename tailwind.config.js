/** @type {import('tailwindcss').Config} */
import forms from "@tailwindcss/forms";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f5f7ff",
          100: "#ebf0fe",
          200: "#d6e0fd",
          300: "#b3c7fb",
          400: "#89a7f8",
          500: "#6687f4",
          600: "#3d5cea",
          700: "#2e45d4",
          800: "#2838ad",
          900: "#253489",
          950: "#1a2356",
        },
      },
    },
  },
  plugins: [forms],
};
