/**
 * @vitest-environment happy-dom
 */
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import TranslationControls from './TranslationControls.vue'

// Mock vueuse useStorage
vi.mock('@vueuse/core', () => ({
  useStorage: vi.fn((key, initial) => ({ value: initial })),
}))

describe('TranslationControls', () => {
  it('renders selects correctly', () => {
    const wrapper = mount(TranslationControls, {
      global: {
        mocks: { $t: (msg: string) => msg },
      },
    })
    expect(wrapper.findAll('select')).toHaveLength(2)
  })
})
