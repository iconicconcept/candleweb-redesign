/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./components/**/*.{js,jsx,ts,tsx}",
    "./hooks/**/*.{js,jsx,ts,tsx}",
    "./design/**/*.{js,jsx,ts,tsx}",
    "./layout/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        "dark-primary": "var(--dark-primary)",
        "txt-primary": "var(--text-primary)",
        "l-red": "var(--light-red)",
        background: "var(--bg-color)",
        card: "var(--card-bg)",
        "card-light": "var(--card-light)",
        "card-transparent": "var(--card-transparent)",
        "card-support": "var(--card-support)",
        dark: "var(--text-dark)",
        secondary: "var(--secondary)",
        txtSec: "var(--text-secondary)",
      },
    },
    screens: {
      xs: { max: "320px" },
      sm: { max: "600px" },
      // => @media (min-width: 640px) { ... }

      md: "600px",
      // => @media (min-width: 768px) { ... }
      ms: { min: "600px", max: "1065px" },
      ml: "768px",
      lg: "1000px",
      // => @media (min-width: 1024px) { ... }

      xl: "1280px",
      // => @media (min-width: 1280px) { ... }

      "2xl": "1536px",
      // => @media (min-width: 1536px) { ... }
    },
    backgroundImage: {
      "card-gradient":
        "linear-gradient(180deg, rgba(255, 255, 255, 0.2166) -8.27%, rgba(5, 119, 171, 0.0342) 106.43%)",
      "bottom-stack": "linear-gradient(180deg, #72FFBB 0%, #3CFE38 100%)",
    },
  },
  plugins: [],
};
