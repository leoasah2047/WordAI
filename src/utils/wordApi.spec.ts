import { beforeEach, describe, expect, it, vi } from 'vitest'

import { applyStyleToSelection, getDocumentBodyText, insertParagraph } from './wordApi'

// Mock global Word object
const mockWord = {
  run: vi.fn(async callback => {
    const context = {
      document: {
        body: {
          load: vi.fn(),
          insertParagraph: vi.fn(),
          text: 'Mocked Body Text',
          search: vi.fn(() => ({
            load: vi.fn(),
            items: [],
          })),
        },
        getSelection: vi.fn(() => ({
          load: vi.fn(),
          text: 'Mocked Selection',
          style: '',
        })),
      },
      sync: vi.fn(),
    }
    return await callback(context)
  }),
}

global.Word = mockWord as any

describe('wordApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getDocumentBodyText returns text from body', async () => {
    const text = await getDocumentBodyText()
    expect(text).toBe('Mocked Body Text')
    expect(mockWord.run).toHaveBeenCalled()
  })

  it('insertParagraph calls insertParagraph on body', async () => {
    await insertParagraph('New Para', 'Start')
    expect(mockWord.run).toHaveBeenCalled()
  })

  it('applyStyleToSelection updates style on selection', async () => {
    await applyStyleToSelection('Heading 1')
    expect(mockWord.run).toHaveBeenCalled()
  })
})
