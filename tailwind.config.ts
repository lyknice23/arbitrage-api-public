/** @type {import("tailwindcss").Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dbe8ff",
          200: "#bac8ff",
          300: "#9996ff",
          400: "#7a6bff",
          500: "#5c4bff",
          600: "#4d3fdd",
          700: "#4035b8",
          800: "#352d91",
          900: "#2a2470"
        }
      }
    }
  },
  plugins: []
};
