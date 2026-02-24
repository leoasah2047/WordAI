/**
 * Phase 5: Tool Execution Bridge
 *
 * Maps backend tool calls to active Word API tools on the frontend.
 */

import { createWordTools } from './wordTools'

export interface ToolCall {
  id: string
  tool_name: string
  arguments: Record<string, any>
  requires_confirmation?: boolean
}

export interface ToolResult {
  tool_call_id: string
  success: boolean
  result?: any
  error?: string
}

/**
 * Executes a tool call from the agent
 */
export async function executeAgentTool(toolCall: ToolCall): Promise<ToolResult> {
  console.log(`Executing tool: ${toolCall.tool_name}`, toolCall.arguments)

  try {
    // Initialize word tools (this is a factory, so we call it)
    const wordTools = createWordTools()

    // Find the tool in the list of tools
    const tool = wordTools.find(t => t.name === toolCall.tool_name)

    if (!tool) {
      throw new Error(`Tool "${toolCall.tool_name}" not found in frontend registry`)
    }

    // Execute the tool
    // Note: createWordTools returns LangChain tools which have a .func or .invoke or similar
    // Based on wordTools.ts, these are LangChain tools
    const result = await (tool as any).func(toolCall.arguments)

    return {
      tool_call_id: toolCall.id,
      success: true,
      result,
    }
  } catch (error: any) {
    console.error(`Tool execution failed (${toolCall.tool_name}):`, error)
    return {
      tool_call_id: toolCall.id,
      success: false,
      error: error.message || 'Unknown tool execution error',
    }
  }
}

/**
 * Reports tool execution result back to the backend
 */
export async function reportToolResult(baseUrl: string, taskId: string, result: ToolResult, apiKey?: string) {
  try {
    const response = await fetch(`${baseUrl}/a2a/rpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Google-Api-Key': apiKey || '',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tasks/send', // Sending as a follow-up message to the task
        params: {
          id: taskId,
          message: {
            role: 'system',
            content: `Tool Result: ${JSON.stringify(result)}`,
          },
        },
        id: `tool-resp-${result.tool_call_id}`,
      }),
    })

    if (!response.ok) {
      console.warn('Failed to report tool result to backend')
    }
  } catch (error) {
    console.error('Error reporting tool result:', error)
  }
}
