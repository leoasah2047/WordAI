/**
 * @vitest-environment happy-dom
 */
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import HomePage from './HomePage.vue'

// Mock i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
  createI18n: () => ({
    global: {
      locale: { value: 'en' },
      t: (key: string) => key,
    },
  }),
}))

// Mock Word global
vi.stubGlobal('Word', {
  run: vi.fn().mockImplementation(async callback => {
    return callback({
      document: {
        getSelection: () => ({
          load: () => {},
          text: '',
        }),
      },
      sync: () => {},
    })
  }),
})

// Mock Lucide icons
vi.mock('lucide-vue-next', () => ({
  X: { name: 'X', template: '<span></span>' },
  Trash2: { name: 'Trash2', template: '<span></span>' },
  MessageSquare: { name: 'MessageSquare', template: '<span></span>' },
  Undo: { name: 'Undo', template: '<span></span>' },
  Redo: { name: 'Redo', template: '<span></span>' },
  History: { name: 'History', template: '<span></span>' },
  Download: { name: 'Download', template: '<span></span>' },
  Plus: { name: 'Plus', template: '<span></span>' },
  Activity: { name: 'Activity', template: '<span></span>' },
  Zap: { name: 'Zap', template: '<span></span>' },
  Globe: { name: 'Globe', template: '<span></span>' },
  FileText: { name: 'FileText', template: '<span></span>' },
  Copy: { name: 'Copy', template: '<span></span>' },
  BookOpen: { name: 'BookOpen', template: '<span></span>' },
  CheckCircle: { name: 'CheckCircle', template: '<span></span>' },
  FileCheck: { name: 'FileCheck', template: '<span></span>' },
  Sparkle: { name: 'Sparkle', template: '<span></span>' },
  Sparkles: { name: 'Sparkles', template: '<span></span>' },
}))

// Mock components
vi.mock('@/components/ChatInput.vue', () => ({ default: { name: 'ChatInput', template: '<div></div>' } }))
vi.mock('@/components/ModeSelector.vue', () => ({ default: { name: 'ModeSelector', template: '<div></div>' } }))
vi.mock('@/components/AgentActivityFeed.vue', () => ({
  default: { name: 'AgentActivityFeed', template: '<div></div>' },
}))
vi.mock('@/components/SelectionFloatingMenu.vue', () => ({
  default: { name: 'SelectionFloatingMenu', template: '<div></div>' },
}))
vi.mock('@/components/ConfirmationDialog.vue', () => ({
  default: { name: 'ConfirmationDialog', template: '<div></div>' },
}))
vi.mock('@/components/GeneratedImage.vue', () => ({ default: { name: 'GeneratedImage', template: '<div></div>' } }))

// Mock composables & utils
vi.mock('@/composables/useAgentActivity', () => ({
  useAgentActivity: () => ({
    addActivity: vi.fn(),
    updateActivity: vi.fn(),
    isVisible: { value: false },
    toggleVisibility: vi.fn(),
  }),
}))

vi.mock('@/utils/chatStorage', () => ({
  HomeChatStorageService: {
    getConversations: vi.fn().mockResolvedValue([]),
    saveConversation: vi.fn().mockResolvedValue({}),
  },
  AIMessage: class {},
  humanMessage: class {},
}))

vi.mock('@/utils/settingForm', () => ({
  default: () => ({
    value: { api: 'official' },
  }),
}))

// Mock AuthStore
vi.mock('@/stores/AuthStore', () => ({
  useAuthStore: () => ({
    state: { user: { profile: { identity: 'Consultant' } } },
    getUserIdentity: () => 'Consultant',
  }),
}))

// Mock agentHistory
vi.mock('@/utils/agentHistory', () => ({
  getAgentHistoryManager: () => ({
    canUndo: false,
    canRedo: false,
    undo: vi.fn(),
    redo: vi.fn(),
    record: vi.fn(),
  }),
  createActionDescription: vi.fn(() => ''),
}))

// Mock api/union
vi.mock('@/api/union', () => ({
  getChatResponse: vi.fn().mockResolvedValue(''),
}))

describe('HomePage', () => {
  it('renders zero state initially', () => {
    const wrapper = mount(HomePage, {
      global: {
        stubs: {
          ChatInput: true,
          ModeSelector: true,
          AgentActivityFeed: true,
          SelectionFloatingMenu: true,
          ConfirmationDialog: true,
          GeneratedImage: true,
        },
        mocks: {
          $t: (msg: string) => msg,
        },
      },
    })
    expect(wrapper.classes()).toContain('zero-state')
    expect(wrapper.find('.zero-state-title').exists()).toBe(true)
  })

  it('displays chat history sidebar toggle button', () => {
    const wrapper = mount(HomePage, {
      global: {
        stubs: {
          ChatInput: true,
          ModeSelector: true,
          AgentActivityFeed: true,
          SelectionFloatingMenu: true,
          ConfirmationDialog: true,
        },
        mocks: {
          $t: (msg: string) => msg,
        },
      },
    })
    expect(wrapper.find('button[title="chatHistory"]').exists()).toBe(true)
  })
})
