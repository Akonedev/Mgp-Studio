/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./app/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./packages/studio/src/**/*.{js,jsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#df9c43',
                    hover: '#e8aa55',
                },
                sahel: {
                    light: '#f5c277',
                    DEFAULT: '#df9c43',
                    dark: '#b6762c',
                    deep: '#844f15',
                },
                'app-bg': '#070605',
                'panel-bg': '#0d0b09',
                'card-bg': '#14110d',
                secondary: '#b8aba0',
                muted: '#6e6359',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
            },
            borderRadius: {
                'xl': '1rem',
                '2xl': '1.5rem',
                '3xl': '2rem',
            },
            boxShadow: {
                'glow': '0 0 20px rgba(223, 156, 67, 0.4)',
                'glow-accent': '0 0 20px rgba(223, 156, 67, 0.25)',
                '3xl': '0 35px 60px -15px rgba(0, 0, 0, 0.8)',
            }
        },
    },
    plugins: [],
}
