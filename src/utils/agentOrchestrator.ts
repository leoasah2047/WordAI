import { Role, type TaskSendParams } from 'a2a-js'
import { v4 as uuidv4 } from 'uuid'

import { useAgentActivity } from '@/composables/useAgentActivity'
import useSettingForm from '@/utils/settingForm'

import { executeAgentTool, reportToolResult } from './toolExecutor'
import { A2AWebSocketClient } from './websocketClient'

const { addActivity, updateActivity } = useAgentActivity()

/**
 * Agent Orchestrator using A2A Protocol with Streaming & Tools
 * Connects to the Consultant Backend via JSON-RPC + WebSocket
 */
export const orchestrator = {
  execute: async (prompt: string, _args: any[] = [], context: Record<string, any> = {}) => {
    const settings = useSettingForm()
    const baseUrl = settings.value.consultantBackendUrl || 'https://wordai-production-fa22.up.railway.app'
    const apiKey = settings.value.geminiAPIKey || ''

    // Create task parameters
    const taskId = uuidv4()
    const params: TaskSendParams = {
      id: taskId,
      message: {
        role: Role.User,
        content: prompt,
      },
      metadata: {
        ...context,
        source: 'word-ai-addin',
        functionArea: context.function_area || 'General',
        styleAuthor: context.style_author || 'Professional',
        language: context.language || 'English',
      },
    }

    // Log activity start
    addActivity({
      id: taskId,
      type: 'agent',
      description: `Task: ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}`,
      status: 'pending',
      timestamp: Date.now(),
    })

    // Phase 1: Initialize WebSocket for real-time streaming
    const wsClient = new A2AWebSocketClient(baseUrl, taskId)

    // Clear previous results and prepare for streaming
    let streamedContent = ''

    wsClient
      .onChunk(chunk => {
        streamedContent += chunk
        updateActivity(taskId, {
          result: streamedContent,
          status: 'pending',
        })
      })
      .onStatus(status => {
        updateActivity(taskId, {
          status: mapState(status.state),
          result: status.message || streamedContent,
          duration: Date.now(),
        })
      })
      .onArtifact(async artifact => {
        console.log('Received artifact via stream:', artifact)

        // Phase 5: Handle tool execution artifacts
        if (artifact.type === 'tool_call') {
          updateActivity(taskId, {
            status: 'pending',
            result: `Executing tool: ${artifact.content.tool_name}...`,
          })

          const result = await executeAgentTool(artifact.content)
          await reportToolResult(baseUrl, taskId, result, apiKey)

          updateActivity(taskId, {
            status: 'pending',
            result: result.success ? `Tool executed: ${artifact.content.tool_name}` : `Tool failed: ${result.error}`,
          })
        }
      })
      .connect()

    try {
      // Send task to A2A backend via JSON-RPC
      const response = await fetch(`${baseUrl}/a2a/rpc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Google-Api-Key': apiKey,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tasks/send',
          params,
          id: taskId,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.error) {
        throw new Error(result.error.message || 'Unknown RPC error')
      }

      // Log success of submission
      updateActivity(taskId, {
        status: 'pending',
        result: 'Task accepted, processing...',
        duration: Date.now(),
      })

      // Instead of polling, we rely on the WebSocket
      // But we still return a promise that resolves when the task is done
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(async () => {
          try {
            const statusResponse = await fetch(`${baseUrl}/a2a/rpc`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'tasks/get',
                params: { id: taskId },
                id: `check-${taskId}`,
              }),
            })

            const statusData = await statusResponse.json()
            if (statusData.result) {
              const state = statusData.result.status.state
              if (state === 'completed') {
                clearInterval(checkInterval)
                wsClient.disconnect()
                resolve(statusData.result)
              } else if (state === 'failed' || state === 'cancelled') {
                clearInterval(checkInterval)
                wsClient.disconnect()
                reject(new Error(statusData.result.status.message || 'Task failed'))
              }
            }
          } catch (error) {
            console.warn('Poll error during stream fallback:', error)
          }
        }, 5000) // Fallback poll every 5s if WebSocket misses something
      })
    } catch (error: any) {
      console.error('Agent execution failed:', error)
      updateActivity(taskId, {
        status: 'error',
        error: error.message || 'Unknown error',
        duration: Date.now(),
      })
      wsClient.disconnect()
      throw error
    }
  },
}

function mapState(state?: string): 'pending' | 'success' | 'error' {
  switch (state) {
    case 'completed':
      return 'success'
    case 'failed':
    case 'cancelled':
      return 'error'
    default:
      return 'pending'
  }
}
