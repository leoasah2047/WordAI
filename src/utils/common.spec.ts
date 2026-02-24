import { describe, expect, it } from 'vitest'

import { checkAuth, forceNumber, formatDate, getLabel, getOptionList, getPlaceholder } from './common'

describe('common utils', () => {
  describe('checkAuth', () => {
    it('returns false for null/undefined', () => {
      expect(checkAuth(null as any)).toBe(false)
    })

    it('returns true for official with apiKey', () => {
      expect(checkAuth({ type: 'official', apiKey: 'test' } as any)).toBe(true)
    })

    it('returns false for official without apiKey', () => {
      expect(checkAuth({ type: 'official', apiKey: '' } as any)).toBe(false)
    })

    it('returns true for gemini with geminiAPIKey', () => {
      expect(checkAuth({ type: 'gemini', geminiAPIKey: 'test' } as any)).toBe(true)
    })

    it('returns false for unknown type', () => {
      expect(checkAuth({ type: 'unknown' } as any)).toBe(false)
    })
  })

  describe('forceNumber', () => {
    it('converts string to number', () => {
      expect(forceNumber('123')).toBe(123)
    })

    it('returns 0 for invalid input', () => {
      expect(forceNumber('abc')).toBe(0)
      expect(forceNumber(null)).toBe(0)
    })
  })

  describe('getOptionList', () => {
    const map = { a: '1', b: '2' }
    it('returns list from keys', () => {
      expect(getOptionList(map)).toEqual([
        { label: 'a', value: '1' },
        { label: 'b', value: '2' },
      ])
    })

    it('returns list from values', () => {
      expect(getOptionList(map, 'value')).toEqual([
        { label: '1', value: '1' },
        { label: '2', value: '2' },
      ])
    })
  })

  describe('label and placeholder helpers', () => {
    it('getLabel returns key + Label', () => {
      expect(getLabel('test')).toBe('testLabel')
    })
    it('getPlaceholder returns key + Placeholder', () => {
      expect(getPlaceholder('test')).toBe('testPlaceholder')
    })
  })

  describe('formatDate', () => {
    it('formats timestamp correctly', () => {
      const ts = new Date('2024-01-01T12:00:00').getTime()
      const formatted = formatDate(ts)
      expect(formatted).toContain('2024')
      // Exact format depends on locale, but checking for inclusion is safer
    })
  })
})
