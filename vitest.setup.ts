import { vi } from 'vitest'

// Mock any problematic global packages that fail due to ESM/CJS issues
vi.mock('@asamuzakjp/css-color', () => ({
  default: {
    resolve: c => c,
    convert: c => c,
  },
}))

vi.mock('@csstools/css-calc', () => ({
  default: c => c,
}))
