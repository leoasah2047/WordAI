/**
 * Phase 1: WebSocket Client for Real-Time Streaming
 *
 * Connects to backend WebSocket endpoint for live task updates
 */

import { useAgentActivity } from '@/composables/useAgentActivity'

export interface StreamMessage {
  type: 'status' | 'chunk' | 'artifact' | 'ping'
  state?: string
  message?: string
  progress?: number
  content?: string
  artifact?: any
  timestamp?: number
}

export class A2AWebSocketClient {
  private ws: WebSocket | null = null
  private taskId: string
  private baseUrl: string
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 2000

  private onChunkCallback?: (chunk: string) => void
  private onStatusCallback?: (status: StreamMessage) => void
  private onArtifactCallback?: (artifact: any) => void
  private onErrorCallback?: (error: string) => void

  constructor(baseUrl: string, taskId: string) {
    this.baseUrl = baseUrl
    this.taskId = taskId
  }

  connect() {
    const wsUrl = this.baseUrl.replace(/^http/, 'ws')
    const url = `${wsUrl}/a2a/tasks/${this.taskId}/stream`

    console.log(`Connecting to WebSocket: ${url}`)

    try {
      this.ws = new WebSocket(url)

      this.ws.onopen = () => {
        console.log(`WebSocket connected for task ${this.taskId}`)
        this.reconnectAttempts = 0
      }

      this.ws.onmessage = event => {
        try {
          const data: StreamMessage = JSON.parse(event.data)
          this.handleMessage(data)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      this.ws.onerror = error => {
        console.error('WebSocket error:', error)
        if (this.onErrorCallback) {
          this.onErrorCallback('WebSocket connection error')
        }
      }

      this.ws.onclose = () => {
        console.log('WebSocket closed')
        this.attemptReconnect()
      }
    } catch (error) {
      console.error('Failed to create WebSocket:', error)
      if (this.onErrorCallback) {
        this.onErrorCallback('Failed to establish WebSocket connection')
      }
    }
  }

  private handleMessage(data: StreamMessage) {
    const { updateActivity } = useAgentActivity()

    switch (data.type) {
      case 'chunk':
        // LLM response chunk
        if (data.content && this.onChunkCallback) {
          this.onChunkCallback(data.content)
        }
        break

      case 'status':
        // Task status update
        if (this.onStatusCallback) {
          this.onStatusCallback(data)
        }

        updateActivity(this.taskId, {
          status: this.mapState(data.state),
          result: data.message,
          duration: Date.now(),
        })
        break

      case 'artifact':
        // New artifact added
        if (data.artifact && this.onArtifactCallback) {
          this.onArtifactCallback(data.artifact)
        }
        break

      case 'ping':
        // Keep-alive ping, no action needed
        break

      default:
        console.warn('Unknown message type:', data.type)
    }
  }

  private mapState(state?: string): 'pending' | 'success' | 'error' {
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

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached')
      if (this.onErrorCallback) {
        this.onErrorCallback('Connection lost')
      }
      return
    }

    this.reconnectAttempts++
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)

    setTimeout(() => {
      this.connect()
    }, this.reconnectDelay * this.reconnectAttempts)
  }

  onChunk(callback: (chunk: string) => void) {
    this.onChunkCallback = callback
    return this
  }

  onStatus(callback: (status: StreamMessage) => void) {
    this.onStatusCallback = callback
    return this
  }

  onArtifact(callback: (artifact: any) => void) {
    this.onArtifactCallback = callback
    return this
  }

  onError(callback: (error: string) => void) {
    this.onErrorCallback = callback
    return this
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }
}
