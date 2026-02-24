/**
 * @vitest-environment happy-dom
 */
import { mount } from '@vue/test-utils'
import { describe, expect, it, nextTick, vi } from 'vitest'

import ChatInput from './ChatInput.vue'

// Mock i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

// Mock Setting Form
vi.mock('@/utils/settingForm', () => ({
  default: () => ({
    value: { consultantBackendUrl: 'http://localhost:8000' },
  }),
}))

// Mock Lucide icons
vi.mock('lucide-vue-next', () => ({
  FileText: { name: 'FileText', template: '<span></span>' },
  Send: { name: 'Send', template: '<span></span>' },
  Sparkles: { name: 'Sparkles', template: '<span></span>' },
  Square: { name: 'Square', template: '<span></span>' },
}))

// Mock sub-components
vi.mock('@/components/AppLoading.vue', () => ({
  default: { name: 'AppLoading', template: '<div></div>' },
}))
vi.mock('@/components/VoiceInput.vue', () => ({
  default: { name: 'VoiceInput', template: '<div></div>' },
}))

// Mock utils
vi.mock('@/utils/homeFileSearch', () => ({
  getDmsConfigFromSettings: vi.fn(),
  searchFiles: vi.fn().mockResolvedValue([]),
}))
vi.mock('@/utils/message', () => ({
  message: {
    info: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
}))
vi.mock('@/utils/fileProcessing', () => ({
  downloadFile: vi.fn(),
  extractFileContent: vi.fn(),
  getAccessToken: vi.fn(),
  initTokenClient: vi.fn(),
  loadGoogleApi: vi.fn(),
}))

describe('ChatInput', () => {
  it('renders correctly', () => {
    const wrapper = mount(ChatInput, {
      props: {
        modelValue: '',
        loading: false,
      },
      global: {
        stubs: {
          AppLoading: true,
          VoiceInput: true,
        },
        mocks: {
          $t: (msg: string) => msg,
        },
      },
    })
    expect(wrapper.find('textarea').exists()).toBe(true)
  })

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(ChatInput, {
      props: {
        modelValue: '',
        loading: false,
      },
      global: {
        stubs: { AppLoading: true, VoiceInput: true },
        mocks: { $t: (msg: string) => msg },
      },
    })
    const textarea = wrapper.find('textarea')
    await textarea.setValue('Hello')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['Hello'])
  })

  it('emits send on button click', async () => {
    const wrapper = mount(ChatInput, {
      props: {
        modelValue: 'Send this',
        loading: false,
      },
      global: {
        stubs: { AppLoading: true, VoiceInput: true },
        mocks: { $t: (msg: string) => msg },
      },
    })
    await wrapper.find('.send-btn').trigger('click')
    expect(wrapper.emitted('send')?.[0]).toEqual(['Send this'])
  })

  it('disables input when loading', () => {
    const wrapper = mount(ChatInput, {
      props: {
        modelValue: 'Test',
        loading: true,
      },
      global: {
        stubs: { AppLoading: true, VoiceInput: true },
        mocks: { $t: (msg: string) => msg },
      },
    })
    expect(wrapper.find('textarea').element.disabled).toBe(true)
    expect(wrapper.find('.stop-btn').exists()).toBe(true)
  })
})
