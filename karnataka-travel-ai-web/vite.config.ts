import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// In dev, /api is proxied to the backend API gateway so cookies stay same-origin.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: { '/api': { target: env.VITE_API_PROXY || 'http://localhost:8080', changeOrigin: true } },
    },
  };
});
