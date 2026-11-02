import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Separate app from the traveller site: its own port and its own bundle. /api is proxied to the backend gateway.
export default defineConfig({
  plugins: [react()],
  server: { port: 5174, proxy: { '/api': { target: process.env.VITE_API_PROXY ?? 'http://localhost:8080', changeOrigin: true } } },
});
