import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: '.', // This should be the directory where `index.html` exists
  plugins: [react()],
  assetsInclude: ['**/*.glb'],
  base: './',
  build: {
    outDir: 'dist',
  },
});
