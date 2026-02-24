import { WordToolDefinition } from './types'

export const layoutTools: Record<string, WordToolDefinition> = {
  createSection: {
    name: 'createSection',
    description: 'Create a new section break at the current cursor position.',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'Type of section break: "NextPage", "Continuous", "EvenPage", "OddPage"',
          enum: ['NextPage', 'Continuous', 'EvenPage', 'OddPage'],
        },
      },
      required: [],
    },
    execute: async args => {
      const { type = 'NextPage' } = args
      return Word.run(async context => {
        const range = context.document.getSelection()
        range.insertBreak(type, 'After')
        await context.sync()
        return `Successfully inserted ${type} section break`
      })
    },
  },

  setPageMargins: {
    name: 'setPageMargins',
    description: 'Set the page margins for the current section.',
    inputSchema: {
      type: 'object',
      properties: {
        top: { type: 'number', description: 'Top margin in points' },
        bottom: { type: 'number', description: 'Bottom margin in points' },
        left: { type: 'number', description: 'Left margin in points' },
        right: { type: 'number', description: 'Right margin in points' },
      },
      required: [],
    },
    execute: async args => {
      const { top, bottom, left, right } = args
      return Word.run(async context => {
        const section = context.document.sections.getFirst()
        if (top !== undefined) section.pageSetup.topMargin = top
        if (bottom !== undefined) section.pageSetup.bottomMargin = bottom
        if (left !== undefined) section.pageSetup.leftMargin = left
        if (right !== undefined) section.pageSetup.rightMargin = right
        await context.sync()
        return 'Successfully updated page margins'
      })
    },
  },

  setPageOrientation: {
    name: 'setPageOrientation',
    description: 'Set the page orientation for the current section.',
    inputSchema: {
      type: 'object',
      properties: {
        orientation: {
          type: 'string',
          description: 'Page orientation: "Portrait" or "Landscape"',
          enum: ['Portrait', 'Landscape'],
        },
      },
      required: ['orientation'],
    },
    execute: async args => {
      const { orientation } = args
      return Word.run(async context => {
        const section = context.document.sections.getFirst()
        section.pageSetup.orientation = orientation as Word.PageOrientation
        await context.sync()
        return `Successfully set page orientation to ${orientation}`
      })
    },
  },

  setHeaderText: {
    name: 'setHeaderText',
    description: 'Set the text content of the header for the current section.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Header text' },
        headerType: {
          type: 'string',
          description: 'Header type: "Primary", "FirstPage", or "EvenPages"',
          enum: ['Primary', 'FirstPage', 'EvenPages'],
        },
      },
      required: ['text'],
    },
    execute: async args => {
      const { text, headerType = 'Primary' } = args
      return Word.run(async context => {
        const section = context.document.sections.getFirst()
        const header = section.getHeader(headerType as Word.HeaderFooterType)
        header.load('type')
        await context.sync()
        header.insertText(text, 'Replace')
        await context.sync()
        return `Successfully set ${headerType} header text`
      })
    },
  },

  setFooterText: {
    name: 'setFooterText',
    description: 'Set the text content of the footer for the current section.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Footer text' },
        footerType: {
          type: 'string',
          description: 'Footer type: "Primary", "FirstPage", or "EvenPages"',
          enum: ['Primary', 'FirstPage', 'EvenPages'],
        },
      },
      required: ['text'],
    },
    execute: async args => {
      const { text, footerType = 'Primary' } = args
      return Word.run(async context => {
        const section = context.document.sections.getFirst()
        const footer = section.getFooter(footerType as Word.HeaderFooterType)
        footer.insertText(text, 'Replace')
        await context.sync()
        return `Successfully set ${footerType} footer text`
      })
    },
  },

  setPageColumnCount: {
    name: 'setPageColumnCount',
    description: 'Set the number of columns for the current section layout.',
    inputSchema: {
      type: 'object',
      properties: { count: { type: 'number', description: 'Number of columns (1-3)' } },
      required: ['count'],
    },
    execute: async args => {
      const { count } = args
      return Word.run(async context => {
        const section = context.document.sections.getFirst()
        section.load('pageSetup')
        // @ts-ignore
        section.pageSetup.columnCount = count
        await context.sync()
        return `Successfully set page column count to ${count}`
      })
    },
  },

  setPageColor: {
    name: 'setPageColor',
    description:
      'Set the background color of the document pages (Note: Applied via document shading if direct page color is unavailable).',
    inputSchema: {
      type: 'object',
      properties: { color: { type: 'string', description: 'Background color hex (e.g., "#FFF2CC")' } },
      required: ['color'],
    },
    execute: async args => {
      const { color } = args
      return Word.run(async context => {
        context.document.body.shadingColor = color
        await context.sync()
        return `Successfully updated document background color to ${color}.`
      })
    },
  },

  insertWatermark: {
    name: 'insertWatermark',
    description: 'Insert a text watermark into the document.',
    inputSchema: {
      type: 'object',
      properties: { text: { type: 'string', description: 'Watermark text (e.g., "CONFIDENTIAL")' } },
      required: ['text'],
    },
    execute: async args => {
      const { text } = args
      return Word.run(async context => {
        const section = context.document.sections.getFirst()
        const header = section.getHeader('Primary')
        const ooxml = `
          <w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
            <w:p>
              <w:r>
                <w:pict>
                   <v:rect xmlns:v="urn:schemas-microsoft-com:vml" style="position:absolute;margin-left:50pt;margin-top:200pt;width:500pt;height:100pt;rotation:315;z-index:-1" stroked="f" filled="f">
                     <v:textbox><w:txbxContent><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:color w:val="C0C0C0"/><w:sz w:val="120"/></w:rPr><w:t>${text}</w:t></w:r></w:p></w:txbxContent></v:textbox>
                   </v:rect>
                </w:pict>
              </w:r>
            </w:p>
          </w:hdr>`
        header.insertOoxml(ooxml, 'Replace')
        await context.sync()
        return `Successfully inserted watermark: ${text}.`
      })
    },
  },

  setPaperSize: {
    name: 'setPaperSize',
    description: 'Set the paper size for the current section.',
    inputSchema: {
      type: 'object',
      properties: {
        size: {
          type: 'string',
          description: 'Paper size name',
          enum: ['A3', 'A4', 'A5', 'B4', 'B5', 'Executive', 'Legal', 'Letter', 'Statement'],
        },
      },
      required: ['size'],
    },
    execute: async args => {
      const { size } = args
      return Word.run(async context => {
        const section = context.document.sections.getFirst()
        section.pageSetup.paperSize = size as Word.PaperSize
        await context.sync()
        return `Successfully set paper size to ${size}.`
      })
    },
  },

  setLineNumbers: {
    name: 'setLineNumbers',
    description: 'Enable or disable line numbering for the current section.',
    inputSchema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean', description: 'Enable line numbering' },
        restartType: {
          type: 'string',
          description: 'When to restart numbering',
          enum: ['Continuous', 'NewPage', 'NewSection'],
        },
      },
      required: ['enabled'],
    },
    execute: async args => {
      const { enabled, restartType = 'NewPage' } = args
      return Word.run(async context => {
        const section = context.document.sections.getFirst()
        if (enabled) {
          // @ts-ignore
          section.pageSetup.lineNumbering.start = 1
          // @ts-ignore
          section.pageSetup.lineNumbering.countBy = 1
          // @ts-ignore
          section.pageSetup.lineNumbering.restartType = restartType as Word.LineNumberingRestartMode
        } else {
          // @ts-ignore
          section.pageSetup.lineNumbering.countBy = 0
        }
        await context.sync()
        return `Successfully ${enabled ? 'enabled' : 'disabled'} line numbering.`
      })
    },
  },
}
