import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getMe, handleAuthCallback, initiateOAuth, logout, updateProfile } from './auth'

// Mock storage and window
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    length: 0,
    key: (index: number) => null,
    getItemNames: () => [],
    clearStore: () => {
      store = {}
    },
  }
})()

const cryptoMock = {
  getRandomValues: (arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256)
    return arr
  },
  subtle: {
    digest: async (algo: string, data: Uint8Array) => {
      return new Uint8Array(32).buffer
    },
  },
}

vi.stubGlobal('localStorage', localStorageMock)
vi.stubGlobal('location', {
  origin: 'http://localhost:3000',
  href: '',
  reload: vi.fn(),
})
vi.stubGlobal('crypto', cryptoMock)
vi.stubGlobal('window', {
  location: { origin: 'http://localhost:3000', href: '', reload: vi.fn() },
  localStorage: localStorageMock,
  crypto: cryptoMock,
})

// Mock fetch
vi.stubGlobal('fetch', vi.fn())

describe('auth api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
  })

  it('initiateOAuth stores state and redirects', async () => {
    await initiateOAuth('google')
    expect(localStorageMock.getItem('auth_state')).toBeDefined()
    expect(localStorageMock.getItem('auth_provider')).toBe('google')
    expect(window.location.href).toContain('accounts.google.com')
  })

  it('handleAuthCallback sends correct data and clears storage', async () => {
    localStorageMock.setItem('auth_state', 'test_state')
    localStorageMock.setItem('auth_verifier', 'test_verifier')
    localStorageMock.setItem('auth_provider', 'google')

    const mockResponse = { user: { id: 1, email: 'test@example.com' } }
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await handleAuthCallback('test_code', 'test_state')

    expect(result).toEqual(mockResponse)
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/google/callback'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('test_verifier'),
      }),
    )
    expect(localStorageMock.getItem('auth_state')).toBeNull()
  })

  it('getMe returns user data on success', async () => {
    const mockUser = { id: 1, email: 'test@example.com' }
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUser,
    })

    const result = await getMe()
    expect(result).toEqual(mockUser)
  })

  it('logout calls endpoint and reloads', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({ ok: true })

    await logout()
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/auth/logout'), { method: 'POST' })
    expect(window.location.reload).toHaveBeenCalled()
  })
})
