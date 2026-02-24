/**
 * @vitest-environment happy-dom
 */
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import AgentActivityFeed from './AgentActivityFeed.vue'

// Mock composable
vi.mock('@/composables/useAgentActivity', () => ({
  useAgentActivity: () => ({
    activities: [{ id: '1', name: 'testTool', status: 'success', timestamp: Date.now(), agent: 'TestAgent' }],
    isVisible: true,
    toggleVisibility: vi.fn(),
    clearActivities: vi.fn(),
  }),
}))

describe('AgentActivityFeed', () => {
  it('renders activities when visible', () => {
    const wrapper = mount(AgentActivityFeed, {
      global: {
        stubs: {
          X: true,
          Activity: true,
          CheckCircle: true,
          Loader2: true,
        },
      },
    })
    expect(wrapper.find('.activity-list').exists()).toBe(true)
    expect(wrapper.find('.activity-agent').text()).toBe('TestAgent')
  })

  it('formats tool names correctly', () => {
    // This is internal logic but we can check the rendered output
    const wrapper = mount(AgentActivityFeed, {
      global: {
        stubs: { X: true, Activity: true, CheckCircle: true, Loader2: true },
      },
    })
    expect(wrapper.find('.activity-name').text()).toBe('Test Tool')
  })
})
