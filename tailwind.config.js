/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        iosDark: "#1C1C1E",
        iosGray: "#2C2C2E",
        iosBlue: "#0A84FF",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
