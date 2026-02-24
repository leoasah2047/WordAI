import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createGeneralTools, getGeneralTool, getGeneralToolDefinitions } from './generalTools'

// Mock fetch
global.fetch = vi.fn()

describe('generalTools', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns all tool definitions', () => {
    const defs = getGeneralToolDefinitions()
    expect(defs.length).toBeGreaterThan(0)
    expect(defs.find(d => d.name === 'calculateMath')).toBeDefined()
  })

  it('gets a specific tool by name', () => {
    const tool = getGeneralTool('getCurrentDate')
    expect(tool?.name).toBe('getCurrentDate')
  })

  it('creates enabled tools only', () => {
    const tools = createGeneralTools(['calculateMath'])
    expect(tools).toHaveLength(1)
    expect(tools[0].name).toBe('calculateMath')
  })

  describe('calculateMath tool', () => {
    it('evaluates math expressions', async () => {
      const tool = getGeneralTool('calculateMath')?.tool
      // @ts-ignore - access internal func for testing
      const result = await tool?.func({ expression: '2 + 2' })
      expect(result).toBe('2 + 2 = 4')
    })

    it('handles errors in math expressions', async () => {
      const tool = getGeneralTool('calculateMath')?.tool
      // @ts-ignore
      const result = await tool?.func({ expression: 'invalid' })
      expect(result).toContain('Error')
    })
  })

  describe('getCurrentDate tool', () => {
    it('returns date in different formats', async () => {
      const tool = getGeneralTool('getCurrentDate')?.tool
      // @ts-ignore
      const iso = await tool?.func({ format: 'iso' })
      expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })
  })
})
