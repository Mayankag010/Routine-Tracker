/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Every color is backed by a CSS variable (set in globals.css and,
        // for theme/accent, overridden live by ThemeProvider) so existing
        // classNames like `bg-paper` or `text-accent` automatically follow
        // the user's light/dark + accent-color choice with no per-component
        // changes needed. The `<alpha-value>` placeholder keeps Tailwind's
        // opacity modifiers (e.g. bg-gold/20) working.
        paper: "rgb(var(--color-paper) / <alpha-value>)",
        paperDark: "rgb(var(--color-paper-dark) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        inkSoft: "rgb(var(--color-ink-soft) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        accentSoft: "rgb(var(--color-accent-soft) / <alpha-value>)",
        gold: "rgb(var(--color-gold) / <alpha-value>)",
        line: "rgb(var(--color-line) / <alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
