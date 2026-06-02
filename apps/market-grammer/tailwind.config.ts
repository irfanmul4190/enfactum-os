import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        sans: ["'IBM Plex Sans'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
        serif: ["'IBM Plex Serif'", "serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        "border-subtle": "hsl(var(--border-subtle))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: "hsl(var(--surface))",
        elevated: "hsl(var(--elevated))",
        "text-secondary": "hsl(var(--text-secondary))",
        highlight: "hsl(var(--highlight))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Brand specific
        brand: {
          blue: "#0057FF",
          electric: "#2979FF",
          "blue-600": "#0042CC",
          "blue-700": "#002E99",
          "blue-900": "#000D33",
          midnight: "#0A0F1E",
          "neutral-800": "#0D1020",
          "neutral-700": "#141829",
          "neutral-600": "#252A47",
          "neutral-400": "#6B7290",
          "neutral-200": "#C8CDD9",
          violet: "#7C3AED",
          emerald: "#059669",
          amber: "#D97706",
        },
      },
      borderRadius: {
        xl: "0.75rem",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-dot-decel": {
          "0%": { left: "0%" },
          "100%": { left: "calc(100% - 12px)" },
        },
        "slide-dot-accel": {
          "0%": { left: "0%" },
          "100%": { left: "calc(100% - 12px)" },
        },
        "count-pulse": {
          "0%": { opacity: "0.4" },
          "50%": { opacity: "1" },
          "100%": { opacity: "0.4" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s ease-out forwards",
        "dot-decel": "slide-dot-decel 1.5s cubic-bezier(0.0,0.0,0.2,1.0) infinite",
        "dot-accel": "slide-dot-accel 1.5s cubic-bezier(0.4,0.0,1.0,1.0) infinite",
        "dot-standard": "slide-dot-decel 1.5s cubic-bezier(0.4,0.0,0.2,1.0) infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
