import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { orchestrator } from './agentOrchestrator'

// Mock dependencies
vi.mock('@/composables/useAgentActivity', () => ({
  useAgentActivity: () => ({
    addActivity: vi.fn(),
    updateActivity: vi.fn(),
  }),
}))

vi.mock('@/utils/settingForm', () => ({
  default: () => ({
    value: {
      consultantBackendUrl: 'http://localhost:8000',
      geminiAPIKey: 'test-key',
    },
  }),
}))

vi.mock('./toolExecutor', () => ({
  executeAgentTool: vi.fn(),
  reportToolResult: vi.fn(),
}))

// Mock WebSocket Client using a Class
vi.mock('./websocketClient', () => {
  return {
    A2AWebSocketClient: class {
      onChunk = vi.fn().mockReturnThis()
      onStatus = vi.fn().mockReturnThis()
      onArtifact = vi.fn().mockReturnThis()
      onError = vi.fn().mockReturnThis()
      connect = vi.fn().mockReturnThis()
      disconnect = vi.fn().mockReturnThis()
    },
  }
})

// Mock fetch
vi.stubGlobal('fetch', vi.fn())

describe('agentOrchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('orchestrator.execute sends RPC request and handles success', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jsonrpc: '2.0', result: { id: 'test-task' }, id: 'task-id' }),
    })

    // Mock the polling fetch
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jsonrpc: '2.0', result: { status: { state: 'completed' } }, id: 'check-task' }),
    })

    const promise = orchestrator.execute('test prompt')

    // Advance timers for polling (5s interval in code)
    await vi.advanceTimersByTimeAsync(5001)

    const result = await promise
    expect(result.status.state).toBe('completed')
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/a2a/rpc'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('tasks/send'),
      }),
    )
  })

  it('orchestrator.execute handles RPC errors', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jsonrpc: '2.0', error: { message: 'Invalid prompt' }, id: 'task-id' }),
    })

    await expect(orchestrator.execute('error prompt')).rejects.toThrow('Invalid prompt')
  })
})
