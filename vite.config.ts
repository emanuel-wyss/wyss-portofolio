import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { tanstackRouter } from '@tanstack/router-plugin/vite';

export default defineConfig({
  plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true }), react()],
  server: {
    host: true,
    port: 4321,
    proxy: {
      '/api': 'http://localhost:3000',
      '/posts': 'http://localhost:3000',
      '/snippets': 'http://localhost:3000',
      '/gallery': 'http://localhost:3000',
      '/health': 'http://localhost:3000',
    },
  },
  build: {
    outDir: 'dist/public',
    emptyOutDir: true,
  },
});
