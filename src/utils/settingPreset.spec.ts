import { describe, expect, it, vi } from 'vitest'

import { settingPreset } from './settingPreset'

// Mock i18n
vi.mock('@/i18n', () => ({
  i18n: {
    global: {
      locale: { value: 'en' },
    },
  },
}))

describe('settingPreset', () => {
  it('has all required settings', () => {
    expect(Object.keys(settingPreset).length).toBeGreaterThan(0)
  })

  it('saveFunc for localLanguage updates localStorage', () => {
    const mockSetItem = vi.fn()
    vi.stubGlobal('localStorage', {
      setItem: mockSetItem,
      getItem: vi.fn(),
    })
    settingPreset.localLanguage.saveFunc?.('fr')
    expect(mockSetItem).toHaveBeenCalledWith('localLanguage', 'fr')
    vi.unstubAllGlobals()
  })
})
