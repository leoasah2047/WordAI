/* global Word */

/**
 * Applies a specific Word style to the current selection.
 * @param styleName The name of the style to apply (e.g., 'Heading 1', 'Normal')
 */
export async function applyStyleToSelection(styleName: string) {
  try {
    await Word.run(async context => {
      const selection = context.document.getSelection()
      selection.style = styleName
      await context.sync()
    })
  } catch (error) {
    console.error(`Error applying style ${styleName}:`, error)
    throw error
  }
}

/**
 * Finds all instances of a search term and applies specific font formatting.
 * @param searchTarget The text to find
 * @param formatting The font formatting to apply
 */
export async function findAndReplaceFormatting(
  searchTarget: string,
  formatting: Partial<Word.Interfaces.FontUpdateData>,
) {
  try {
    await Word.run(async context => {
      const results = context.document.body.search(searchTarget)
      results.load('font')
      await context.sync()

      for (const item of results.items) {
        item.font.set(formatting)
      }
      await context.sync()
    })
  } catch (error) {
    console.error(`Error finding and formatting ${searchTarget}:`, error)
    throw error
  }
}

/**
 * Inserts a new paragraph at a specific location.
 * @param text The text for the new paragraph
 * @param location The location to insert relative to the selection or body
 */
export async function insertParagraph(text: string, location: 'Start' | 'End' = 'End') {
  try {
    await Word.run(async context => {
      const body = context.document.body
      body.insertParagraph(text, location)
      await context.sync()
    })
  } catch (error) {
    console.error('Error inserting paragraph:', error)
    throw error
  }
}

/**
 * Gets the current document content as plain text.
 */
export async function getDocumentBodyText(): Promise<string> {
  let text = ''
  try {
    await Word.run(async context => {
      const body = context.document.body
      body.load('text')
      await context.sync()
      text = body.text
    })
  } catch (error) {
    console.error('Error getting document body text:', error)
  }
  return text
}

/**
 * Gets the selected text.
 */
export async function getSelectedText(): Promise<string> {
  let text = ''
  try {
    await Word.run(async context => {
      const selection = context.document.getSelection()
      selection.load('text')
      await context.sync()
      text = selection.text
    })
  } catch (error) {
    console.error('Error getting selected text:', error)
  }
  return text
}
