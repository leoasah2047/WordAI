/**
 * @vitest-environment happy-dom
 */
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ConfirmationDialog from './ConfirmationDialog.vue'

describe('ConfirmationDialog', () => {
  it('renders nothing when not visible', () => {
    const wrapper = mount(ConfirmationDialog, {
      props: {
        visible: false,
        title: 'Title',
        message: 'Message',
      },
    })
    expect(wrapper.find('.confirmation-overlay').exists()).toBe(false)
  })

  it('renders correctly when visible', () => {
    const wrapper = mount(ConfirmationDialog, {
      props: {
        visible: true,
        title: 'Confirm Delete',
        message: 'Are you sure?',
      },
      global: {
        stubs: { AlertCircle: true },
      },
    })
    expect(wrapper.find('h3').text()).toBe('Confirm Delete')
    expect(wrapper.find('p').text()).toBe('Are you sure?')
  })

  it('emits confirm when calling handleConfirm', async () => {
    const wrapper = mount(ConfirmationDialog, {
      props: {
        visible: true,
        title: 'Title',
        message: 'Message',
      },
      global: {
        stubs: { AlertCircle: true },
      },
    })
    await wrapper.find('.confirm-btn').trigger('click')
    expect(wrapper.emitted('confirm')).toBeTruthy()
    expect(wrapper.emitted('update:visible')?.[0]).toEqual([false])
  })
})
