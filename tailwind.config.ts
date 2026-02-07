import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        ink: '#0f172a',
        paper: '#f8fafc',
        accent: '#0ea5a5',
        accent2: '#2563eb'
      },
      boxShadow: {
        soft: '0 12px 30px -18px rgba(2, 8, 23, 0.35)'
      }
    }
  },
  plugins: []
};

export default config;
