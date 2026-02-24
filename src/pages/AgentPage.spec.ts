/**
 * @vitest-environment happy-dom
 */
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import AgentPage from './AgentPage.vue'

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
  useRoute: () => ({ name: 'agent', path: '/agent', matched: [] }),
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/utils/agentOrchestrator', () => ({
  orchestrator: { execute: vi.fn() },
}))

describe('AgentPage', () => {
  it('renders task panel correctly', () => {
    const wrapper = mount(AgentPage, {
      global: {
        stubs: {
          Bot: true,
          CheckCircle2: true,
          Brain: true,
          Play: true,
          Sparkles: true,
          X: true,
          Plus: true,
          Check: true,
          ShieldCheck: true,
          Icon: true,
        },
        mocks: {
          $t: (msg: string) => msg,
        },
      },
    })
    expect(wrapper.find('.task-panel').exists()).toBe(true)
    expect(wrapper.find('textarea').exists()).toBe(true)
  })

  it('enables button when description is entered', async () => {
    const wrapper = mount(AgentPage, {
      global: {
        stubs: {
          Bot: true,
          CheckCircle2: true,
          Brain: true,
          Play: true,
          Sparkles: true,
          X: true,
          Plus: true,
          Check: true,
          ShieldCheck: true,
          Icon: true,
        },
        mocks: { $t: (msg: string) => msg },
      },
    })
    const btn = wrapper.find('.execute-btn')
    expect(btn.attributes('disabled')).toBeDefined()

    await wrapper.find('textarea').setValue('Test task')
    expect(btn.attributes('disabled')).toBeUndefined()
  })
})
