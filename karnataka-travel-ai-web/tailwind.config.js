/** Palette: Karnataka deep ochre, sandalwood, Western Ghats emerald, slate neutrals. */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ochre: { 50: '#fdf6e7', 100: '#faebc6', 200: '#f3d48a', 300: '#e9b94d', 400: '#dc9d24', 500: '#c4820f', 600: '#a8650d', 700: '#85490f', 800: '#6a3912', 900: '#582f12' },
        sandal: { 50: '#fbf8f2', 100: '#f5eee1', 200: '#eadcc3', 300: '#dbc5a0', 400: '#c8a979', 500: '#b08d5c' },
        ghats: { 50: '#ecf8f3', 100: '#cdeee0', 200: '#9cdcc2', 300: '#62c1a0', 400: '#33a37f', 500: '#1b8767', 600: '#0f6b4f', 700: '#0c5640', 800: '#0a4333', 900: '#08362a' },
        alert: { 50: '#fdeeed', 500: '#b3261e', 600: '#9a1f19' },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', '"Noto Sans Kannada"', 'system-ui', 'sans-serif'],
        sans: ['"Source Sans 3"', '"Noto Sans Kannada"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
