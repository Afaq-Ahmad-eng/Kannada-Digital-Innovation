export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ochre: { 50: '#fdf6e7', 100: '#faebc6', 400: '#dc9d24', 500: '#c4820f', 600: '#a8650d', 700: '#85490f' },
        ghats: { 50: '#ecf8f3', 100: '#cdeee0', 500: '#1b8767', 600: '#0f6b4f', 700: '#0c5640' },
        alert: { 50: '#fdeeed', 500: '#b3261e', 600: '#9a1f19' },
      },
      fontFamily: { display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'], sans: ['"Source Sans 3"', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
