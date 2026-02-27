import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { ChatGroq } from '@langchain/groq'
import { MemorySaver } from '@langchain/langgraph'
import { ChatOllama } from '@langchain/ollama'
import { AzureChatOpenAI, ChatOpenAI } from '@langchain/openai'
import { createAgent } from 'langchain'

import {
  AgentOptions,
  AzureOptions,
  GeminiOptions,
  GroqOptions,
  OllamaOptions,
  OpenAIOptions,
  ProviderOptions,
} from './types'

const ModelCreators: Record<string, (opts: any) => BaseChatModel> = {
  official: (opts: OpenAIOptions) => {
    const modelName = opts.model || 'gpt-4o'
    return new ChatOpenAI({
      modelName,
      configuration: {
        apiKey: opts.config.apiKey,
        baseURL: opts.config.baseURL || 'https://api.openai.com/v1',
      },
      temperature: opts.temperature ?? 0.7,
      maxTokens: opts.maxTokens ?? 800,
    })
  },

  ollama: (opts: OllamaOptions) => {
    return new ChatOllama({
      model: opts.ollamaModel,
      baseUrl: opts.ollamaEndpoint?.replace(/\/$/, '') || 'http://localhost:11434',
      temperature: opts.temperature,
    })
  },

  groq: (opts: GroqOptions) => {
    return new ChatGroq({
      model: opts.groqModel,
      apiKey: opts.groqAPIKey,
      temperature: opts.temperature ?? 0.5,
      maxTokens: opts.maxTokens ?? 1024,
    })
  },

  gemini: (opts: GeminiOptions) => {
    return new ChatGoogleGenerativeAI({
      model: opts.geminiModel ?? 'gemini-1.5-pro',
      apiKey: opts.geminiAPIKey,
      temperature: opts.temperature ?? 0.7,
      maxOutputTokens: opts.maxTokens ?? 800,
    })
  },

  azure: (opts: AzureOptions) => {
    return new AzureChatOpenAI({
      model: opts.azureDeploymentName,
      temperature: opts.temperature ?? 0.7,
      maxTokens: opts.maxTokens ?? 800,
      azureOpenAIApiKey: opts.azureAPIKey,
      azureOpenAIEndpoint: opts.azureAPIEndpoint,
      azureOpenAIApiDeploymentName: opts.azureDeploymentName,
      azureOpenAIApiVersion: opts.azureAPIVersion ?? '2024-10-01',
    })
  },
}

const checkpointer = new MemorySaver()

async function executeChatFlow(model: BaseChatModel, options: ProviderOptions): Promise<void> {
  try {
    const agent = createAgent({
      model,
      tools: [],
      checkpointer,
    })

    const messages = [...(options.messages as any)]
    if (options.nexusProfile && Object.keys(options.nexusProfile).length > 0) {
      const p = options.nexusProfile
      const instruction = `[PERSONA CONTEXT] You are assisting a ${p.domain || 'standard'} expert who prefers ${p.cognitive_style || 'professional'} style and writes with a ${p.tone || 'neutral'} tone. Focus on ${p.proficiency || 'clarity'} and mitigate any linguistic weaknesses.`
      // @ts-ignore
      messages.unshift({ role: 'system', content: instruction })
    }

    const stream = await agent.stream(
      {
        messages,
      },
      {
        signal: options.abortSignal,
        configurable: { thread_id: options.threadId },
        streamMode: 'messages',
      },
    )

    let fullContent = ''
    for await (const [chunk] of stream) {
      if (options.abortSignal?.aborted) {
        break
      }

      const content = typeof chunk.content === 'string' ? chunk.content : ''
      fullContent += content
      options.onStream(fullContent)
    }
  } catch (error: any) {
    if (error.name === 'AbortError' || options.abortSignal?.aborted) {
      throw error
    }

    console.error('Chat Error:', error)

    // Handle common API errors
    const errorMessage = error.message || String(error)
    if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
      options.errorIssue.value = 'invalidAPIKey'
    } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
      options.errorIssue.value = 'rateLimitExceeded'
    } else if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
      options.errorIssue.value = 'networkError'
    } else {
      options.errorIssue.value = true
    }
  } finally {
    options.loading.value = false
  }
}

