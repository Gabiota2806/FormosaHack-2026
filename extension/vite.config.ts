/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
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
      },
      output: {
        entryFileNames: '[name].js',
        format: 'es',
      },
    },
  },
  plugins: [
    {
      name: 'copy-extension-static-assets',
      closeBundle() {
        if (!fs.existsSync('dist')) {
          fs.mkdirSync('dist', { recursive: true });
        }
        if (fs.existsSync('manifest.json')) {
          fs.copyFileSync('manifest.json', 'dist/manifest.json');
        }
        if (fs.existsSync('popup.html')) {
          fs.copyFileSync('popup.html', 'dist/popup.html');
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
