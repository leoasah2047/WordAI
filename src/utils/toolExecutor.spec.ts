import { describe, expect, it, vi } from 'vitest'

import { executeAgentTool, reportToolResult } from './toolExecutor'
import * as wordToolsModule from './wordTools'

vi.mock('./wordTools', () => ({
  createWordTools: vi.fn(),
}))

global.fetch = vi.fn()

describe('toolExecutor', () => {
  it('executes a tool successfully', async () => {
    const mockTool = {
      name: 'test-tool',
      func: vi.fn().mockResolvedValue('success result'),
    }
    vi.mocked(wordToolsModule.createWordTools).mockReturnValue([mockTool] as any)

    const result = await executeAgentTool({
      id: '123',
      tool_name: 'test-tool',
      arguments: { arg: 1 },
    })

    expect(result.success).toBe(true)
    expect(result.result).toBe('success result')
    expect(mockTool.func).toHaveBeenCalledWith({ arg: 1 })
  })

  it('returns failure if tool not found', async () => {
    vi.mocked(wordToolsModule.createWordTools).mockReturnValue([])

    const result = await executeAgentTool({
      id: '123',
      tool_name: 'missing',
      arguments: {},
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('not found')
  })

  it('reports tool result to backend', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true } as any)

    await reportToolResult('http://api.com', 'task-1', {
      tool_call_id: 'call-1',
      success: true,
      result: 'done',
    })

    expect(fetch).toHaveBeenCalledWith(
      'http://api.com/a2a/rpc',
      expect.objectContaining({
        method: 'POST',
      }),
    )
  })
})