async function executeAgentFlow(model: BaseChatModel, options: AgentOptions): Promise<void> {
  try {
    const messages = [...(options.messages as any)]
    if (options.nexusProfile && Object.keys(options.nexusProfile).length > 0) {
      const p = options.nexusProfile
      const instruction = `[PERSONA CONTEXT] You are assisting a ${p.domain || 'standard'} expert who prefers ${p.cognitive_style || 'professional'} style and writes with a ${p.tone || 'neutral'} tone. Focus on ${p.proficiency || 'clarity'} and mitigate any linguistic weaknesses.`
      // @ts-ignore
      messages.unshift({ role: 'system', content: instruction })
    }

    if (options.actionSchema) {
      const maxRetries = 2
      const maxIterations = options.recursionLimit || 10
      let iterations = 0
      const currentMessages = [...messages]

      while (iterations < maxIterations) {
        iterations++
        let success = false
        let innerRetryCount = 0

        while (innerRetryCount <= maxRetries && !success) {
          try {
            const boundModel = model.withStructuredOutput(options.actionSchema)
            const result = (await boundModel.invoke(currentMessages, { signal: options.abortSignal })) as any

            // Inform UI of this intermediate (or final) action
            options.onStream(JSON.stringify(result))

            if (result.type === 'execute_tool') {
              const tool = options.tools?.find((t: any) => t.name === result.tool_name)
              if (tool) {
                options.onToolCall?.(result.tool_name, result.arguments)
                const toolResult = await tool.invoke(result.arguments)
                const toolResultStr = typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult)
                options.onToolResult?.(result.tool_name, toolResultStr)

                // Add to history and continue loop
                currentMessages.push({ role: 'assistant', content: JSON.stringify(result) } as any)
                currentMessages.push({
                  role: 'user',
                  content: `Tool [${result.tool_name}] returned: ${toolResultStr}\n\nPlease analyze this result and take the next step.`,
                } as any)
                success = true
                break // exit inner retry, continue outer loop
              } else {
                throw new Error(`Tool "${result.tool_name}" not found or disabled.`)
              }
            } else {
              // Final action (insert_text, no_action, etc.)
              return
            }
          } catch (err: any) {
            innerRetryCount++
            if (innerRetryCount > maxRetries) {
              console.error('[Agent] Structured output failed after retries:', err)
              throw err
            }
            console.warn(
              `[Agent] Validation failed, retrying (${innerRetryCount}/${maxRetries})... Error: ${err.message}`,
            )
            currentMessages.push({
              role: 'user',
              content: `Your previous response did not match the required schema or caused an error. Please fix it and try again. Error: ${err.message}`,
            } as any)
          }
        }

        if (!success) break
      }
      return
    }

    const agent = createAgent({
      model,
      tools: options.tools || [],
      checkpointer,
    })

    const stream = await agent.stream(
      {
        messages,
      },
      {
        recursionLimit: options.recursionLimit, //最大迭代次数
        signal: options.abortSignal,
        configurable: { thread_id: options.threadId },
        streamMode: 'values',
      },
    )

    let fullContent = ''
    let stepCount = 0

    for await (const step of stream) {
      if (options.abortSignal?.aborted) {
        break
      }

      stepCount++
      console.log(`[Agent] Step ${stepCount}:`, {
        messageCount: step.messages?.length || 0,
        lastMessageType: step.messages?.[step.messages.length - 1]?.constructor?.name,
      })

      const messages = step.messages || []
      const lastMessage = messages[messages.length - 1]

      if (!lastMessage) continue

      // Cast to any for accessing tool-related properties
      const msg = lastMessage as any

      console.log(`[Agent] Message type: ${msg._getType?.() || 'unknown'}`)

      // Handle AI messages with tool calls
      if (msg._getType?.() === 'ai' && msg.tool_calls?.length > 0) {
        console.log('[Agent] Tool calls detected:', msg.tool_calls.length)
        for (const toolCall of msg.tool_calls) {
          console.log('[Agent] Tool call:', {
            name: toolCall.name,
            args: toolCall.args,
          })
          if (options.onToolCall) {
            options.onToolCall(toolCall.name, toolCall.args)
          }
        }
      }

      // Handle tool result messages
      if (msg._getType?.() === 'tool') {
        const toolName = msg.name || 'unknown'
        const toolContent = String(msg.content || '')
        console.log('[Agent] Tool result:', {
          name: toolName,
          contentLength: toolContent.length,
          contentPreview: toolContent.substring(0, 100),
        })
        if (options.onToolResult) {
          options.onToolResult(toolName, toolContent)
        }
      }

      // Handle AI message content (the final response)
      if (msg._getType?.() === 'ai' && msg.content) {
        const content = typeof msg.content === 'string' ? msg.content : ''
        if (content && (!msg.tool_calls || msg.tool_calls.length === 0)) {
          fullContent = content
          console.log('[Agent] AI response:', {
            content,
          })
          options.onStream(fullContent)
        }
      }
    }

    console.log('[Agent] Flow completed. Total steps:', stepCount)
  } catch (error: any) {
    console.error('[Agent] Error:', error)
    if (error.name === 'AbortError' || options.abortSignal?.aborted) {
      throw error
    }

    if (error.name === 'GraphRecursionError') {
      options.errorIssue.value = 'recursionLimitExceeded'
      return
    }

    // Handle common API errors
    const errorMessage = error.message || String(error)
    if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
      options.errorIssue.value = 'invalidAPIKey'
    } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
      options.errorIssue.value = 'rateLimitExceeded'
    } else if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
      options.errorIssue.value = 'networkError'
    } else {
      options.errorIssue.value = true
    }
  } finally {
    options.loading.value = false
  }
}

export async function getChatResponse(options: ProviderOptions) {
  const creator = ModelCreators[options.provider]
  if (!creator) {
    throw new Error(`Unsupported provider: ${options.provider}`)
  }
  const model = creator(options)
  return executeChatFlow(model, options)
}

export async function getAgentResponse(options: AgentOptions) {
  const creator = ModelCreators[options.provider]
  if (!creator) {
    throw new Error(`Unsupported provider: ${options.provider}`)
  }
  const model = creator(options)
  return executeAgentFlow(model, options)
}
