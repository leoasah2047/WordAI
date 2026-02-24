import { ElNotification } from 'element-plus'
/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi } from 'vitest'

import { createError, ErrorCategory, setupGlobalErrorHandler } from './errorHandling'

// Mock element-plus
vi.mock('element-plus', () => ({
  ElNotification: vi.fn(),
}))

import { ElNotification } from 'element-plus'

describe('errorHandling', () => {
  it('createError creates an AppError object', () => {
    const error = createError('test message', ErrorCategory.API, 'extra info')
    expect(error.message).toBe('test message')
    expect(error.category).toBe(ErrorCategory.API)
    expect(error.info).toBe('extra info')
  })

  it('setupGlobalErrorHandler sets up error handlers', () => {
    const mockApp = {
      config: {
        errorHandler: null,
      },
    } as any
    setupGlobalErrorHandler(mockApp)
    expect(mockApp.config.errorHandler).toBeTypeOf('function')
  })

  it('errorHandler triggers notification', () => {
    const mockApp = { config: {} } as any
    setupGlobalErrorHandler(mockApp)
    const err = createError('Test failure', ErrorCategory.NETWORK)

    mockApp.config.errorHandler(err, {}, 'info')

    expect(ElNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: ErrorCategory.NETWORK,
        message: 'Test failure',
        type: 'error',
      }),
    )
  })

  it('skips notification for aborted requests', () => {
    const mockApp = { config: {} } as any
    setupGlobalErrorHandler(mockApp)
    const err = new Error('aborted')

    mockApp.config.errorHandler(err, {}, 'info')

    expect(ElNotification).not.toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'aborted',
      }),
    )
  })
})
