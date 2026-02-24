import { beforeEach, describe, expect, it, vi } from 'vitest'

import { WordFormatter } from './wordFormatter'

// Mock Word global
const createMockParagraph = () => {
  const p = {
    styleBuiltIn: '',
    font: {},
    getRange: vi.fn(),
    listItem: { level: 0 },
    insertParagraph: vi.fn(),
  }
  p.getRange.mockImplementation(() => mockRange)
  p.insertParagraph.mockImplementation(() => createMockParagraph())
  return p
}

const mockRange = {
  clear: vi.fn(),
  getRange: vi.fn(),
  insertParagraph: vi.fn(),
  insertText: vi.fn(),
  load: vi.fn(),
}

mockRange.getRange.mockImplementation(() => mockRange)
mockRange.insertParagraph.mockImplementation(() => createMockParagraph())

const mockContext = {
  document: {
    getSelection: vi.fn().mockReturnValue(mockRange),
  },
  sync: vi.fn(),
}

vi.stubGlobal('Word', {
  run: vi.fn().mockImplementation(async callback => {
    return callback(mockContext)
  }),
})

describe('WordFormatter', () => {
  describe('parseMarkdown', () => {
    it('parses headings correctly', () => {
      const parts = WordFormatter.parseMarkdown('# Heading 1\n## Heading 2')
      expect(parts).toContainEqual({ text: 'Heading 1', style: 'heading1' })
      expect(parts).toContainEqual({ text: 'Heading 2', style: 'heading2' })
    })

    it('parses bold and italic text', () => {
      const parts = WordFormatter.parseInlineFormatting('**Bold** and *Italic*')
      expect(parts).toContainEqual({ text: 'Bold', style: 'bold' })
      expect(parts).toContainEqual({ text: 'Italic', style: 'italic' })
    })

    it('parses bullet lists', () => {
      const parts = WordFormatter.parseMarkdown('- Item 1\n- Item 2')
      expect(parts).toContainEqual({ text: 'Item 1', listType: 'bullet', listLevel: 1 })
    })
  })

  describe('insertFormattedResult', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('calls clear and sync', async () => {
      const insertType = { value: 'replace' }
      const markdown = '# Welcome\nThis is a **test**.'

      await WordFormatter.insertFormattedResult(markdown, insertType as any)

      expect(mockRange.clear).toHaveBeenCalled()
      expect(mockContext.sync).toHaveBeenCalled()
    })
  })
})
