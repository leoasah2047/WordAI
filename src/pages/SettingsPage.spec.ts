/**
 * @vitest-environment happy-dom
 */
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import SettingsPage from './SettingsPage.vue'

// Mock dependencies
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

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

vi.mock('@/utils/settingForm', () => ({
  default: () => ({ value: { api: 'gemini' } }),
}))

describe('SettingsPage', () => {
  it('renders tabs correctly', () => {
    const wrapper = mount(SettingsPage, {
      global: {
        stubs: {
          ArrowLeft: true,
          Globe: true,
          Cpu: true,
          MessageSquare: true,
          Settings: true,
          Languages: true,
          Wrench: true,
          Database: true,
          HardDrive: true,
        },
        mocks: {
          $t: (msg: string) => msg,
        },
      },
    })
    expect(wrapper.findAll('.tab-button')).toHaveLength(8)
  })

  it('switches tabs on click', async () => {
    const wrapper = mount(SettingsPage, {
      global: {
        stubs: {
          ArrowLeft: true,
          Globe: true,
          Cpu: true,
          MessageSquare: true,
          Settings: true,
          Languages: true,
          Wrench: true,
          Database: true,
          HardDrive: true,
        },
        mocks: { $t: (msg: string) => msg },
      },
    })
    const tabs = wrapper.findAll('.tab-button')
    await tabs[0].trigger('click') // General tab
    expect(wrapper.find('.settings-section').isVisible()).toBe(true)
  })
})
