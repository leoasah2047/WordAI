import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import * as authApi from '@/api/auth'
import useSettingForm from '@/utils/settingForm'

import { state as rawState, useAuthStore } from './AuthStore'

// Mock the API
vi.mock('@/api/auth', () => ({
  getMe: vi.fn(),
  logout: vi.fn(),
  updateProfile: vi.fn(),
}))

// Mock useSettingForm
vi.mock('@/utils/settingForm', () => ({
  default: vi.fn(),
}))

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString()
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

vi.stubGlobal('localStorage', localStorageMock)

describe('AuthStore', () => {
  const mockSettings = ref({
    geminiAPIKey: '',
    erpnextApiKey: '',
  })

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    // Reset state manually since it's a singleton
    rawState.user = null
    rawState.loading = false
    rawState.initialized = false

    // Setup useSettingForm mock
    ;(useSettingForm as any).mockReturnValue(mockSettings)
    mockSettings.value = {
      geminiAPIKey: '',
      erpnextApiKey: '',
    }
  })

  it('init fetches user and updates state', async () => {
    const { init, state } = useAuthStore()
    const mockUser = { id: 1, email: 'test@example.com', onboarded: true }
    ;(authApi.getMe as any).mockResolvedValue(mockUser)

    await init()

    expect(state.user).toEqual(mockUser)
    expect(state.initialized).toBe(true)
    expect(authApi.getMe).toHaveBeenCalled()
  })

  it('login updates user and onboarded status', () => {
    const { login, state } = useAuthStore()
    const userData = {
      user: { id: 2, email: 'new@example.com' },
      requires_onboarding: true,
    }

    login(userData)

    expect(state.user?.id).toBe(2)
    expect(state.user?.onboarded).toBe(false)
  })

  it('logout clears user state', async () => {
    const { logout, state } = useAuthStore()
    rawState.user = { id: 2, email: 'new@example.com', onboarded: false } as any
    ;(authApi.logout as any).mockResolvedValue(true)

    await logout()

    expect(state.user).toBeNull()
    expect(authApi.logout).toHaveBeenCalled()
  })

  it('setUserProfile updates identity and onboarded', () => {
    const { setUserProfile, state } = useAuthStore()
    rawState.user = { id: 1, email: 'test@example.com', onboarded: false } as any

    setUserProfile('Legal Professional')

    expect(state.user?.profile?.identity).toBe('Legal Professional')
    expect(state.user?.onboarded).toBe(true)
  })

  it('setUserProfile synchronizes API keys to localStorage and settingForm', () => {
    const { setUserProfile } = useAuthStore()
    rawState.user = { id: 1, email: 'test@example.com', onboarded: false } as any

    const profileUpdates = {
      gemini_api_key: 'test-gemini-key',
      dms_provider: 'erpnext',
      dms_api_key: 'test-erpnext-key',
    }

    setUserProfile(profileUpdates)

    // Check localStorage
    expect(localStorage.setItem).toHaveBeenCalledWith('geminiAPIKey', 'test-gemini-key')
    expect(localStorage.setItem).toHaveBeenCalledWith('erpnextApiKey', 'test-erpnext-key')

    // Check settingForm (reactive sync)
    expect(mockSettings.value.geminiAPIKey).toBe('test-gemini-key')
    expect(mockSettings.value.erpnextApiKey).toBe('test-erpnext-key')
  })

  it('setUserProfile clears API keys when not provided', () => {
    const { setUserProfile } = useAuthStore()
    rawState.user = {
      id: 1,
      email: 'test@example.com',
      onboarded: true,
      profile: {
        gemini_api_key: 'old-key',
        dms_provider: 'erpnext',
        dms_api_key: 'old-erp-key',
      },
    } as any

    setUserProfile({ gemini_api_key: '', dms_api_key: '' })

    expect(localStorage.removeItem).toHaveBeenCalledWith('geminiAPIKey')
    expect(localStorage.removeItem).toHaveBeenCalledWith('erpnextApiKey')
    expect(mockSettings.value.geminiAPIKey).toBe('')
    expect(mockSettings.value.erpnextApiKey).toBe('')
  })
})
