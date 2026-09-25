/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Los tests de flujo tipean con user-event sobre la app entera: aislados tardan 1-3 s, pero
    // con la suite completa en paralelo rozaban el límite por defecto de 5 s.
    testTimeout: 15000,
  },
})
