import { WordToolDefinition } from './types'

export const formattingTools: Record<string, WordToolDefinition> = {
  formatText: {
    name: 'formatText',
    description: 'Apply formatting to the currently selected text.',
    inputSchema: {
      type: 'object',
      properties: {
        bold: { type: 'boolean', description: 'Make text bold' },
        italic: { type: 'boolean', description: 'Make text italic' },
        underline: { type: 'boolean', description: 'Underline text' },
        fontSize: { type: 'number', description: 'Font size in points' },
        fontColor: { type: 'string', description: 'Font color as hex (e.g., "#FF0000" for red)' },
        highlightColor: {
          type: 'string',
          description:
            'Highlight color: Yellow, Green, Cyan, Pink, Blue, Red, DarkBlue, Teal, Lime, Purple, Orange, etc.',
        },
      },
      required: [],
    },
    execute: async args => {
      const { bold, italic, underline, fontSize, fontColor, highlightColor } = args
      return Word.run(async context => {
        const range = context.document.getSelection()

        if (bold !== undefined) range.font.bold = bold
        if (italic !== undefined) range.font.italic = italic
        if (underline !== undefined) range.font.underline = underline ? 'Single' : 'None'
        if (fontSize !== undefined) range.font.size = fontSize
        if (fontColor !== undefined) range.font.color = fontColor
        if (highlightColor !== undefined) range.font.highlightColor = highlightColor

        await context.sync()
        return 'Successfully applied formatting'
      })
    },
  },

  clearFormatting: {
    name: 'clearFormatting',
    description: 'Clear all formatting from the selected text, returning it to default style.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    execute: async () => {
      return Word.run(async context => {
        const range = context.document.getSelection()
        range.font.bold = false
        range.font.italic = false
        range.font.underline = 'None'
        range.styleBuiltIn = 'Normal'
        await context.sync()
        return 'Successfully cleared formatting'
      })
    },
  },

  setFontName: {
    name: 'setFontName',
    description: 'Set the font name/family for the selected text (e.g., Arial, Times New Roman, Calibri).',
    inputSchema: {
      type: 'object',
      properties: {
        fontName: {
          type: 'string',
          description: 'The font name to apply (e.g., "Arial", "Times New Roman", "Calibri", "Consolas")',
        },
      },
      required: ['fontName'],
    },
    execute: async args => {
      const { fontName } = args
      return Word.run(async context => {
        const range = context.document.getSelection()
        range.font.name = fontName
        await context.sync()
        return `Successfully set font to ${fontName}`
      })
    },
  },

  applyStyle: {
    name: 'applyStyle',
    description: 'Apply a Word style to the selected text (e.g., "Heading 1", "Normal", "Quote").',
    inputSchema: {
      type: 'object',
      properties: {
        styleName: {
          type: 'string',
          description: 'The name of the style to apply (e.g., Heading 1, Heading 2, Normal, Title)',
        },
      },
      required: ['styleName'],
    },
    execute: async args => {
      const { styleName } = args
      return Word.run(async context => {
        const range = context.document.getSelection()
        range.style = styleName
        await context.sync()
        return `Successfully applied style: ${styleName}`
      })
    },
  },

  setFontAdvanced: {
    name: 'setFontAdvanced',
    description: 'Apply advanced font formatting like strikethrough, subscript, or superscript.',
    inputSchema: {
      type: 'object',
      properties: {
        strikethrough: { type: 'boolean', description: 'Apply strikethrough' },
        subscript: { type: 'boolean', description: 'Apply subscript' },
        superscript: { type: 'boolean', description: 'Apply superscript' },
        doubleStrikethrough: { type: 'boolean', description: 'Apply double strikethrough' },
      },
      required: [],
    },
    execute: async args => {
      const { strikethrough, subscript, superscript, doubleStrikethrough } = args
      return Word.run(async context => {
        const range = context.document.getSelection()
        if (strikethrough !== undefined) range.font.strikeThrough = strikethrough
        if (doubleStrikethrough !== undefined) range.font.doubleStrikeThrough = doubleStrikethrough
        if (subscript !== undefined) range.font.subscript = subscript
        if (superscript !== undefined) range.font.superscript = superscript

        await context.sync()
        return 'Successfully updated font advanced settings'
      })
    },
  },

  changeCase: {
    name: 'changeCase',
    description: 'Change the case of the selected text.',
    inputSchema: {
      type: 'object',
      properties: {
        caseType: {
          type: 'string',
          description: 'Type of case to apply',
          enum: ['lowercase', 'UPPERCASE', 'Sentence case', 'Capitalize Each Word'],
        },
      },
      required: ['caseType'],
    },
    execute: async args => {
      const { caseType } = args
      return Word.run(async context => {
        const range = context.document.getSelection()
        range.load('text')
        await context.sync()

        let newText = range.text || ''
        switch (caseType) {
          case 'lowercase':
            newText = newText.toLowerCase()
            break
          case 'UPPERCASE':
            newText = newText.toUpperCase()
            break
          case 'Sentence case':
            newText = newText.charAt(0).toUpperCase() + newText.slice(1).toLowerCase()
            break
          case 'Capitalize Each Word':
            newText = newText.replace(/\b\w/g, l => l.toUpperCase())
            break
        }

        range.insertText(newText, 'Replace')
        await context.sync()
        return `Successfully changed text to ${caseType}`
      })
    },
  },

  setParagraphAlignment: {
    name: 'setParagraphAlignment',
    description: 'Set the alignment for the selected paragraphs.',
    inputSchema: {
      type: 'object',
      properties: {
        alignment: {
          type: 'string',
          description: 'Alignment: "Left", "Centered", "Right", or "Justified"',
          enum: ['Left', 'Centered', 'Right', 'Justified'],
        },
      },
      required: ['alignment'],
    },
    execute: async args => {
      const { alignment } = args
      return Word.run(async context => {
        const range = context.document.getSelection()
        range.paragraphs.load('items')
        await context.sync()

        for (const paragraph of range.paragraphs.items) {
          paragraph.alignment = alignment as Word.Alignment
        }

        await context.sync()
        return `Successfully set paragraph alignment to ${alignment}`
      })
    },
  },

  setLineSpacing: {
    name: 'setLineSpacing',
    description: 'Set the line spacing for the selected paragraphs.',
    inputSchema: {
      type: 'object',
      properties: {
        spacing: { type: 'number', description: 'Line spacing in points' },
      },
      required: ['spacing'],
    },
    execute: async args => {
      const { spacing } = args
      return Word.run(async context => {
        const range = context.document.getSelection()
        range.paragraphs.load('items')
        await context.sync()

        for (const paragraph of range.paragraphs.items) {
          paragraph.lineSpacing = spacing
        }

        await context.sync()
        return `Successfully set line spacing to ${spacing}`
      })
    },
  },

  setParagraphSpacing: {
    name: 'setParagraphSpacing',
    description: 'Set the spacing before and after the selected paragraphs.',
    inputSchema: {
      type: 'object',
      properties: {
        before: { type: 'number', description: 'Spacing before in points' },
        after: { type: 'number', description: 'Spacing after in points' },
        lineSpacing: { type: 'number', description: 'Line spacing in points' },
      },
      required: [],
    },
    execute: async args => {
      const { before, after, lineSpacing } = args
      return Word.run(async context => {
        const range = context.document.getSelection()
        range.paragraphs.load('items')
        await context.sync()

        for (const paragraph of range.paragraphs.items) {
          // @ts-ignore
          if (before !== undefined) paragraph.spacingBefore = before
          // @ts-ignore
          if (after !== undefined) paragraph.spacingAfter = after
          if (lineSpacing !== undefined) paragraph.lineSpacing = lineSpacing
        }

        await context.sync()
        return 'Successfully updated paragraph spacing'
      })
    },
  },

  setParagraphIndentation: {
    name: 'setParagraphIndentation',
    description: 'Set the indentation for the selected paragraphs.',
    inputSchema: {
      type: 'object',
      properties: {
        leftIndent: { type: 'number', description: 'Left indent in points' },
        rightIndent: { type: 'number', description: 'Right indent in points' },
        firstLineIndent: { type: 'number', description: 'First line indent in points (negative for hanging indent)' },
      },
      required: [],
    },
    execute: async args => {
      const { leftIndent, rightIndent, firstLineIndent } = args
      return Word.run(async context => {
        const range = context.document.getSelection()
        range.paragraphs.load('items')
        await context.sync()

        for (const paragraph of range.paragraphs.items) {
          if (leftIndent !== undefined) paragraph.leftIndent = leftIndent
          if (rightIndent !== undefined) paragraph.rightIndent = rightIndent
          if (firstLineIndent !== undefined) paragraph.firstLineIndent = firstLineIndent
        }

        await context.sync()
        return 'Successfully updated paragraph indentation'
      })
    },
  },

  setParagraphBorders: {
    name: 'setParagraphBorders',
    description: 'Apply borders to the selected paragraphs.',
    inputSchema: {
      type: 'object',
      properties: {
        color: { type: 'string', description: 'Border color in hex (e.g., "#000000")' },
        style: {
          type: 'string',
          description: 'Border style: Single, Double, DashDot, etc.',
          enum: [
            'None',
            'Single',
            'Double',
            'Dotted',
            'Dashed',
            'DotDash',
            'DotDotDash',
            'Triple',
            'ThinThickSmall',
            'ThickThinSmall',
            'ThinThickThinSmall',
            'ThinThickMedium',
            'ThickThinMedium',
            'ThinThickThinMedium',
            'ThinThickLarge',
            'ThickThinLarge',
            'ThinThickThinLarge',
            'Wave',
            'DoubleWave',
            'DashSmallGap',
            'DashDotStroked',
            'ThreeDEmboss',
            'ThreeDEngrave',
          ],
        },
        width: { type: 'number', description: 'Border width in points' },
      },
      required: ['color', 'style'],
    },
    execute: async args => {
      const { color, style, width = 1 } = args
      return Word.run(async context => {
        const range = context.document.getSelection()
        range.paragraphs.load('items')
        await context.sync()

        for (const paragraph of range.paragraphs.items) {
          const borders = paragraph.borders
          const borderList: ('top' | 'bottom' | 'left' | 'right')[] = ['top', 'bottom', 'left', 'right']
          for (const side of borderList) {
            // @ts-ignore
            const border = borders[side]
            border.color = color
            border.type = style as Word.BorderType
            border.width = width
          }
        }

        await context.sync()
        return 'Successfully applied paragraph borders'
      })
    },
  },

  setParagraphShading: {
    name: 'setParagraphShading',
    description: 'Set the background shading color for the selected paragraphs.',
    inputSchema: {
      type: 'object',
      properties: {
        color: { type: 'string', description: 'Background color in hex (e.g., "#FFFF00")' },
      },
      required: ['color'],
    },
    execute: async args => {
      const { color } = args
      return Word.run(async context => {
        const range = context.document.getSelection()
        range.paragraphs.load('items')
        await context.sync()

        for (const paragraph of range.paragraphs.items) {
          paragraph.shadingColor = color
        }

        await context.sync()
        return 'Successfully updated paragraph shading'
      })
    },
  },

  listStyles: {
    name: 'listStyles',
    description: 'List all styles available in the document.',
    inputSchema: {
      type: 'object',
      properties: {
        includeBuiltIn: { type: 'boolean', description: 'Include built-in styles (default: true)' },
      },
      required: [],
    },
    execute: async args => {
      const { includeBuiltIn = true } = args
      return Word.run(async context => {
        const styles = context.document.styles
        styles.load('items')
        await context.sync()

        const styleList = styles.items
          .filter(s => includeBuiltIn || !s.builtIn)
          .map(s => ({
            name: s.nameLocal,
            builtIn: s.builtIn,
            type: s.type,
          }))

        return JSON.stringify(styleList, null, 2)
      })
    },
  },
}
