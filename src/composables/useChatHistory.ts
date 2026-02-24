import { AIMessage, HumanMessage, Message } from '@langchain/core/messages'
import { v4 as uuidv4 } from 'uuid'
import { ref } from 'vue'

import { ChatConversation, ChatMessage, HomeChatStorageService } from '@/utils/chatStorage'

// Helper functions (extracted from HomePage.vue)
const flattenContentArray = (content: any[]): string =>
  content
    .map((part: any) => {
      if (typeof part === 'string') return part
      if (part?.text && typeof part.text === 'string') return part.text
      if (part?.data && typeof part.data === 'string') return part.data
      return ''
    })
    .join('')

export const getMessageText = (msg: Message): string => {
  const content: any = (msg as any).content
  if (typeof content === 'string') return content
  if (Array.isArray(content)) return flattenContentArray(content)
  return ''
}

export function useChatHistory() {
  const history = ref<Message[]>([])
  const chatHistory = ref<ChatConversation[]>([])
  const threadId = ref<string>(uuidv4())
  const currentChatId = ref<string>(threadId.value)
  const showHistory = ref(false)

  const loadHistory = async () => {
    chatHistory.value = await HomeChatStorageService.getConversations()
  }

  const startNewChat = () => {
    history.value = []
    const newChat = HomeChatStorageService.createNewConversation()
    currentChatId.value = newChat.id
    threadId.value = newChat.id
  }

  const loadChat = async (chat: ChatConversation) => {
    currentChatId.value = chat.id
    threadId.value = chat.id
    // Map ChatMessage[] back to Message[] (LangChain)
    history.value = chat.messages.map(m => {
      if (m.role === 'user') return new HumanMessage(m.content)
      return new AIMessage(m.content)
    })
  }

  const deleteChat = async (id: string) => {
    const index = chatHistory.value.findIndex(c => c.id === id)
    if (index > -1) {
      chatHistory.value.splice(index, 1)
      await HomeChatStorageService.deleteConversation(id)
      if (currentChatId.value === id) {
        startNewChat()
      }
    }
  }

  const saveCurrentChat = async () => {
    if (history.value.length === 0) return

    // Map Message[] (LangChain) to ChatMessage[]
    const serializedMessages: ChatMessage[] = history.value.map(m => ({
      role: m instanceof HumanMessage ? 'user' : 'assistant',
      content: getMessageText(m),
      timestamp: Date.now(), // Approximation
    }))

    const chat: ChatConversation = {
      id: threadId.value,
      title: history.value[0].content.toString().slice(0, 30) || 'New Chat',
      timestamp: Date.now(),
      updatedAt: Date.now(),
      messages: serializedMessages,
      context: {
        tenderContext: '',
        extractedText: '',
        functionArea: 'General',
        styleAuthor: 'Default',
        outputLanguage: 'English',
      },
    }

    // Update local list
    const existingIndex = chatHistory.value.findIndex(c => c.id === chat.id)
    if (existingIndex > -1) {
      chatHistory.value[existingIndex] = chat
    } else {
      chatHistory.value.unshift(chat)
    }

    await HomeChatStorageService.saveConversation(chat)
  }

  return {
    history,
    chatHistory,
    currentChatId,
    threadId,
    showHistory,
    loadHistory,
    startNewChat,
    loadChat,
    deleteChat,
    saveCurrentChat,
  }
}
