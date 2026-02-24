import { describe, expect, it, vi } from 'vitest'

import { downloadFile, extractFileContent } from './fileProcessing'

// Mock mammoth
vi.mock('mammoth', () => ({
  extractRawText: vi.fn().mockResolvedValue({ value: 'Mocked DOCX text' }),
}))

// Mock pdfjs-dist
vi.mock('pdfjs-dist', () => ({
  getDocument: vi.fn().mockReturnValue({
    promise: Promise.resolve({
      numPages: 1,
      getPage: vi.fn().mockResolvedValue({
        getTextContent: vi.fn().mockResolvedValue({
          items: [{ str: 'Mocked PDF text' }],
        }),
      }),
    }),
  }),
  version: '2.x',
  GlobalWorkerOptions: { workerSrc: '' },
}))

// Mock scribe.js-ocr
vi.mock('scribe.js-ocr', () => ({
  default: vi.fn().mockImplementation(() => ({
    extractText: vi.fn().mockResolvedValue('Mocked OCR text'),
  })),
}))

describe('fileProcessing', () => {
  describe('extractFileContent', () => {
    it('should extract text from a mock .docx file', async () => {
      const arrayBuffer = new ArrayBuffer(0)
      const content = await extractFileContent(arrayBuffer, 'test.docx')
      expect(content.text).toContain('Mocked DOCX text')
    })

    it('should extract text from a mock .pdf file', async () => {
      const arrayBuffer = new ArrayBuffer(0)
      const content = await extractFileContent(arrayBuffer, 'test.pdf')
      expect(content.text).toContain('Mocked PDF text')
    })
  })

  describe('downloadFile', () => {
    it('should handle erpnext file download', async () => {
      const mockFile = {
        id: '1',
        url: '/files/test.txt',
        provider: 'erpnext' as const,
      }
      const config = {
        erpnext: {
          url: 'http://erpnext.local',
          apiKey: 'key',
          apiSecret: 'secret',
        },
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
      })

      const buffer = await downloadFile(config, mockFile)
      expect(buffer).toBeDefined()
      expect(global.fetch).toHaveBeenCalled()
    })
  })
})
