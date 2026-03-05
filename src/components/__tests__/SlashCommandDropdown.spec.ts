// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SlashCommandDropdown from '../SlashCommandDropdown.vue'

describe('SlashCommandDropdown', () => {
  it('renders nothing when items are empty', () => {
    const wrapper = mount(SlashCommandDropdown as any, {
      props: { items: [], position: { top: 0, left: 0 }, activeLevel: 'root' },
    })
    expect(wrapper.find('.slash-command-dropdown').exists()).toBe(false)
  })

  it('renders items and level indicator correctly', () => {
    const items = [
      { id: 'documents', name: 'Documents' },
      { id: 'tools', name: 'Tools' },
    ]
    const wrapper = mount(SlashCommandDropdown as any, {
      props: { items, position: { top: 10, left: 20 }, activeLevel: 'documents' },
    })

    expect(wrapper.find('.slash-command-dropdown').exists()).toBe(true)
    expect(wrapper.find('.level-indicator').text()).toBe('Documents')

    const elements = wrapper.findAll('.dropdown-item')
    expect(elements.length).toBe(2)
    expect(elements[0].text()).toContain('Documents')
    expect(elements[1].text()).toContain('Tools')
  })

  it('emits select event when an item is clicked', async () => {
    const items = [{ id: 'doc1', name: 'Doc 1' }]
    const wrapper = mount(SlashCommandDropdown as any, {
      props: { items, position: { top: 0, left: 0 }, activeLevel: 'documents' },
    })

    await wrapper.find('.dropdown-item').trigger('click')
    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')![0]).toEqual([items[0]])
  })

  it('updates position when position prop changes', async () => {
    const items = [{ id: 'doc1', name: 'Doc 1' }]
    const wrapper = mount(SlashCommandDropdown as any, {
      props: { items, position: { top: 10, left: 10 }, activeLevel: 'root' },
    })

    let dropdown = wrapper.find('.slash-command-dropdown')
    expect((dropdown.element as HTMLElement).style.top).toBe('10px')

    await wrapper.setProps({ position: { top: 50, left: 50 } })

    dropdown = wrapper.find('.slash-command-dropdown')
    expect((dropdown.element as HTMLElement).style.top).toBe('50px')
  })
})
