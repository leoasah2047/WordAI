/**
 * @vitest-environment happy-dom
 */
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import MainLayout from './MainLayout.vue'

// Mock router
const mockRoute = { name: 'chat', path: '/', matched: [] }
const mockRouter = { push: vi.fn() }
vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => mockRouter,
  RouterLink: { template: '<a><slot /></a>' },
  RouterView: { template: '<div><slot /></div>' },
}))

// Mock i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

describe('MainLayout', () => {
  it('renders correctly', () => {
    const wrapper = mount(MainLayout, {
      global: {
        stubs: {
          RouterLink: true,
          RouterView: true,
          Sparkles: true,
          MessageSquare: true,
          Briefcase: true,
          PenTool: true,
          Globe: true,
          Palette: true,
          Bot: true,
          BookOpen: true,
          Wrench: true,
          Settings: true,
          Plus: true,
        },
        mocks: {
          $t: (msg: string) => msg,
        },
      },
    })
    expect(wrapper.find('.sidebar').exists()).toBe(true)
    expect(wrapper.find('.top-header').exists()).toBe(true)
  })

  it('expands sidebar on mouseenter', async () => {
    const wrapper = mount(MainLayout, {
      global: {
        stubs: {
          RouterLink: true,
          RouterView: true,
          Sparkles: true,
          MessageSquare: true,
          Briefcase: true,
          PenTool: true,
          Globe: true,
          Palette: true,
          Bot: true,
          BookOpen: true,
          Wrench: true,
          Settings: true,
          Plus: true,
        },
        mocks: { $t: (msg: string) => msg },
      },
    })
    await wrapper.find('.sidebar').trigger('mouseenter')
    expect(wrapper.find('.sidebar').classes()).toContain('expanded')
  })
})
