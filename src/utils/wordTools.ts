import { tool } from '@langchain/core/tools'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'

import { createActionDescription, getAgentHistoryManager } from './agentHistory'
import { appTools } from './wordTools/app'
import { basicTools } from './wordTools/basic'
import { elementTools } from './wordTools/elements'
import { formattingTools } from './wordTools/formatting'
import { layoutTools } from './wordTools/layout'
import { WordToolDefinition, WordToolName } from './wordTools/types'

export * from './wordTools/types'

const wordToolDefinitions: Record<string, WordToolDefinition> = {
  ...basicTools,
  ...formattingTools,
  ...elementTools,
  ...layoutTools,
  ...appTools,
}

export interface CreateWordToolsOptions {
  enabledTools?: WordToolName[]
  onPreExecute?: (name: WordToolName, args: any) => Promise<boolean>
}

export function createWordTools(optionsOrTools?: WordToolName[] | CreateWordToolsOptions) {
  let enabledTools: WordToolName[] | undefined
  let onPreExecute: ((name: WordToolName, args: any) => Promise<boolean>) | undefined

  if (Array.isArray(optionsOrTools)) {
    enabledTools = optionsOrTools
  } else if (optionsOrTools) {
    enabledTools = optionsOrTools.enabledTools
    onPreExecute = optionsOrTools.onPreExecute
  }

  const tools = Object.entries(wordToolDefinitions)
    .filter(([name]) => !enabledTools || enabledTools.includes(name as WordToolName))
    .map(([, def]) => {
      const schemaObj: Record<string, z.ZodTypeAny> = {}

      for (const [propName, propValue] of Object.entries(def.inputSchema.properties)) {
        const prop = propValue as any
        let zodType: z.ZodTypeAny

        switch (prop.type) {
          case 'string':
            zodType = prop.enum ? z.enum(prop.enum as [string, ...string[]]) : z.string()
            break
          case 'number':
            zodType = z.number()
            break
          case 'boolean':
            zodType = z.boolean()
            break
          case 'array':
            zodType = z.array(z.any())
            break
          default:
            zodType = z.any()
        }

        if (prop.description) {
          zodType = zodType.describe(prop.description)
        }

        if (!def.inputSchema.required?.includes(propName)) {
          zodType = zodType.optional()
        }

        schemaObj[propName] = zodType
      }

      return tool(
        async input => {
          try {
            // Check for pre-execution hook (e.g., confirmation)
            if (onPreExecute) {
              const shouldProceed = await onPreExecute(def.name as WordToolName, input)
              if (!shouldProceed) {
                return 'Tool execution cancelled by user.'
              }
            }

            const result = await def.execute(input)

            // Record successful action for undo/redo
            try {
              const historyManager = getAgentHistoryManager()
              historyManager.recordAction({
                id: uuidv4(),
                type: def.name,
                description: createActionDescription(def.name, input),
                timestamp: Date.now(),
              })
            } catch (historyError) {
              console.warn('Failed to record action history:', historyError)
            }

            return result
          } catch (error: any) {
            return `Error: ${error.message || 'Unknown error occurred'}`
          }
        },
        {
          name: def.name,
          description: def.description,
          schema: z.object(schemaObj),
        },
      )
    })

  return tools
}

export function getWordToolDefinitions(): WordToolDefinition[] {
  return Object.values(wordToolDefinitions)
}

export function getWordTool(name: WordToolName): WordToolDefinition | undefined {
  return wordToolDefinitions[name as string]
}

export { wordToolDefinitions }
