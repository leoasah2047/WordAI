/**
 * @vitest-environment happy-dom
 */
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import VoiceInput from './VoiceInput.vue'

// Mock SpeechRecognition
const mockRecognition = {
  start: vi.fn(),
  stop: vi.fn(),
  continuous: false,
  interimResults: false,
  lang: '',
  onresult: null,
  onerror: null,
  onend: null,
}

global.window.webkitSpeechRecognition = vi.fn(function () {
  return mockRecognition
}) as any

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('@/utils/message', () => ({
  message: {
    error: vi.fn(),
    warning: vi.fn(),
  },
}))

describe('VoiceInput', () => {
  it('renders mic icon by default', () => {
    const wrapper = mount(VoiceInput, {
      global: {
        stubs: { Mic: true, MicOff: true },
      },
    })
    expect(wrapper.findComponent({ name: 'Mic' })).toBeDefined()
  })

  it('toggles listening on click', async () => {
    const wrapper = mount(VoiceInput, {
      global: {
        stubs: { Mic: true, MicOff: true },
      },
    })
    await wrapper.trigger('click')
    expect(mockRecognition.start).toHaveBeenCalled()
  })
})
