import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        // User Custom Palette
        ink_black: {
          DEFAULT: '#001524',
          100: '#000407',
          200: '#00080e',
          300: '#000c15',
          400: '#00111d',
          500: '#001524',
          600: '#004c83',
          700: '#0083e1',
          800: '#41b0ff',
          900: '#a0d7ff',
        },
        stormy_teal: {
          DEFAULT: '#15616d',
          100: '#041315',
          200: '#08262b',
          300: '#0c3940',
          400: '#104c56',
          500: '#15616d',
          600: '#2199ab',
          700: '#3ec5da',
          800: '#7ed9e7',
          900: '#bfecf3',
        },
        papaya_whip: {
          DEFAULT: '#ffecd1',
          100: '#5d3600',
          200: '#ba6c00',
          300: '#ff9f17',
          400: '#ffc574',
          500: '#ffecd1',
          600: '#fff0da',
          700: '#fff4e3',
          800: '#fff7ed',
          900: '#fffbf6',
        },
        vivid_tangerine: {
          DEFAULT: '#ff7d00',
          100: '#331900',
          200: '#663100',
          300: '#994a00',
          400: '#cc6300',
          500: '#ff7d00',
          600: '#ff9633',
          700: '#ffb066',
          800: '#ffca99',
          900: '#ffe5cc',
        },
        brandy: {
          DEFAULT: '#78290f',
          100: '#180803',
          200: '#2f1006',
          300: '#471809',
          400: '#5e200c',
          500: '#78290f',
          600: '#b93f17',
          700: '#e66235',
          800: '#ee9679',
          900: '#f7cbbc',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
