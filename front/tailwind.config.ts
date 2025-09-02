// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class", 'html[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-muted": "rgb(var(--surface-muted) / <alpha-value>)",
        card: "rgb(var(--card) / <alpha-value>)",
        popover: "rgb(var(--popover) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        input: "rgb(var(--input) / <alpha-value>)",
        ring: "rgb(var(--ring) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        "accent-hover": "rgb(var(--accent-hover) / <alpha-value>)",
        "accent-foreground": "rgb(var(--accent-foreground) / <alpha-value>)",
        success: "rgb(var(--success) / <alpha-value>)",
        "success-foreground": "rgb(var(--success-foreground) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
        "warning-foreground": "rgb(var(--warning-foreground) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
        "danger-foreground": "rgb(var(--danger-foreground) / <alpha-value>)",
        info: "rgb(var(--info) / <alpha-value>)",
        "info-foreground": "rgb(var(--info-foreground) / <alpha-value>)",
        /* charts */
        "chart-1": "rgb(var(--chart-1) / <alpha-value>)",
        "chart-2": "rgb(var(--chart-2) / <alpha-value>)",
        "chart-3": "rgb(var(--chart-3) / <alpha-value>)",
        "chart-4": "rgb(var(--chart-4) / <alpha-value>)",
        "chart-5": "rgb(var(--chart-5) / <alpha-value>)",
        "chart-6": "rgb(var(--chart-6) / <alpha-value>)",
      },
      boxShadow: {
        soft: "0 4px 24px 0 rgb(var(--shadow) / 0.15)",
        lift: "0 8px 40px 0 rgb(var(--shadow) / 0.22)",
      },
      borderRadius: {
        xl2: "1rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
