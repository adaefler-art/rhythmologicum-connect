
import path from 'path'

/** @type {import('tailwindcss').Config} */
export default {
  // Include monorepo shared UI package for Tailwind utility scanning
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    // Monorepo shared UI package (DesktopLayout, etc.)
    path.join(__dirname, '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}'),
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
