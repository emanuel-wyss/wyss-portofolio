import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { tanstackRouter } from '@tanstack/router-plugin/vite';

// Local dev runs only the frontend; API calls are proxied to production.
// Page routes that share a prefix with backend routes (/posts, /snippets, /gallery)
// must NOT be proxied for browser navigations, or a reload returns production's
// HTML (with production asset hashes) and the page stays blank.
const prod = { target: 'https://wyss.rocks', changeOrigin: true, secure: true };
const spaAware = {
  ...prod,
  bypass: (req: { headers: { accept?: string } }) =>
    req.headers.accept?.includes('text/html') ? '/index.html' : undefined,
};

export default defineConfig({
  plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true }), react()],
  server: {
    host: true,
    port: 4321,
    proxy: {
      '/api': prod,
      '/health': prod,
      '/posts': spaAware,
      '/snippets': spaAware,
      '/gallery': spaAware,
    },
  },
  build: {
    outDir: 'dist/public',
    emptyOutDir: true,
    manifest: true,
  },
});
