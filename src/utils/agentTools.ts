import { GeneralToolName } from './generalTools'
import { WordToolName } from './wordTools'

const allWordToolNames: WordToolName[] = [
  'getSelectedText',
  'getDocumentContent',
  'insertText',
  'replaceSelectedText',
  'appendText',
  'insertParagraph',
  'formatText',
  'searchAndReplace',
  'getDocumentProperties',
  'insertTable',
  'insertList',
  'deleteText',
  'clearFormatting',
  'setFontName',
  'insertPageBreak',
  'getRangeInfo',
  'selectText',
  'insertImage',
  'getTableInfo',
  'insertBookmark',
  'goToBookmark',
  'insertContentControl',
  'findText',
  'bulkFindReplace',
  'applyStyle',
  'createSection',
  'formatTable',
  'getDocumentStructure',
]

const allGeneralToolNames: GeneralToolName[] = ['fetchWebContent', 'searchWeb', 'getCurrentDate', 'calculateMath']

export function loadEnabledWordTools(): WordToolName[] {
  const stored = localStorage.getItem('enabledWordTools')
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      return parsed.filter((name: string) => allWordToolNames.includes(name as WordToolName))
    } catch {
      return [...allWordToolNames]
    }
  }
  return [...allWordToolNames]
}

export function loadEnabledGeneralTools(): GeneralToolName[] {
  const stored = localStorage.getItem('enabledGeneralTools')
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      return parsed.filter((name: string) => allGeneralToolNames.includes(name as GeneralToolName))
    } catch {
      return [...allGeneralToolNames]
    }
  }
  return [...allGeneralToolNames]
}

export interface GetToolsOptions {
  enabledWordTools?: WordToolName[]
  enabledGeneralTools?: GeneralToolName[]
  onPreExecute?: (name: WordToolName, args: any) => Promise<boolean>
  isDesignerMode?: boolean
}

export async function getActiveAgentTools(options: GetToolsOptions = {}) {
  const { createWordTools } = await import('./wordTools')
  const { createGeneralTools } = await import('./generalTools')

  const wordTools = createWordTools({
    enabledTools: options.enabledWordTools || loadEnabledWordTools(),
    onPreExecute: options.onPreExecute,
  })
  const generalTools = createGeneralTools(options.enabledGeneralTools || loadEnabledGeneralTools())

  if (options.isDesignerMode) {
    const { createDesignerTools } = await import('./designerTools')
    const designerTools = createDesignerTools()
    return [...generalTools, ...wordTools, ...designerTools]
  }

  return [...generalTools, ...wordTools]
}
