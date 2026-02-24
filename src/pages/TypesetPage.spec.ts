/**
 * @vitest-environment happy-dom
 */
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import TypesetPage from './TypesetPage.vue'

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
  useRoute: () => ({ name: 'typeset', path: '/typeset', matched: [] }),
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/utils/settingForm', () => ({
  default: () => ({ value: {} }),
}))

vi.mock('@/utils/typeset', () => ({
  customTemplates: { value: [] },
  defaultTemplates: [{ id: '1', name: 'Default', styles: {} }],
}))

describe('TypesetPage', () => {
  it('renders initial selection view', () => {
    const wrapper = mount(TypesetPage, {
      global: {
        stubs: {
          LayoutTemplate: true,
          BookOpen: true,
          AlignJustify: true,
          ChevronRight: true,
          MoreVertical: true,
          Plus: true,
        },
        mocks: {
          $t: (msg: string) => msg,
        },
      },
    })
    expect(wrapper.find('.selection-view').exists()).toBe(true)
    expect(wrapper.findAll('.template-card')).toHaveLength(1)
  })
})
