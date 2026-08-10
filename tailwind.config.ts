import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Pine — deep kitchen green (enamel cookware, herb garden).
        brand: {
          50: "#EFF6F2",
          100: "#DCEAE1",
          200: "#B9D5C3",
          300: "#8FB89F",
          400: "#5F9678",
          500: "#3D7A5C",
          600: "#2C6349",
          700: "#234F3C",
          800: "#1D4032",
          900: "#173529",
          950: "#0B1F17"
        },
        // Copper — hot pans, brass scales, warm light on the workbench.
        copper: {
          50: "#FBF3EA",
          100: "#F6E4D1",
          200: "#ECC7A4",
          300: "#DFA570",
          400: "#D1833E",
          500: "#B5651D",
          600: "#94521A",
          700: "#764119",
          800: "#5A3316",
          900: "#3D2311"
        },
        // Ink — warm espresso charcoal (roast, cast iron, paper tag).
        ink: {
          50: "#FAF9F7",
          100: "#F1EFEA",
          200: "#E3E0D8",
          300: "#C9C4B9",
          400: "#A8A296",
          500: "#86806F",
          600: "#6B6557",
          700: "#524D42",
          800: "#37342C",
          900: "#26241F",
          950: "#171512"
        },
        // Paper — the kitchen work surface (recipes on the counter).
        paper: "#F6F4ED",
        linen: "#EFEBE2",
        // shadcn/ui semantic tokens — mapped to the Cook's Workbench palette.
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        }
      },
      fontFamily: {
        sans: ["var(--font-instrument)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-bricolage)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-space-mono)", "ui-monospace", "SFMono-Regular", "monospace"]
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(23 21 18 / 0.06), 0 1px 3px 0 rgb(23 21 18 / 0.05)",
        lift: "0 10px 30px -6px rgb(23 21 18 / 0.18)",
        paper: "0 1px 0 0 rgb(23 21 18 / 0.05), 0 6px 24px -8px rgb(23 21 18 / 0.12)"
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" }
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out"
      }
    }
  },
  plugins: []
};
export default config;
