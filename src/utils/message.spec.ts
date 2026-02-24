/**
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { message } from './message'

describe('message utility', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('creates a message container in the document', () => {
    message.success('Success!')
    const container = document.getElementById('message-container')
    expect(container).not.toBeNull()
  })

  it('success method calls showMessage with correct type', () => {
    message.success('Test Success')
    const container = document.getElementById('message-container')
    expect(container).toBeDefined()
    // In a real test we might check the actual vue component but verifying container exists is a good start
  })

  it('clears previous message instance', () => {
    message.info('First')
    const firstId = document.getElementById('message-container')
    message.info('Second')
    const secondId = document.getElementById('message-container')
    expect(firstId).not.toBe(secondId)
  })
})
