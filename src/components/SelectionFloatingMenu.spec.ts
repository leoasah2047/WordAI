/**
 * @vitest-environment happy-dom
 */
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SelectionFloatingMenu from './SelectionFloatingMenu.vue'

describe('SelectionFloatingMenu', () => {
  it('renders when visible', () => {
    const wrapper = mount(SelectionFloatingMenu, {
      props: { visible: true, x: 100, y: 100 },
      global: {
        stubs: { MessageSquare: true, Globe: true, Sparkles: true, FileCheck: true, CheckCircle: true },
        mocks: { $t: (msg: string) => msg },
      },
    })
    expect(wrapper.find('.selection-floating-menu').exists()).toBe(true)
  })

  it('emits action on button click', async () => {
    const wrapper = mount(SelectionFloatingMenu, {
      props: { visible: true },
      global: {
        stubs: { MessageSquare: true, Globe: true, Sparkles: true, FileCheck: true, CheckCircle: true },
        mocks: { $t: (msg: string) => msg },
      },
    })
    await wrapper.find('.menu-btn').trigger('click')
    expect(wrapper.emitted('action')?.[0]).toEqual(['chat'])
  })
})
