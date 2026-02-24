import { describe, expect, it, vi } from 'vitest'

import { defaultTemplates } from './typeset'

// Mock vueuse useStorage
vi.mock('@vueuse/core', () => ({
  useStorage: vi.fn((key, initial) => ({ value: initial })),
}))

describe('typeset utility', () => {
  it('has default templates', () => {
    expect(defaultTemplates.length).toBeGreaterThan(0)
    expect(defaultTemplates[0].id).toBe('modern_clean')
  })

  it('modern_clean has Heading1 style', () => {
    const modern = defaultTemplates.find(t => t.id === 'modern_clean')
    expect(modern?.styles.Heading1).toBeDefined()
    expect(modern?.styles.Heading1.fontSize).toBe(24)
  })

  it('formal_legal has specific western font', () => {
    const formal = defaultTemplates.find(t => t.id === 'formal_legal')
    expect(formal?.westernFont).toBe('Times New Roman')
  })
})
