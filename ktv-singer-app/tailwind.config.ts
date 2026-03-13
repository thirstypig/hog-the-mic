import type { Config } from "tailwindcss";

export default {
  content: [
    "./App.tsx",
    "./src/**/*.{ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Core palette — matches the web app's CSS custom properties
        background: "#0a0a0a",
        foreground: "#fafafa",
        card: "#141414",
        "card-foreground": "#fafafa",
        primary: "#22c55e",
        "primary-foreground": "#0a0a0a",
        secondary: "#3b82f6",
        "secondary-foreground": "#fafafa",
        muted: "#262626",
        "muted-foreground": "#a3a3a3",
        accent: "#1a1a2e",
        "accent-foreground": "#fafafa",
        destructive: "#ef4444",
        "destructive-foreground": "#fafafa",
        border: "#262626",
        input: "#262626",
        ring: "#22c55e",
      },
      // tvOS 10-foot UI — larger sizes for readability at distance
      fontSize: {
        "tv-xs": ["18px", "24px"],
        "tv-sm": ["22px", "28px"],
        "tv-base": ["26px", "34px"],
        "tv-lg": ["32px", "40px"],
        "tv-xl": ["40px", "48px"],
        "tv-2xl": ["52px", "60px"],
        "tv-3xl": ["64px", "72px"],
      },
      spacing: {
        "tv-1": "8px",
        "tv-2": "16px",
        "tv-3": "24px",
        "tv-4": "32px",
        "tv-6": "48px",
        "tv-8": "64px",
        "tv-12": "96px",
      },
      borderRadius: {
        "tv-sm": "8px",
        "tv-md": "12px",
        "tv-lg": "16px",
      },
    },
  },
  plugins: [],
} satisfies Config;
