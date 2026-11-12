import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  // antd ships its own reset; keep Tailwind's preflight from fighting it.
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#0b0840', light: '#1a1660' },
        brand: { DEFAULT: '#4f46e5', dark: '#4338ca', light: '#eef2ff' },
        accent: { DEFAULT: '#ec4899', light: '#fdf2f8' },
      },
    },
  },
  plugins: [],
};
export default config;
