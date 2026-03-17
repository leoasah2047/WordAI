import { fileURLToPath, URL } from 'node:url'
import basicSsl from '@vitejs/plugin-basic-ssl'
import vue from '@vitejs/plugin-vue'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vite'
import json5Plugin from 'vite-plugin-json5'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    basicSsl(),
    json5Plugin(),
    visualizer({
      open: false,
      filename: 'bundle-stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  server: {
    port: 3000,
    strictPort: true,
    hmr: {
      protocol: 'wss',
      host: 'localhost',
      port: 3000,
      clientPort: 3000,
    },
  },
  esbuild: {
    target: 'esnext',
  },
  worker: {
    format: 'es',
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'xlsx-vendor': ['xlsx'],
          'pdf-vendor': ['pdfjs-dist'],
          'ocr-vendor': ['scribe.js-ocr'],
          'readability-vendor': ['@mozilla/readability'],
          'mammoth-vendor': ['mammoth'],
        },
      },
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
    include: ['xlsx', 'pdfjs-dist', 'scribe.js-ocr', '@mozilla/readability', 'mammoth'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      async_hook: fileURLToPath(new URL('./async_hook.js', import.meta.url)),
      'node:async_hooks': fileURLToPath(new URL('./async_hook.js', import.meta.url)),
      path: 'path-browserify',
      'node:path': 'path-browserify',
      'node:fs/promises': fileURLToPath(new URL('./src/mocks/emptyMockPromises.js', import.meta.url)),
      'node:fs': fileURLToPath(new URL('./src/mocks/emptyMock.js', import.meta.url)),
      'fs/promises': fileURLToPath(new URL('./src/mocks/emptyMockPromises.js', import.meta.url)),
      fs: fileURLToPath(new URL('./src/mocks/emptyMock.js', import.meta.url)),
      os: 'os-browserify',
      'node:os': 'os-browserify',
      'node:module': fileURLToPath(new URL('./src/mocks/emptyMock.js', import.meta.url)),
      'node:url': fileURLToPath(new URL('./src/mocks/emptyMock.js', import.meta.url)),
      'node:worker_threads': fileURLToPath(new URL('./src/mocks/emptyMock.js', import.meta.url)),
    },
  },
})
