/**
 * @vitest-environment happy-dom
 */
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import DmsFilePicker from './DmsFilePicker.vue'

// Mock i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

// Mock utils
vi.mock('@/utils/fileProcessing', () => ({
  searchErpNextFiles: vi.fn(),
  loadGoogleApi: vi.fn(),
  initTokenClient: vi.fn(),
  requestAccessToken: vi.fn(),
}))

vi.mock('@/utils/settingForm', () => ({
  default: () => ({
    value: { erpnextUrl: 'http://erp' },
  }),
}))

describe('DmsFilePicker', () => {
  it('renders tabs correctly', () => {
    const wrapper = mount(DmsFilePicker, {
      global: {
        stubs: {
          Search: true,
          CheckSquare: true,
          FileQuestion: true,
          AppLoading: true,
          AlertCircle: true,
          FileText: true,
          Image: true,
          Check: true,
          HardDrive: true,
        },
        mocks: {
          $t: (msg: string) => msg,
        },
      },
    })
    expect(wrapper.find('.provider-tabs').exists()).toBe(true)
    expect(wrapper.find('.tab-btn.active').text()).toBe('ERPNext')
  })

  it('switches tabs on click', async () => {
    const wrapper = mount(DmsFilePicker, {
      global: {
        stubs: {
          Search: true,
          CheckSquare: true,
          FileQuestion: true,
          AppLoading: true,
          AlertCircle: true,
          FileText: true,
          Image: true,
          Check: true,
          HardDrive: true,
        },
        mocks: { $t: (msg: string) => msg },
      },
    })
    const tabs = wrapper.findAll('.tab-btn')
    await tabs[1].trigger('click')
    expect(wrapper.find('.tab-btn.active').text()).toBe('Google Drive')
  })
})
