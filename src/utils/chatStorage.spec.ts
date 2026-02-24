import { describe, expect, it, vi } from 'vitest'

const { mockStoreInstance } = vi.hoisted(() => ({
  mockStoreInstance: {
    setItem: vi.fn(),
    getItem: vi.fn(),
    removeItem: vi.fn(),
    iterate: vi.fn().mockImplementation(callback => {
      callback({ id: '1', updatedAt: 100 }, '1', 0)
      callback({ id: '2', updatedAt: 200 }, '2', 1)
      return Promise.resolve()
    }),
  },
}))

vi.mock('localforage', () => ({
  default: {
    createInstance: vi.fn().mockReturnValue(mockStoreInstance),
  },
}))

import { ChatStorageService, HomeChatStorageService } from './chatStorage'

describe('ChatStorageService', () => {
  it('should save a conversation', async () => {
    const conv = ChatStorageService.createNewConversation()
    await ChatStorageService.saveConversation(conv)
    expect(mockStoreInstance.setItem).toHaveBeenCalledWith(conv.id, conv)
  })

  it('should get conversations sorted by updatedAt descending', async () => {
    const conversations = await ChatStorageService.getConversations()
    expect(conversations.length).toBe(2)
    expect(conversations[0].id).toBe('2') // updatedAt: 200
    expect(conversations[1].id).toBe('1') // updatedAt: 100
  })

  it('should delete a conversation', async () => {
    await ChatStorageService.deleteConversation('test-id')
    expect(mockStoreInstance.removeItem).toHaveBeenCalledWith('test-id')
  })

  it('should create a new conversation with default context', () => {
    const conv = ChatStorageService.createNewConversation()
    expect(conv.id).toBeDefined()
    expect(conv.context.functionArea).toBe('Legal')
  })
})

describe('HomeChatStorageService', () => {
  it('should create a new conversation with general context', () => {
    const conv = HomeChatStorageService.createNewConversation()
    expect(conv.context.functionArea).toBe('General')
  })
})
