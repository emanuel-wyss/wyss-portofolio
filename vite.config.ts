import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { tanstackRouter } from '@tanstack/router-plugin/vite';

export default defineConfig({
  plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true }), react()],
  server: {
    host: true,
    port: 4321,
    proxy: {
      '/api': {
        target: 'https://wyss.rocks',
        changeOrigin: true,
        secure: true,
      },
      '/posts': {
        target: 'https://wyss.rocks',
        changeOrigin: true,
        secure: true,
      },
      '/snippets': {
        target: 'https://wyss.rocks',
        changeOrigin: true,
        secure: true,
      },
      '/gallery': {
        target: 'https://wyss.rocks',
        changeOrigin: true,
        secure: true,
      },
      '/health': {
        target: 'https://wyss.rocks',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    outDir: 'dist/public',
    emptyOutDir: true,
    manifest: true,
  },
});
