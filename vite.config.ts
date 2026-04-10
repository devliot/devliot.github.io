import { defineConfig } from 'vite';

export default defineConfig({
  base: '/devliot/',
  build: {
    outDir: 'dist',
    target: 'es2023',
  },
});
