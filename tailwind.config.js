/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'staatliches': ['var(--font-staatliches)', 'Arial', 'sans-serif'],
        'ibm-plex-mono': ['var(--font-ibm-plex-mono)', 'Arial', 'monospace'],
        'inter': ['var(--font-inter)', 'Arial', 'sans-serif'],
      },
      colors: {
        'gorb-background': '#141b0f',
        'gorb-text-primary': '#c6deb2',
        'gorb-text-secondary': '#899381',
        'gorb-text-muted': '#555f4c',
        'gorb-accent-primary': '#55de4a',
        'gorb-accent-secondary': '#c6deb2',
        'gorb-border': 'rgba(198, 222, 178, 0.3)',
        'gorb-card-background': 'rgba(198, 222, 178, 0.1)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
