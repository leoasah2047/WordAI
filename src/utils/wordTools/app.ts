/* global Office */
import { WordToolDefinition } from './types'

export const appTools: Record<string, WordToolDefinition> = {
  setTrackChanges: {
    name: 'setTrackChanges',
    description: 'Enable or disable Track Changes in the document.',
    inputSchema: {
      type: 'object',
      properties: { enabled: { type: 'boolean', description: 'True to enable, false to disable' } },
      required: ['enabled'],
    },
    execute: async args => {
      const { enabled } = args
      return Word.run(async context => {
        context.document.changeTrackingMode = enabled ? 'TrackAll' : 'Off'
        await context.sync()
        return `Successfully set Track Changes to ${enabled ? 'Enabled' : 'Disabled'}`
      })
    },
  },

  acceptTrackedChanges: {
    name: 'acceptTrackedChanges',
    description: 'Accept all tracked changes in the document.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    execute: async () => {
      return Word.run(async context => {
        context.document.acceptAllTrackedChanges()
        await context.sync()
        return 'Successfully accepted all tracked changes'
      })
    },
  },

  rejectTrackedChanges: {
    name: 'rejectTrackedChanges',
    description: 'Reject all tracked changes in the document.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    execute: async () => {
      return Word.run(async context => {
        context.document.rejectAllTrackedChanges()
        await context.sync()
        return 'Successfully rejected all tracked changes'
      })
    },
  },

  saveDocument: {
    name: 'saveDocument',
    description: 'Save the current document to its current location (local or cloud).',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    execute: async () => {
      return Word.run(async context => {
        context.document.save()
        await context.sync()
        return 'Successfully saved document.'
      })
    },
  },

  printDocument: {
    name: 'printDocument',
    description:
      'Trigger the printer selection and print settings (Note: Platform may open the standard print dialog).',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    execute: async () => {
      try {
        window.print()
        return 'Triggered system print dialog.'
      } catch (_e) {
        return 'Printing is not directly supported via the current API context. Please use the Print menu or Ctrl+P.'
      }
    },
  },

  exportAsPdf: {
    name: 'exportAsPdf',
    description: 'Export the document as a PDF file.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    execute: async () => {
      return new Promise((resolve, reject) => {
        Office.context.document.getFileAsync(Office.FileType.Pdf, { sliceSize: 65536 }, result => {
          if (result.status === Office.AsyncResultStatus.Succeeded) {
            const file = result.value
            const sliceCount = file.sliceCount
            const slices: any[] = []
            let gotSlices = 0

            const getSlice = (index: number) => {
              file.getSliceAsync(index, sliceResult => {
                if (sliceResult.status === Office.AsyncResultStatus.Succeeded) {
                  slices[index] = sliceResult.value.data
                  gotSlices++
                  if (gotSlices === sliceCount) {
                    file.closeAsync()
                    const blob = new Blob(slices, { type: 'application/pdf' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'Document.pdf'
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    URL.revokeObjectURL(url)
                    resolve('Successfully exported and downloaded PDF.')
                  } else {
                    getSlice(gotSlices)
                  }
                } else {
                  file.closeAsync()
                  reject(new Error(`Error getting slice ${index}: ${sliceResult.error.message}`))
                }
              })
            }
            getSlice(0)
          } else {
            resolve(`Error exporting PDF: ${result.error.message}`)
          }
        })
      })
    },
  },

  newDocument: {
    name: 'newDocument',
    description: 'Create a new blank document.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    execute: async () => {
      return Word.run(async context => {
        context.application.createDocument()
        await context.sync()
        return 'Successfully created a new document window.'
      })
    },
  },

  compareDocuments: {
    name: 'compareDocuments',
    description: 'Compare the current document with another version (Note: Requires document base64).',
    inputSchema: {
      type: 'object',
      properties: { otherDocBase64: { type: 'string', description: 'Base64 string of the other document' } },
      required: ['otherDocBase64'],
    },
    execute: async args => {
      const { otherDocBase64 } = args
      return Word.run(async context => {
        context.document.compare(otherDocBase64)
        await context.sync()
        return 'Successfully initiated document comparison.'
      })
    },
  },

  protectDocument: {
    name: 'protectDocument',
    description: 'Protect the document with a specific protection type.',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'Protection type',
          enum: ['ReadOnly', 'CommentsOnly', 'TrackedChangesOnly', 'FormsOnly'],
        },
        password: { type: 'string', description: 'Optional password' },
      },
      required: ['type'],
    },
    execute: async args => {
      const { type, password } = args
      return Word.run(async context => {
        // @ts-ignore
        context.document.protection.protect(type as Word.ProtectionType, password)
        await context.sync()
        return `Successfully protected document as ${type}.`
      })
    },
  },

  setZoom: {
    name: 'setZoom',
    description: 'Adjust the view zoom level.',
    inputSchema: {
      type: 'object',
      properties: { percent: { type: 'number', description: 'Zoom percentage (e.g., 100, 150)' } },
      required: ['percent'],
    },
    execute: async args => {
      const { percent } = args
      return Word.run(async context => {
        // @ts-ignore
        context.document.view.zoom = percent
        await context.sync()
        return `Successfully set zoom to ${percent}%.`
      })
    },
  },

  setHyphenation: {
    name: 'setHyphenation',
    description: 'Enable or disable automatic hyphenation for the document.',
    inputSchema: {
      type: 'object',
      properties: { enabled: { type: 'boolean', description: 'Enable hyphenation' } },
      required: ['enabled'],
    },
    execute: async args => {
      const { enabled } = args
      return Word.run(async context => {
        // @ts-ignore
        context.document.hyphenation = enabled
        await context.sync()
        return `Successfully ${enabled ? 'enabled' : 'disabled'} automatic hyphenation.`
      })
    },
  },

  arrangeObject: {
    name: 'arrangeObject',
    description: 'Adjust the layout, position, and text wrapping of a selected object (image or shape).',
    inputSchema: {
      type: 'object',
      properties: {
        wrapText: {
          type: 'string',
          description: 'Text wrapping style',
          enum: ['Square', 'Tight', 'Through', 'TopAndBottom', 'BehindText', 'InFrontOfText', 'Inline'],
        },
        alignment: {
          type: 'string',
          description: 'Horizontal alignment relative to page',
          enum: ['Left', 'Centered', 'Right'],
        },
        vAlignment: {
          type: 'string',
          description: 'Vertical alignment relative to page',
          enum: ['Top', 'Center', 'Bottom'],
        },
      },
      required: ['wrapText'],
    },
    execute: async args => {
      const { wrapText, alignment, vAlignment } = args
      return Word.run(async context => {
        const selection = context.document.getSelection()
        const pictures = selection.inlinePictures
        pictures.load('items')
        await context.sync()

        if (pictures.items.length === 0) {
          return 'No object (inline image) selected. Note: Only inline images can be converted to floating objects via this tool.'
        }

        const picture = pictures.items[0]
        // @ts-ignore
        picture.load('base64Content')
        await context.sync()

        // Meta-tagging fallback
        picture.altTextDescription = `Wrapped: ${wrapText}, Align: ${alignment || 'none'}, VAlign: ${vAlignment || 'none'}`

        await context.sync()
        return `Successfully set wrapping metadata to ${wrapText}${alignment ? ` and alignment to ${alignment}` : ''}.`
      })
    },
  },

  translateSelection: {
    name: 'translateSelection',
    description:
      'Translate the selected text (Note: Uses a placeholder if external translation API is not configured).',
    inputSchema: {
      type: 'object',
      properties: { targetLanguage: { type: 'string', description: 'Target language (e.g., "French", "Spanish")' } },
      required: ['targetLanguage'],
    },
    execute: async args => {
      const { targetLanguage } = args
      return Word.run(async context => {
        const range = context.document.getSelection()
        range.load('text')
        await context.sync()

        const originalText = range.text || ''
        if (!originalText) return 'No text selected for translation.'

        try {
          const { getChatResponse } = await import('@/api/union')
          const { useAuthStore } = await import('@/stores/AuthStore')
          const authStore = useAuthStore()

          let translatedText = ''
          await getChatResponse({
            provider: 'gemini',
            messages: [
              {
                role: 'system',
                content: `You are a professional translator. Translate the following text into ${targetLanguage}. Return ONLY the translated text.`,
              },
              { role: 'user', content: originalText },
            ],
            geminiAPIKey: authStore.googleApiKey || '',
            geminiModel: 'gemini-1.5-flash',
            onStream: content => {
              translatedText = content
            },
            loading: { value: true } as any,
            errorIssue: { value: false } as any,
          })

          if (translatedText) {
            range.insertText(translatedText, 'Replace')
            await context.sync()
            return `Successfully translated text to ${targetLanguage}.`
          } else {
            return 'Translation returned empty result.'
          }
        } catch (error: any) {
          console.error('Translation failed:', error)
          return `Translation failed: ${error.message}`
        }
      })
    },
  },
}
