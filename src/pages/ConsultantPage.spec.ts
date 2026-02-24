/**
 * @vitest-environment happy-dom
 */
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import ConsultantPage from './ConsultantPage.vue'

// Mock dependencies
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

vi.mock('@/i18n', () => ({
  i18n: {
    global: {
      locale: { value: 'en' },
    },
  },
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ name: 'consultant', path: '/consultant', matched: [] }),
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/stores/AuthStore', () => ({
  useAuthStore: () => ({ getUserIdentity: () => 'Consultant' }),
}))

vi.mock('@/composables/useAgentActivity', () => ({
  useAgentActivity: () => ({ toggleVisibility: vi.fn() }),
}))

vi.mock('@/utils/settingForm', () => ({
  default: () => ({ value: {} }),
}))

vi.mock('@/utils/chatStorage', () => ({
  ChatStorageService: {
    getConversations: vi.fn().mockResolvedValue([]),
    createNewConversation: vi.fn(() => ({ id: '1', messages: [], context: {} })),
    saveConversation: vi.fn(),
  },
}))

vi.mock('@/utils/templates', () => ({
  templates: [],
}))

// Mock LangChain
vi.mock('@langchain/core/messages', () => ({
  HumanMessage: class {},
  SystemMessage: class {},
}))

describe('ConsultantPage', () => {
  it('renders correctly in default draft mode', () => {
    const wrapper = mount(ConsultantPage, {
      global: {
        stubs: {
          FileText: true,
          MessageSquare: true,
          Award: true,
          Bot: true,
          FolderOpen: true,
          ChevronDown: true,
          ChevronUp: true,
          Plus: true,
          Trash2: true,
          Sparkles: true,
          AppLoading: true,
          AgentActivityFeed: true,
        },
        mocks: {
          $t: (msg: string) => msg,
        },
      },
    })
    expect(wrapper.find('.consultant-page').exists()).toBe(true)
    expect(wrapper.find('.draft-workspace').exists()).toBe(true)
  })

  it('switches modes correctly', async () => {
    const wrapper = mount(ConsultantPage, {
      global: {
        stubs: {
          FileText: true,
          MessageSquare: true,
          Award: true,
          Bot: true,
          FolderOpen: true,
          ChevronDown: true,
          ChevronUp: true,
          Plus: true,
          Trash2: true,
          Sparkles: true,
          AppLoading: true,
          AgentActivityFeed: true,
          ChatInput: true,
        },
        mocks: { $t: (msg: string) => msg },
      },
    })
    const tabs = wrapper.findAll('.mode-tab')
    await tabs[1].trigger('click') // Chat mode
    expect(wrapper.find('.chat-workspace').exists()).toBe(true)
  })
})
