import { beforeEach, describe, expect, it, vi } from 'vitest'

import { wordToolDefinitions } from './wordTools'

// Mock Office/Word globals
const mockContext = {
  document: {
    body: {
      insertText: vi.fn(),
      getRange: vi.fn().mockReturnValue({ insertText: vi.fn(), load: vi.fn() }),
    },
    getSelection: vi.fn().mockReturnValue({
      insertText: vi.fn(),
      load: vi.fn(),
      font: {},
      delete: vi.fn(),
      getRange: vi.fn().mockReturnThis(),
    }),
  },
  sync: vi.fn(),
}

vi.stubGlobal('Word', {
  run: vi.fn().mockImplementation(async callback => {
    return callback(mockContext)
  }),
  InsertLocation: {
    Start: 'Start',
    End: 'End',
    Before: 'Before',
    After: 'After',
    Replace: 'Replace',
  },
})

describe('wordTools', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getSelectedText calls getSelection and returns text', async () => {
    const tool = (wordToolDefinitions as any).getSelectedText
    mockContext.document.getSelection().text = 'Mock Selected Text'

    const result = await tool.execute({})
    expect(result).toBe('Mock Selected Text')
    expect(mockContext.document.getSelection).toHaveBeenCalled()
    expect(mockContext.document.getSelection().load).toHaveBeenCalledWith('text')
  })

  it('insertText calls insertText on selection', async () => {
    const tool = (wordToolDefinitions as any).insertText
    const args = { text: 'Hello World', location: 'After' }

    const result = await tool.execute(args)
    expect(result).toContain('Successfully inserted text')
    expect(mockContext.document.getSelection().insertText).toHaveBeenCalledWith('Hello World', 'After')
    expect(mockContext.sync).toHaveBeenCalled()
  })

  it('formatText applies styles to selection', async () => {
    const tool = (wordToolDefinitions as any).formatText
    const args = { bold: true, fontSize: 14 }

    const selection = mockContext.document.getSelection()
    await tool.execute(args)

    expect(selection.font.bold).toBe(true)
    expect(selection.font.size).toBe(14)
    expect(mockContext.sync).toHaveBeenCalled()
  })

  it('replaceSelectedText deletes and inserts', async () => {
    const tool = (wordToolDefinitions as any).replaceSelectedText
    const args = { newText: 'New Content' }

    await tool.execute(args)

    const selection = mockContext.document.getSelection()
    expect(selection.insertText).toHaveBeenCalledWith('New Content', 'Replace')
    expect(mockContext.sync).toHaveBeenCalled()
  })
})
