import { beforeEach, describe, expect, it, vi } from 'vitest'

// Hoist the stub so it runs before imports
vi.hoisted(() => {
  const localStorageMock = (() => {
    let store: Record<string, string> = {}
    const mock = {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key]
      }),
      clear: vi.fn(() => {
        store = {}
      }),
      length: 0,
      key: vi.fn(),
    }
    return mock
  })()
  vi.stubGlobal('localStorage', localStorageMock)
})

// Mock i18n
vi.mock('@/i18n', () => ({
  i18n: {
    global: {
      locale: { value: 'en' },
    },
  },
}))

describe('useSettingForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    vi.resetModules()
  })

  it('initializes with default values when storage is empty', async () => {
    const { default: useSettingForm } = await import('./settingForm')
    const settings = useSettingForm()
    expect(settings.value.replyLanguage).toBe('English')
    expect(settings.value.localLanguage).toBe('en')
  })

  it('loads values from localStorage', async () => {
    localStorage.setItem('geminiAPIKey', 'saved-key')
    const { default: useSettingForm } = await import('./settingForm')
    const settings = useSettingForm()
    expect(settings.value.geminiAPIKey).toBe('saved-key')
  })

  it('handles legacy palm setting', async () => {
    // In settingForm.ts, it checks for settings.api === 'palm'
    // This happens after initializeSettings loop.
    localStorage.setItem('api', 'palm')
    const { default: useSettingForm } = await import('./settingForm')
    const settings = useSettingForm()
    expect(settings.value.api).toBe('gemini')
    expect(localStorage.setItem).toHaveBeenCalledWith('api', 'gemini')
  })
})
