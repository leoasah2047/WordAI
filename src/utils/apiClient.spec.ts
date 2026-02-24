import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { apiClient } from './apiClient'

// Mock useSettingForm
vi.mock('./settingForm', () => ({
  default: vi.fn(() => ({
    value: {
      consultantBackendUrl: 'http://localhost:8000',
    },
  })),
}))

describe('ApiClient', () => {
  beforeAll(() => {
    global.fetch = vi.fn()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call fetch with correct URL and method', async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve({ data: 'test' }) }
    ;(global.fetch as any).mockResolvedValue(mockResponse)

    const result = await apiClient.get('/test')

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/test',
      expect.objectContaining({
        method: 'GET',
      }),
    )
    expect(result).toEqual({ data: 'test' })
  })

  it('should retry on 500 status', async () => {
    const errorResponse = {
      ok: false,
      status: 500,
      json: () => Promise.resolve({ detail: 'Error' }),
    }
    const successResponse = {
      ok: true,
      json: () => Promise.resolve({ data: 'success' }),
    }

    ;(global.fetch as any).mockResolvedValueOnce(errorResponse).mockResolvedValueOnce(successResponse)

    // Using cast to access private/internal if needed, or just rely on public API
    // We can't easily change DEFAULT_DELAY without modifying the file or using timers
    // Vitest can mock timers
    vi.useFakeTimers()

    const promise = apiClient.get('/retry')

    // First call fails
    await vi.runAllTimersAsync()

    const result = await promise

    expect(global.fetch).toHaveBeenCalledTimes(2)
    expect(result).toEqual({ data: 'success' })
    vi.useRealTimers()
  })

  it('should throw error after exhausting retries', async () => {
    const errorResponse = {
      ok: false,
      status: 500,
      json: () => Promise.resolve({ detail: 'Fatal Error' }),
    }
    ;(global.fetch as any).mockResolvedValue(errorResponse)

    // Reduced retries to 1 for simpler testing and to avoid potential leaks
    await expect(apiClient.get('/fatal', { retries: 1, retryDelay: 1 })).rejects.toThrow('Fatal Error')
    expect(global.fetch).toHaveBeenCalledTimes(2) // initial + 1 retry
  })

  it('should handle FormData in upload', async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve({ success: true }) }
    ;(global.fetch as any).mockResolvedValue(mockResponse)

    const formData = new FormData()
    formData.append('file', new Blob(['test'], { type: 'text/plain' }), 'test.txt')

    const result = await apiClient.upload('/upload', formData)

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/upload',
      expect.objectContaining({
        method: 'POST',
        body: formData,
      }),
    )
    expect(result).toEqual({ success: true })
  })
})
