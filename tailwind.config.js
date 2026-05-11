/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["var(--font-geist)", "Inter", "system-ui", "sans-serif"] },
      colors: {
        brand: { DEFAULT: "#6366f1", hover: "#4f46e5" },
      },
    },
  },
  plugins: [],
};
