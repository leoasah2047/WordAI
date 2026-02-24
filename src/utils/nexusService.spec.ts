import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiClient } from './apiClient'
import { nexusService } from './nexusService'
import { getDocumentBodyText } from './wordApi'

vi.mock('./apiClient', () => ({
  apiClient: {
    post: vi.fn(),
  },
}))

vi.mock('./wordApi', () => ({
  getDocumentBodyText: vi.fn(),
}))

describe('NexusService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset singleton state
    ;(nexusService as any).lastAnalysisTime = 0
    ;(nexusService as any).isAnalyzing = false
  })

  it('triggerAnalysis skips if text is too short', async () => {
    vi.mocked(getDocumentBodyText).mockResolvedValue('Short')
    await nexusService.triggerAnalysis()
    expect(apiClient.post).not.toHaveBeenCalled()
  })

  it('triggerAnalysis calls api if text is long enough', async () => {
    vi.mocked(getDocumentBodyText).mockResolvedValue(
      'This is a sufficiently long text for analysis to be triggered by the nexus service.',
    )
    await nexusService.triggerAnalysis()
    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/nexus/analyze', expect.any(Object))
  })

  it('onActivityDetected respects IDLE_INTERVAL', async () => {
    // Reset state specifically for this test
    ;(nexusService as any).lastAnalysisTime = 0
    ;(nexusService as any).isAnalyzing = false

    const startTime = 30 * 60 * 1000
    vi.useFakeTimers()
    vi.setSystemTime(startTime)

    vi.mocked(getDocumentBodyText).mockResolvedValue(
      'This is a sufficiently long text for analysis to be triggered by the nexus service in this test case.',
    )

    await nexusService.onActivityDetected()
    expect(apiClient.post).toHaveBeenCalledTimes(1)

    // Advance time by 1 second
    vi.setSystemTime(startTime + 1000)
    await nexusService.onActivityDetected()
    // Should still be 1 call total
    expect(apiClient.post).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
  })
})
