/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./templates/**/*.html",
    "./static/js/**/*.js",
    "./static/css/**/*.css"
  ],
  theme: {
    extend: {
      colors: {
        'rescue-red': '#ef4444',
        'rescue-blue': '#3b82f6',
        'rescue-gray': '#6b7280'
      },
      fontFamily: {
        'rescue': ['Inter', 'sans-serif']
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ],
}
