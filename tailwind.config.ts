import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: "class",
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                ink: "#0f0f0f",
                paper: "#f5f2eb",
                faint: "#e8e3d9",
                mid: "#c8c2b4",
                accent: "#e8622c",
                accent2: "#1a4fd4",
            },
            fontFamily: {
                mono: ["var(--font-mono)"],
                sans: ["var(--font-sans)"],
                serif: ["var(--font-serif)"],
            },
            fontSize: {
                "2xs": "11px",
            },
        },
    },
    plugins: [],
};

export default config;