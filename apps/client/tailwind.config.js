/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/components/**/*.{js,jsx,ts,tsx}",
    "../../packages/ui/hooks/**/*.{js,jsx,ts,tsx}",
    "../../packages/ui/design/**/*.{js,jsx,ts,tsx}",
    "../../packages/ui/layout/**/*.{js,jsx,ts,tsx}",
    "!./node_modules/**",
  ],
  safelist: [
    "text-2xl",
    "text-3xl",
    {
      pattern: /(max-w|h)-./,
    },
  ],
  theme: {
    extend: {
      boxShadow: {
        stat: "12px 20px 40px rgba(13, 13, 13, 0.6)",
      },
      colors: {
        primary: "var(--primary)",
        "dark-primary": "var(--dark-primary)",
        "txt-primary": "var(--text-primary)",
        "txt-yellow": "var(--text-yellow)",
        "l-red": "var(--light-red)",
        background: "var(--bg-color)",
        card: "var(--card-bg)",
        "card-light": "var(--card-light)",
        "card-transparent": "var(--card-transparent)",
        "card-support": "var(--card-support)",
        dark: "var(--text-dark)",
        secondary: "var(--secondary)",
        txtSec: "var(--text-secondary)",
        txtGray: "var(--text-gray)",
      },
      spacing: {
        web: "-webkit-fill-available",
      },
    },

    screens: {
      xs: { max: "330px" },
      sm: { max: "600px" },
      sl: { min: "600px", max: "768px" },
      tb: { max: "769px" },
      tl: "768px",
      ai: { max: "900px", min: "768px" },
      md: "600px",
      // => @media (min-width: 768px) { ... }
      ms: { min: "600px", max: "1000px" },
      lg: { max: "1065px" },

      // => @media (max-width: 1065px) { ... }

      xl: "1280px",
      // => @media (min-width: 1280px) { ... }

      "2xl": "1536px",
      // => @media (min-width: 1536px) { ... }
    },
    backgroundImage: {
      "card-gradient":
        "linear-gradient(180deg, rgba(255, 255, 255, 0.2166) -8.27%, rgba(5, 119, 171, 0.0342) 106.43%)",
      "bottom-stack": "linear-gradient(180deg, #72FFBB 0%, #3CFE38 100%)",
      // wave: "url('/public/wave.svg')",
    },
  },
  plugins: [],
};
