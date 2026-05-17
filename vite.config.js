import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'

// Multi-page build: each route gets its own physical HTML file
// with its own <title>, meta description, canonical, OG tags,
// and JSON-LD structured data. Search engines index each URL as
// a separate document. All four pages load the same React bundle,
// which then renders the right page based on window.location.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main:       resolve(__dirname, 'index.html'),
        calculator: resolve(__dirname, 'calculator/index.html'),
        lenders:    resolve(__dirname, 'lenders/index.html'),
        about:      resolve(__dirname, 'about/index.html'),
      },
    },
  },
})
