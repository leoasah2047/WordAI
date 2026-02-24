/**
 * @vitest-environment happy-dom
 */
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import Message from './Message.vue'

describe('Message component', () => {
  it('renders message correctly', async () => {
    const wrapper = mount(Message, {
      props: {
        message: 'Hello World',
        type: 'success',
        duration: 3000,
      },
      global: {
        stubs: {
          Teleport: true,
          CheckCircle: true,
          AlertCircle: true,
          Info: true,
          AlertTriangle: true,
          Transition: true,
        },
      },
    })
    await nextTick() // wait for onMounted to set visible=true
    // Teleport might need special handling in mount if we want to check body,
    // but we can check if it renders within the wrapper if stubbed
    expect(wrapper.text()).toContain('Hello World')
    expect(wrapper.find('.toast-success').exists()).toBe(true)
  })

  it('emits close after duration', async () => {
    vi.useFakeTimers()
    const wrapper = mount(Message, {
      props: {
        message: 'Close me',
        duration: 100,
      },
      global: {
        stubs: { Teleport: true, Info: true },
      },
    })

    vi.advanceTimersByTime(500)
    expect(wrapper.emitted('close')).toBeTruthy()
    vi.useRealTimers()
  })
})
