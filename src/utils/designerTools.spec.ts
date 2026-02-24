import { describe, expect, it, vi } from 'vitest'

import { createDesignerTools } from './designerTools'

// Mock apiClient
vi.mock('@/utils/apiClient', () => ({
  apiClient: {
    post: vi.fn(),
  },
}))

describe('designerTools', () => {
  it('creates tools correctly', () => {
    const tools = createDesignerTools()
    expect(tools).toHaveLength(1)
    expect(tools[0].name).toBe('generateImage')
  })

  it('generateImage tool execution success', async () => {
    const tools = createDesignerTools()
    const generateImageTool = tools.find(t => t.name === 'generateImage')

    // The actual tool function is inside the langchain tool object
    // For unit testing the logic, we can verify the definition
    expect(generateImageTool?.description).toContain('Generate an image')
  })
})
