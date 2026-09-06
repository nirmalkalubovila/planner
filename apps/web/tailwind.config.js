/** @type {import('tailwindcss').Config} */
import tailwindAnimate from "tailwindcss-animate";
import { themeExtend } from "@llb/tokens/tailwind-preset.cjs";

export default {
    darkMode: ["class"],
    content: [
        './pages/**/*.{ts,tsx,js,jsx}',
        './components/**/*.{ts,tsx,js,jsx}',
        './app/**/*.{ts,tsx,js,jsx}',
        './src/**/*.{ts,tsx,js,jsx}',
    ],
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "xs": "375px",
                "2xl": "1400px",
            },
        },
        extend: themeExtend,
    },
    plugins: [tailwindAnimate],
}
