import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// Separate app from the traveller site: its own port and its own bundle. /api is proxied to the backend gateway.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
    },
    server: { port: 5174, proxy: { '/api': { target: env.VITE_API_PROXY || 'http://localhost:8080', changeOrigin: true } } },
  };
});
