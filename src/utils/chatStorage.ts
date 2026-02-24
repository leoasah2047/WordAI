import localforage from 'localforage'
import { v4 as uuidv4 } from 'uuid'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface ChatConversation {
  id: string
  title: string
  timestamp: number
  updatedAt: number
  messages: ChatMessage[]
  context: {
    tenderContext: string
    extractedText: string
    functionArea: string
    styleAuthor: string
    outputLanguage: string
    selectedFiles?: any[]
    extractedImages?: any[]
  }
}

const store = localforage.createInstance({
  name: 'WordAI',
  storeName: 'consultant_chats',
})

export const ChatStorageService = {
  async saveConversation(conversation: ChatConversation): Promise<void> {
    await store.setItem(conversation.id, conversation)
  },

  async getConversations(): Promise<ChatConversation[]> {
    const conversations: ChatConversation[] = []
    await store.iterate((value: ChatConversation) => {
      conversations.push(value)
    })
    return conversations.sort((a, b) => b.updatedAt - a.updatedAt)
  },

  async loadConversation(id: string): Promise<ChatConversation | null> {
    return await store.getItem<ChatConversation>(id)
  },

  async deleteConversation(id: string): Promise<void> {
    await store.removeItem(id)
  },

  createNewConversation(): ChatConversation {
    return {
      id: uuidv4(),
      title: 'New Conversation',
      timestamp: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      context: {
        tenderContext: '',
        extractedText: '',
        functionArea: 'Legal',
        styleAuthor: 'GAK',
        outputLanguage: 'English',
      },
    }
  },
}

const homeStore = localforage.createInstance({
  name: 'WordAI',
  storeName: 'home_chats',
})

export const HomeChatStorageService = {
  async saveConversation(conversation: ChatConversation): Promise<void> {
    await homeStore.setItem(conversation.id, conversation)
  },

  async getConversations(): Promise<ChatConversation[]> {
    const conversations: ChatConversation[] = []
    await homeStore.iterate((value: ChatConversation) => {
      conversations.push(value)
    })
    return conversations.sort((a, b) => b.updatedAt - a.updatedAt)
  },

  async loadConversation(id: string): Promise<ChatConversation | null> {
    return await homeStore.getItem<ChatConversation>(id)
  },

  async deleteConversation(id: string): Promise<void> {
    await homeStore.removeItem(id)
  },

  createNewConversation(): ChatConversation {
    return {
      id: uuidv4(),
      title: 'New Chat',
      timestamp: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      context: {
        tenderContext: '',
        extractedText: '',
        functionArea: 'General',
        styleAuthor: 'Default',
        outputLanguage: 'English',
      },
    }
  },
}
