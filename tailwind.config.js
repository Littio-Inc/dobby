/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'littio-primary-billionaire': '#0E1523',
        'littio-primary-lime': '#DFFF86',
        'littio-primary-lime-20': '#BDE353',
        'littio-secondary-sky': '#007AFF',
        'neutral-20': '#EFF2F8',
        'neutral-40': '#EBEDF3',
        'neutral-60': '#BFC8DA',
        'neutral-80': '#76829A',
        'neutral-100': '#3D485E',
        'carmine-light': '#FDEAE7',
        carmine: '#F04E3A',
        'lite-blue': '#A6C0F2',
      },
      fontSize: {
        '5xl': '3rem',
      },
    },
  },
  plugins: [],
};
