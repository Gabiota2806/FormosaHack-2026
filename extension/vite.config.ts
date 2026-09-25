/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';
import fs from 'fs';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        'service-worker': resolve(import.meta.dirname, 'src/background/service-worker.ts'),
        'content-script': resolve(import.meta.dirname, 'src/content/form-detector.ts'),
        popup: resolve(import.meta.dirname, 'popup.html'),
        'popup-src': resolve(import.meta.dirname, 'src/popup/index.html'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        format: 'es',
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'copy-extension-static-assets',
      closeBundle() {
        if (!fs.existsSync('dist')) {
          fs.mkdirSync('dist', { recursive: true });
        }
        if (fs.existsSync('manifest.json')) {
          fs.copyFileSync('manifest.json', 'dist/manifest.json');
        }
        if (fs.existsSync('public')) {
          fs.cpSync('public', 'dist', { recursive: true });
        }
      },
    },
  ],
  test: {
    environment: 'node',
    globals: true,
  },
});
