/** @type {import('tailwindcss').Config} */
const { themeExtend } = require("@llb/tokens/tailwind-preset.cjs");

module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: themeExtend,
  },
  plugins: [],
};
