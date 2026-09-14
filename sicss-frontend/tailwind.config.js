/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sicss: {
          navy: '#0D2747',
          primary: '#2563EB',
          active: '#2585E5',
          page: '#F4F7FB',
          border: '#D9E4EF',
          text: {
            primary: '#12345B',
            secondary: '#5F7894',
            muted: '#8A9AAF',
          },
          success: '#16A34A',
          warning: '#F59E0B',
          danger: '#DC2626',
        },
      },
    },
  },
  plugins: [],
}
