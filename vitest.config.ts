import path from 'node:path'
import { fileURLToPath } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@asamuzakjp/css-color': path.resolve(__dirname, './src/mocks/emptyMock.js'),
      '@csstools/css-calc': path.resolve(__dirname, './src/mocks/emptyMock.js'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    server: {
      deps: {
        external: [/@asamuzakjp\/css-color/],
      },
    },
  },
  poolOptions: {
    threads: {
      singleThread: true,
    },
  },
})
