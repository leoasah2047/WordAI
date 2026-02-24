/**
 * Agent History Manager
 * Tracks agent actions and provides undo/redo functionality for Agent Mode
 */

export interface AgentAction {
  id: string
  type: string // Tool name that was executed
  description: string // Human-readable description
  timestamp: number
  // Store document state snapshot for undo
  snapshot?: {
    selectedText: string
    selectionRange?: {
      start: number
      end: number
    }
  }
}

const MAX_HISTORY_SIZE = 10 // Limit to prevent memory issues

export class AgentHistoryManager {
  private actions: AgentAction[] = []
  private currentIndex: number = -1 // Points to the current state

  /**
   * Record a new action after it's executed
   */
  recordAction(action: AgentAction): void {
    // Remove any actions after current index (they become invalid after new action)
    if (this.currentIndex < this.actions.length - 1) {
      this.actions = this.actions.slice(0, this.currentIndex + 1)
    }

    // Add new action
    this.actions.push(action)
    this.currentIndex = this.actions.length - 1

    // Enforce max history size
    if (this.actions.length > MAX_HISTORY_SIZE) {
      this.actions.shift() // Remove oldest action
      this.currentIndex--
    }

    console.log(`[AgentHistory] Recorded action: ${action.description}`, {
      totalActions: this.actions.length,
      currentIndex: this.currentIndex,
    })
  }

  /**
   * Undo the last action using Word's native undo
   */
  async undo(): Promise<boolean> {
    if (!this.canUndo()) {
      console.warn('[AgentHistory] Cannot undo - no actions to undo')
      return false
    }

    try {
      await Word.run(async context => {
        // Use Word's native undo command
        context.application.undo()
        await context.sync()
      })

      this.currentIndex--
      console.log(`[AgentHistory] Undo successful, currentIndex: ${this.currentIndex}`)
      return true
    } catch (error) {
      console.error('[AgentHistory] Undo failed:', error)
      return false
    }
  }

  /**
   * Redo the last undone action using Word's native redo
   */
  async redo(): Promise<boolean> {
    if (!this.canRedo()) {
      console.warn('[AgentHistory] Cannot redo - no actions to redo')
      return false
    }

    try {
      await Word.run(async context => {
        // Use Word's native redo command
        context.application.redo()
        await context.sync()
      })

      this.currentIndex++
      console.log(`[AgentHistory] Redo successful, currentIndex: ${this.currentIndex}`)
      return true
    } catch (error) {
      console.error('[AgentHistory] Redo failed:', error)
      return false
    }
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.currentIndex >= 0
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.currentIndex < this.actions.length - 1
  }

  /**
   * Get the full action history
   */
  getHistory(): AgentAction[] {
    return [...this.actions]
  }

  /**
   * Get the current action (what will be undone next)
   */
  getCurrentAction(): AgentAction | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.actions.length) {
      return this.actions[this.currentIndex]
    }
    return null
  }

  /**
   * Get the next action (what will be redone next)
   */
  getNextAction(): AgentAction | null {
    const nextIndex = this.currentIndex + 1
    if (nextIndex < this.actions.length) {
      return this.actions[nextIndex]
    }
    return null
  }

  /**
   * Clear all history (e.g., when starting new chat or changing modes)
   */
  clear(): void {
    this.actions = []
    this.currentIndex = -1
    console.log('[AgentHistory] History cleared')
  }

  /**
   * Get a summary of current state for debugging
   */
  getState(): {
    totalActions: number
    currentIndex: number
    canUndo: boolean
    canRedo: boolean
  } {
    return {
      totalActions: this.actions.length,
      currentIndex: this.currentIndex,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
    }
  }
}

// Singleton instance
let historyManager: AgentHistoryManager | null = null

/**
 * Get the global agent history manager instance
 */
export function getAgentHistoryManager(): AgentHistoryManager {
  if (!historyManager) {
    historyManager = new AgentHistoryManager()
  }
  return historyManager
}

/**
 * Create a human-readable description for a tool action
 */
export function createActionDescription(toolName: string, args: any): string {
  switch (toolName) {
    case 'insertText':
      return `Insert text: "${truncate(args.text, 50)}"`
    case 'replaceSelectedText':
      return `Replace text with: "${truncate(args.newText, 50)}"`
    case 'deleteText':
      return 'Delete selected text'
    case 'formatText':
      return `Format text: ${Object.keys(args)
        .filter(k => args[k])
        .join(', ')}`
    case 'insertParagraph':
      return `Insert paragraph: "${truncate(args.text, 50)}"`
    case 'insertTable':
      return `Insert ${args.rows}x${args.cols} table`
    case 'insertList':
      return `Insert ${args.type} list`
    case 'searchAndReplace':
      return `Replace "${args.searchText}" with "${args.replaceText}"`
    case 'clearFormatting':
      return 'Clear formatting'
    case 'setFontName':
      return `Set font to ${args.fontName}`
    case 'insertImage':
      return 'Insert image'
    case 'insertPageBreak':
      return 'Insert page break'
    case 'bulkFindReplace':
      return `Bulk find & replace (${args.replacements.length} items)`
    case 'applyStyle':
      return `Apply style: "${args.styleName}"`
    case 'createSection':
      return `Create ${args.type || 'NextPage'} section`
    case 'formatTable':
      return `Format table`
    case 'getDocumentStructure':
      return `Get document structure`
    default:
      return `Execute: ${toolName}`
  }
}

/**
 * Truncate text for display
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
