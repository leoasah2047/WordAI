import { WordToolDefinition } from './types'

export const elementTools: Record<string, WordToolDefinition> = {
  insertTable: {
    name: 'insertTable',
    description: 'Insert a table at the current cursor position.',
    inputSchema: {
      type: 'object',
      properties: {
        rows: { type: 'number', description: 'Number of rows' },
        columns: { type: 'number', description: 'Number of columns' },
        data: {
          type: 'array',
          description: 'Optional 2D array of cell values',
          items: { type: 'array', items: { type: 'string' } },
        },
      },
      required: ['rows', 'columns'],
    },
    execute: async args => {
      const { rows, columns, data } = args
      return Word.run(async context => {
        const range = context.document.getSelection()
        const tableData: string[][] =
          data ||
          Array(rows)
            .fill(null)
            .map(() => Array(columns).fill(''))
        const table = range.insertTable(rows, columns, 'After', tableData)
        table.styleBuiltIn = 'GridTable1Light'
        await context.sync()
        return `Successfully inserted ${rows}x${columns} table`
      })
    },
  },

  insertList: {
    name: 'insertList',
    description: 'Insert a bulleted or numbered list at the current position.',
    inputSchema: {
      type: 'object',
      properties: {
        items: { type: 'array', description: 'Array of list item texts', items: { type: 'string' } },
        listType: { type: 'string', description: 'Type of list: "bullet" or "number"', enum: ['bullet', 'number'] },
      },
      required: ['items', 'listType'],
    },
    execute: async args => {
      const { items, listType } = args
      return Word.run(async context => {
        const range = context.document.getSelection()
        let insertionPoint = range
        for (const item of items) {
          const paragraph = insertionPoint.insertParagraph(item, 'After')
          paragraph.listItem.level = 0
          insertionPoint = paragraph.getRange('End')
        }
        await context.sync()
        return `Successfully inserted ${listType} list with ${items.length} items`
      })
    },
  },

  insertImage: {
    name: 'insertImage',
    description: 'Insert an image from a URL at the current cursor position. The image URL must be accessible.',
    inputSchema: {
      type: 'object',
      properties: {
        imageUrl: { type: 'string', description: 'The URL of the image to insert' },
        width: { type: 'number', description: 'Optional width in points' },
        height: { type: 'number', description: 'Optional height in points' },
        location: {
          type: 'string',
          description: 'Where to insert: "Before", "After", "Start", "End", or "Replace"',
          enum: ['Before', 'After', 'Start', 'End', 'Replace'],
        },
      },
      required: ['imageUrl'],
    },
    execute: async args => {
      const { imageUrl, width, height, location = 'After' } = args
      try {
        const response = await fetch(imageUrl)
        const blob = await response.blob()
        const reader = new FileReader()
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const base64String = reader.result as string
            const base64 = base64String.split(',')[1]
            resolve(base64)
          }
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
        const base64 = await base64Promise
        return Word.run(async context => {
          const range = context.document.getSelection()
          const image = range.insertInlinePictureFromBase64(base64, location as Word.InsertLocation)
          if (width) image.width = width
          if (height) image.height = height
          await context.sync()
          return `Successfully inserted image at ${location}`
        })
      } catch (error: any) {
        return `Error inserting image: ${error.message}`
      }
    },
  },

  insertBookmark: {
    name: 'insertBookmark',
    description: 'Insert a bookmark at the current selection to mark a location in the document.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'The name of the bookmark (must be unique, no spaces allowed)' },
      },
      required: ['name'],
    },
    execute: async args => {
      const { name } = args
      return Word.run(async context => {
        const range = context.document.getSelection()
        const bookmarkName = name.replace(/\s+/g, '_')
        const contentControl = range.insertContentControl()
        contentControl.tag = `bookmark_${bookmarkName}`
        contentControl.title = bookmarkName
        contentControl.appearance = 'Tags'
        await context.sync()
        return `Successfully inserted bookmark: ${bookmarkName}`
      })
    },
  },

  goToBookmark: {
    name: 'goToBookmark',
    description: 'Navigate to a previously created bookmark in the document.',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string', description: 'The name of the bookmark to navigate to' } },
      required: ['name'],
    },
    execute: async args => {
      const { name } = args
      return Word.run(async context => {
        const bookmarkName = name.replace(/\s+/g, '_')
        const contentControls = context.document.contentControls
        contentControls.load(['items'])
        await context.sync()
        for (const cc of contentControls.items) {
          cc.load(['tag', 'title'])
          await context.sync()
          if (cc.tag === `bookmark_${bookmarkName}` || cc.title === bookmarkName) {
            cc.select()
            await context.sync()
            return `Successfully navigated to bookmark: ${bookmarkName}`
          }
        }
        return `Bookmark not found: ${bookmarkName}`
      })
    },
  },

  insertContentControl: {
    name: 'insertContentControl',
    description:
      'Insert a content control (a container for content) at the current selection. Useful for creating structured documents.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'The title of the content control' },
        tag: { type: 'string', description: 'Optional tag for programmatic identification' },
        appearance: {
          type: 'string',
          description: 'Visual appearance of the control',
          enum: ['BoundingBox', 'Tags', 'Hidden'],
        },
      },
      required: ['title'],
    },
    execute: async args => {
      const { title, tag, appearance = 'BoundingBox' } = args
      return Word.run(async context => {
        const range = context.document.getSelection()
        const contentControl = range.insertContentControl()
        contentControl.title = title
        if (tag) contentControl.tag = tag
        contentControl.appearance = appearance as Word.ContentControlAppearance
        await context.sync()
        return `Successfully inserted content control: ${title}`
      })
    },
  },

  insertHyperlink: {
    name: 'insertHyperlink',
    description: 'Insert a hyperlink on the selected text or at the cursor.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'The absolute URL' },
        text: { type: 'string', description: 'The link text' },
      },
      required: ['url'],
    },
    execute: async args => {
      const { url, text } = args
      return Word.run(async context => {
        const range = context.document.getSelection()
        if (text) range.insertText(text, 'Replace')
        range.hyperlink = url
        await context.sync()
        return 'Successfully inserted hyperlink'
      })
    },
  },

  insertFootnote: {
    name: 'insertFootnote',
    description: 'Insert a footnote at the current position.',
    inputSchema: {
      type: 'object',
      properties: { text: { type: 'string', description: 'Footnote text' } },
      required: ['text'],
    },
    execute: async args => {
      const { text } = args
      return Word.run(async context => {
        const range = context.document.getSelection()
        range.insertFootnote(text)
        await context.sync()
        return 'Successfully inserted footnote'
      })
    },
  },

  insertEndnote: {
    name: 'insertEndnote',
    description: 'Insert an endnote at the current position.',
    inputSchema: {
      type: 'object',
      properties: { text: { type: 'string', description: 'Endnote text' } },
      required: ['text'],
    },
    execute: async args => {
      const { text } = args
      return Word.run(async context => {
        const range = context.document.getSelection()
        range.insertEndnote(text)
        await context.sync()
        return 'Successfully inserted endnote'
      })
    },
  },

  insertTableOfContents: {
    name: 'insertTableOfContents',
    description: 'Insert a Table of Contents at the current position.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    execute: async () => {
      return Word.run(async context => {
        const range = context.document.getSelection()
        // @ts-ignore
        range.insertTableOfContents()
        await context.sync()
        return 'Successfully inserted Table of Contents'
      })
    },
  },

  insertPageNumber: {
    name: 'insertPageNumber',
    description: 'Insert a page number field at the current position.',
    inputSchema: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'Where to insert (usually "After")',
          enum: ['Before', 'After', 'Replace'],
        },
      },
      required: [],
    },
    execute: async args => {
      const { location = 'After' } = args
      return Word.run(async context => {
        const range = context.document.getSelection()
        // @ts-ignore
        range.insertField('PAGE', 'Normal', location as Word.InsertLocation)
        await context.sync()
        return 'Successfully inserted page number field'
      })
    },
  },

  insertSymbol: {
    name: 'insertSymbol',
    description: 'Insert a specific symbol or character at the current position.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'The symbol or character to insert (Unicode)' },
        fontName: { type: 'string', description: 'Optional font for the symbol (e.g., "Wingdings")' },
      },
      required: ['symbol'],
    },
    execute: async args => {
      const { symbol, fontName } = args
      return Word.run(async context => {
        const range = context.document.getSelection()
        const newRange = range.insertText(symbol, 'Replace')
        if (fontName) newRange.font.name = fontName
        await context.sync()
        return `Successfully inserted symbol: ${symbol}`
      })
    },
  },

  insertTextBox: {
    name: 'insertTextBox',
    description: 'Insert a text box with the specified content at the current position.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'The text to put inside the text box' },
        width: { type: 'number', description: 'Width in points' },
        height: { type: 'number', description: 'Height in points' },
      },
      required: ['text'],
    },
    execute: async args => {
      const { text, width = 200, height = 100 } = args
      return Word.run(async context => {
        const range = context.document.getSelection()
        const ooxml = `
          <w:p xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
            <w:r>
              <w:pict>
                <v:shape xmlns:v="urn:schemas-microsoft-com:vml" style="width:${width}pt;height:${height}pt">
                  <v:textbox>
                    <w:txbxContent>
                      <w:p><w:r><w:t>${text}</w:t></w:r></w:p>
                    </w:txbxContent>
                  </v:textbox>
                </v:shape>
              </w:pict>
            </w:r>
          </w:p>`
        range.insertOoxml(ooxml, 'Replace')
        await context.sync()
        return 'Successfully inserted text box'
      })
    },
  },

  insertShape: {
    name: 'insertShape',
    description: 'Insert a basic shape (Rectangle) into the document.',
    inputSchema: {
      type: 'object',
      properties: {
        color: { type: 'string', description: 'Fill color (e.g., "red", "blue", "#FF0000")' },
        width: { type: 'number', description: 'Width in points' },
        height: { type: 'number', description: 'Height in points' },
      },
      required: [],
    },
    execute: async args => {
      const { color = 'blue', width = 100, height = 100 } = args
      return Word.run(async context => {
        const range = context.document.getSelection()
        const ooxml = `
          <w:p xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
            <w:r>
              <w:pict>
                <v:rect xmlns:v="urn:schemas-microsoft-com:vml" style="width:${width}pt;height:${height}pt" fillcolor="${color}"/>
              </w:pict>
            </w:r>
          </w:p>`
        range.insertOoxml(ooxml, 'Replace')
        await context.sync()
        return 'Successfully inserted shape.'
      })
    },
  },

  insertChart: {
    name: 'insertChart',
    description: 'Insert a placeholder chart into the document.',
    inputSchema: {
      type: 'object',
      properties: { type: { type: 'string', description: 'Type of chart', enum: ['Bar', 'Pie', 'Line'] } },
      required: [],
    },
    execute: async args => {
      const { type = 'Bar' } = args
      return Word.run(async context => {
        const range = context.document.getSelection()
        const ooxml = `
          <w:p xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:v="urn:schemas-microsoft-com:vml">
            <w:r>
              <w:pict>
                <v:group style="width:220pt;height:160pt" coordsize="220,160">
                  <v:rect style="width:220pt;height:160pt" fillcolor="#ffffff" stroked="t"/>
                  <v:rect style="left:20;top:40;width:30;height:100" fillcolor="#4285f4"/>
                  <v:rect style="left:70;top:60;width:30;height:80" fillcolor="#ea4335"/>
                  <v:rect style="left:120;top:30;width:30;height:110" fillcolor="#fbbc04"/>
                  <v:rect style="left:170;top:50;width:30;height:90" fillcolor="#34a853"/>
                  <v:textbox style="margin-top:5pt">
                    <w:txbxContent><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>${type} Chart</w:t></w:r></w:p></w:txbxContent>
                  </v:textbox>
                </v:group>
              </w:pict>
            </w:r>
          </w:p>`
        range.insertOoxml(ooxml, 'Replace')
        await context.sync()
        return `Successfully inserted ${type} chart placeholder.`
      })
    },
  },

  insertSmartArt: {
    name: 'insertSmartArt',
    description: 'Insert a SmartArt-like diagram placeholder.',
    inputSchema: {
      type: 'object',
      properties: { diagramType: { type: 'string', description: 'Type of diagram (Process, Cycle, etc.)' } },
      required: [],
    },
    execute: async args => {
      const { diagramType = 'Process' } = args
      return Word.run(async context => {
        const range = context.document.getSelection()
        const ooxml = `
          <w:p xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:v="urn:schemas-microsoft-com:vml">
            <w:r>
              <w:pict>
                <v:group style="width:320pt;height:120pt" coordsize="320,120">
                  <v:roundrect style="left:10;top:35;width:90;height:50" fillcolor="#e1f5fe" arcsize="0.2">
                    <v:textbox><w:txbxContent><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>Step 1</w:t></w:r></w:p></w:txbxContent></v:textbox>
                  </v:roundrect>
                  <v:line from="100,60" to="120,60" strokecolor="#000000">
                    <v:stroke endarrow="block"/>
                  </v:line>
                  <v:roundrect style="left:120;top:35;width:90;height:50" fillcolor="#e1f5fe" arcsize="0.2">
                    <v:textbox><w:txbxContent><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>Step 2</w:t></w:r></w:p></w:txbxContent></v:textbox>
                  </v:roundrect>
                  <v:line from="210,60" to="230,60" strokecolor="#000000">
                    <v:stroke endarrow="block"/>
                  </v:line>
                  <v:roundrect style="left:230;top:35;width:90;height:50" fillcolor="#e1f5fe" arcsize="0.2">
                    <v:textbox><w:txbxContent><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>Step 3</w:t></w:r></w:p></w:txbxContent></v:textbox>
                  </v:roundrect>
                  <v:textbox style="left:10;top:5;width:300;height:30">
                    <w:txbxContent><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>SmartArt: ${diagramType} Diagram</w:t></w:r></w:p></w:txbxContent>
                  </v:textbox>
                </v:group>
              </w:pict>
            </w:r>
          </w:p>`
        range.insertOoxml(ooxml, 'Replace')
        await context.sync()
        return 'Successfully inserted SmartArt placeholder.'
      })
    },
  },

  insertCaption: {
    name: 'insertCaption',
    description: 'Insert a caption for an image or table.',
    inputSchema: {
      type: 'object',
      properties: {
        label: { type: 'string', description: 'Label (e.g., "Figure", "Table")' },
        title: { type: 'string', description: 'Caption title text' },
      },
      required: ['label', 'title'],
    },
    execute: async args => {
      const { label, title } = args
      return Word.run(async context => {
        const range = context.document.getSelection()
        const paragraph = range.insertParagraph(`${label} : ${title}`, 'After')
        paragraph.style = 'Caption'
        await context.sync()
        return 'Successfully inserted caption.'
      })
    },
  },

  insertIndex: {
    name: 'insertIndex',
    description: 'Insert an index at the end of the document.',
    inputSchema: {
      type: 'object',
      properties: { columns: { type: 'number', description: 'Number of columns in the index' } },
      required: [],
    },
    execute: async args => {
      const { columns = 2 } = args
      return Word.run(async context => {
        const body = context.document.body
        const index = body.insertIndex('End')
        index.columns = columns
        await context.sync()
        return 'Successfully inserted index.'
      })
    },
  },

  insertCitation: {
    name: 'insertCitation',
    description: 'Add a bibliographic citation source to the document using standard Word fields.',
    inputSchema: {
      type: 'object',
      properties: {
        author: { type: 'string', description: 'Author name(s)' },
        title: { type: 'string', description: 'Title of the work' },
        year: { type: 'number', description: 'Year of publication' },
        journal: { type: 'string', description: 'Journal or publisher name' },
        tag: { type: 'string', description: 'Short tag/ID for the citation (e.g., SMITH2024)' },
      },
      required: ['author', 'title'],
    },
    execute: async args => {
      const { author, title, year, tag } = args
      return Word.run(async context => {
        const range = context.document.getSelection()
        const field = range.insertField(`CITATION ${tag || author.split(' ')[0]} \\l 1033`, 'Normal', 'Replace')
        // @ts-ignore
        const fieldRange = field.getRange().insertContentControl()
        fieldRange.title = 'Citation'
        fieldRange.tag = tag || 'BIB_CITATION'
        fieldRange.appearance = 'BoundingBox'
        await context.sync()
        return `Successfully inserted citation for "${title}" by ${author}.`
      })
    },
  },

  insertTableOfAuthorities: {
    name: 'insertTableOfAuthorities',
    description: 'Insert a Table of Authorities (legal) at the end of the document.',
    inputSchema: {
      type: 'object',
      properties: { category: { type: 'string', description: 'Category (e.g., "Cases", "Statutes")' } },
      required: [],
    },
    execute: async args => {
      const { category = 'Cases' } = args
      return Word.run(async context => {
        const body = context.document.body
        // @ts-ignore
        body.insertTableOfAuthorities(category, 'End')
        await context.sync()
        return `Successfully inserted Table of Authorities for ${category}.`
      })
    },
  },

  insertAnnotation: {
    name: 'insertAnnotation',
    description: 'Insert an annotation (critique or note) for the selected text.',
    inputSchema: {
      type: 'object',
      properties: {
        critic: { type: 'string', description: 'Name of the person/agent providing the annotation' },
        content: { type: 'string', description: 'The text of the annotation' },
      },
      required: ['content'],
    },
    execute: async args => {
      const { critic = 'AI Assistant', content } = args
      return Word.run(async context => {
        const range = context.document.getSelection()
        // @ts-ignore
        if (range.insertAnnotation) {
          // @ts-ignore
          range.insertAnnotation(content, critic)
          await context.sync()
          return 'Successfully inserted annotation.'
        } else {
          range.insertComment(`${critic}: ${content}`)
          await context.sync()
          return 'Annotation not supported in this Word version; inserted as a comment instead.'
        }
      })
    },
  },

  insertCheckboxContentControl: {
    name: 'insertCheckboxContentControl',
    description: 'Insert a checkbox content control at the current position.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Title of the checkbox' },
        checked: { type: 'boolean', description: 'Initial state of the checkbox' },
      },
      required: [],
    },
    execute: async args => {
      const { title = 'Checkbox', checked = false } = args
      return Word.run(async context => {
        const range = context.document.getSelection()
        const cc = range.insertContentControl()
        cc.title = title
        // @ts-ignore
        if (cc.checkbox) {
          // @ts-ignore
          cc.checkbox.checked = checked
        } else {
          cc.tag = 'CHECKBOX_FALLBACK'
          cc.insertText(checked ? '[x] ' : '[ ] ', 'Start')
        }
        await context.sync()
        return `Successfully inserted checkbox: ${title}`
      })
    },
  },

  updateCheckboxContentControl: {
    name: 'updateCheckboxContentControl',
    description: 'Update the state of a checkbox content control.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Title of the checkbox to update', required: true },
        checked: { type: 'boolean', description: 'New state of the checkbox', required: true },
      },
      required: ['title', 'checked'],
    },
    execute: async args => {
      const { title, checked } = args
      return Word.run(async context => {
        const contentControls = context.document.contentControls.getByTitle(title)
        contentControls.load('items')
        await context.sync()
        if (contentControls.items.length === 0) return `No checkbox found with title: ${title}`
        const cc = contentControls.items[0]
        // @ts-ignore
        if (cc.checkbox) {
          // @ts-ignore
          cc.checkbox.checked = checked
        } else if (cc.tag === 'CHECKBOX_FALLBACK') {
          cc.load('text')
          await context.sync()
          const cleanText = cc.text.replace(/^\[[x ]\] /, '')
          cc.insertText(checked ? `[x] ${cleanText}` : `[ ] ${cleanText}`, 'Replace')
        }
        await context.sync()
        return `Successfully updated checkbox ${title} to ${checked ? 'checked' : 'unchecked'}.`
      })
    },
  },

  getTableInfo: {
    name: 'getTableInfo',
    description: 'Get information about tables in the document, including row and column counts.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    execute: async () => {
      return Word.run(async context => {
        const tables = context.document.body.tables
        tables.load(['items'])
        await context.sync()
        const tableInfos = []
        for (let i = 0; i < tables.items.length; i++) {
          const table = tables.items[i]
          table.load(['rowCount', 'values'])
          await context.sync()
          const columnCount = table.values && table.values[0] ? table.values[0].length : 0
          tableInfos.push({ index: i, rowCount: table.rowCount, columnCount })
        }
        return JSON.stringify({ tableCount: tables.items.length, tables: tableInfos }, null, 2)
      })
    },
  },

  manageField: {
    name: 'manageField',
    description: 'Insert, update, or delete document fields (e.g., DATE, TIME, FILENAME).',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['Insert', 'UpdateAll', 'DeleteSelected'], required: true },
        fieldType: { type: 'string', description: 'Field code (e.g., "DATE \\@ "yyyy-MM-dd"")' },
      },
      required: ['action'],
    },
    execute: async args => {
      const { action, fieldType } = args
      return Word.run(async context => {
        if (action === 'Insert' && fieldType) {
          const range = context.document.getSelection()
          // @ts-ignore
          range.insertField(fieldType, 'Normal', 'Replace')
          await context.sync()
          return `Successfully inserted field: ${fieldType}`
        } else if (action === 'UpdateAll') {
          // @ts-ignore
          if (context.document.body.updateFields) {
            // @ts-ignore
            context.document.body.updateFields()
          } else {
            context.document.body.select()
            await context.sync()
          }
          return 'Triggered document field update.'
        } else if (action === 'DeleteSelected') {
          const range = context.document.getSelection()
          range.delete()
          await context.sync()
          return 'Selected field/range deleted.'
        }
        return 'No action taken.'
      })
    },
  },

  mergeTableCells: {
    name: 'mergeTableCells',
    description: 'Merge selected cells in a table.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    execute: async () => {
      return Word.run(async context => {
        const range = context.document.getSelection()
        // @ts-ignore
        if (range.merge) {
          // @ts-ignore
          range.merge()
          await context.sync()
          return 'Successfully merged table cells.'
        } else {
          return 'Merge table cells is not supported in this Word version.'
        }
      })
    },
  },

  splitTableCells: {
    name: 'splitTableCells',
    description: 'Split a merged cell or specific range into multiple rows/columns.',
    inputSchema: {
      type: 'object',
      properties: {
        rows: { type: 'number', description: 'Number of rows to split into', required: true },
        columns: { type: 'number', description: 'Number of columns to split into', required: true },
      },
      required: ['rows', 'columns'],
    },
    execute: async args => {
      const { rows, columns } = args
      return Word.run(async context => {
        const range = context.document.getSelection()
        // @ts-ignore
        if (range.split) {
          // @ts-ignore
          range.split(rows, columns)
          await context.sync()
          return `Successfully split cells into ${rows} rows and ${columns} columns.`
        } else {
          return 'Split table cells is not supported in this Word version.'
        }
      })
    },
  },

  formatTable: {
    name: 'formatTable',
    description: 'Format the table at the current cursor position with advanced styling and layout options.',
    inputSchema: {
      type: 'object',
      properties: {
        style: { type: 'string', description: 'Table style name' },
        headerRow: { type: 'boolean', description: 'Show/hide header row' },
        firstColumn: { type: 'boolean', description: 'Highlight first column' },
        lastColumn: { type: 'boolean', description: 'Highlight last column' },
        bandedRows: { type: 'boolean', description: 'Alternate row shading' },
        bandedColumns: { type: 'boolean', description: 'Alternate column shading' },
        shadingColor: { type: 'string', description: 'Background shading color' },
        alignment: { type: 'string', description: 'Table alignment', enum: ['Left', 'Centered', 'Right'] },
      },
      required: [],
    },
    execute: async args => {
      const { style, headerRow, firstColumn, lastColumn, bandedRows, bandedColumns, shadingColor, alignment } = args
      return Word.run(async context => {
        const range = context.document.getSelection()
        const table = range.parentTableOrNullObject
        table.load(['isNullObject', 'style'])
        await context.sync()
        if (table.isNullObject) return 'No table found at cursor position.'
        if (style) table.style = style
        if (headerRow !== undefined) table.headerRow = headerRow
        if (firstColumn !== undefined) table.firstColumn = firstColumn
        if (lastColumn !== undefined) table.lastColumn = lastColumn
        if (bandedRows !== undefined) table.bandedRows = bandedRows
        if (bandedColumns !== undefined) table.bandedColumns = bandedColumns
        if (shadingColor !== undefined) table.shadingColor = shadingColor
        if (alignment !== undefined) table.alignment = alignment as Word.Alignment
        await context.sync()
        return 'Successfully formatted table.'
      })
    },
  },
}
