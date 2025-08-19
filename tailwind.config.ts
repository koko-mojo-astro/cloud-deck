import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        text: {
          primary: "var(--foreground)",
        },
        brand: {
          green: "#00A550",
          "green-dark": "#008040",
          red: "#EC1C24",
          "red-dark": "#D01017",
        },
      },
      spacing: {
        xs: "0.25rem",
        sm: "0.5rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.5rem",
        "2xl": "2rem",
        "4xl": "4rem",
        "6xl": "6rem",
      },
      fontFamily: {
        brand: ["var(--font-montserrat-sans)", "sans-serif"],
      },
      keyframes: {
        bounceIn: {
          "0%": { transform: "scale(0.3)", opacity: "0" },
          "50%": { transform: "scale(1.05)" },
          "70%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)", opacity: "1" }
        }
      },
      animation: {
        bounceIn: "bounceIn 0.5s ease-in-out"
      }
    },
  },
  plugins: [],
} satisfies Config;
