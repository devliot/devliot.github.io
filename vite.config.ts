import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  appType: 'spa',
  build: {
    outDir: 'dist',
    target: 'es2023',
  },
});
