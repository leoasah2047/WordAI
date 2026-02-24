/**
 * @vitest-environment happy-dom
 */
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import ModeSelector from './ModeSelector.vue'

// Mock AuthStore
vi.mock('@/stores/AuthStore', () => ({
  useAuthStore: () => ({
    getUserIdentity: () => 'Consultant',
  }),
}))

describe('ModeSelector', () => {
  it('renders current mode label', () => {
    const wrapper = mount(ModeSelector, {
      props: { initialMode: 'chat' },
      global: {
        stubs: {
          SlidersHorizontal: true,
          MessageSquare: true,
          Globe: true,
          Briefcase: true,
          Bot: true,
          Palette: true,
          FileEdit: true,
          Type: true,
          Check: true,
        },
      },
    })
    expect(wrapper.find('.mode-label').text()).toBe('Chat Mode')
  })

  it('toggles dropdown on click', async () => {
    const wrapper = mount(ModeSelector, {
      global: {
        stubs: {
          SlidersHorizontal: true,
          MessageSquare: true,
          Globe: true,
          Briefcase: true,
          Bot: true,
          Palette: true,
          FileEdit: true,
          Type: true,
          Check: true,
        },
      },
    })
    await wrapper.find('.mode-toggle-btn').trigger('click')
    expect(wrapper.find('.mode-dropdown').exists()).toBe(true)
  })

  it('selects mode and emits update', async () => {
    const wrapper = mount(ModeSelector, {
      global: {
        stubs: {
          SlidersHorizontal: true,
          MessageSquare: true,
          Globe: true,
          Briefcase: true,
          Bot: true,
          Palette: true,
          FileEdit: true,
          Type: true,
          Check: true,
        },
      },
    })
    await wrapper.find('.mode-toggle-btn').trigger('click')
    await wrapper.find('.mode-item').trigger('click') // Chat is first
    expect(wrapper.emitted('update:mode')).toBeTruthy()
  })
})
