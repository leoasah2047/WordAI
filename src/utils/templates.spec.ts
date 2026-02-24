import { describe, expect, it } from 'vitest'

import { templates } from './templates'

describe('Writing Templates', () => {
  it('templates list is not empty', () => {
    expect(templates.length).toBeGreaterThan(0)
  })

  it('hr_offer_letter generates correct prompt', () => {
    const template = templates.find(t => t.id === 'hr_offer_letter')
    expect(template).toBeDefined()

    const inputs = {
      candidate: 'John Doe',
      position: 'Engineer',
      salary: '$100k',
      start_date: 'Jan 1st',
    }

    const prompt = template!.promptTemplate(inputs)
    expect(prompt).toContain('John Doe')
    expect(prompt).toContain('Engineer')
    expect(prompt).toContain('$100k')
  })

  it('aa_audit_plan generates correct prompt', () => {
    const template = templates.find(t => t.id === 'aa_audit_plan')
    expect(template).toBeDefined()

    const inputs = {
      client: 'ACME Corp',
      scope: 'FY2023',
      risks: 'Inventory, Revenue',
    }

    const prompt = template!.promptTemplate(inputs)
    expect(prompt).toContain('ACME Corp')
    expect(prompt).toContain('FY2023')
    expect(prompt).toContain('Inventory, Revenue')
  })

  it('all templates have unique IDs', () => {
    const ids = templates.map(t => t.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('all templates have required fields', () => {
    templates.forEach(t => {
      expect(t.id).toBeDefined()
      expect(t.name).toBeDefined()
      expect(t.promptTemplate).toBeTypeOf('function')
    })
  })
})
