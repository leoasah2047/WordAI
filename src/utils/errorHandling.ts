import { ElNotification } from 'element-plus'
import { App } from 'vue'

export enum ErrorCategory {
  NETWORK = 'Network Error',
  API = 'API Error',
  AUTH = 'Authentication Error',
  USER = 'User Action Error',
  SYSTEM = 'System Error',
}

interface AppError extends Error {
  category?: ErrorCategory
  status?: number
  info?: string
}

export function setupGlobalErrorHandler(app: App) {
  app.config.errorHandler = (err: any, instance: any, info: string) => {
    const error = err as AppError
    console.error(`[${error.category || 'Global Error'}]:`, error)
    console.error('Vue Component:', instance)
    console.error('Error Info:', info)

    const message = error.message || 'An unexpected error occurred.'
    const category = error.category || ErrorCategory.SYSTEM

    // Skip notifications for aborted requests
    if (message.includes('aborted') || message === 'The user aborted a request.') {
      return
    }

    notifyError(category, message)
  }

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', event => {
    const reason = event.reason
    console.error('Unhandled Promise Rejection:', reason)

    const message = reason?.message || String(reason)
    const category = reason?.category || (message.includes('fetch') ? ErrorCategory.NETWORK : ErrorCategory.SYSTEM)

    if (message.includes('aborted') || message === 'The user aborted a request.') {
      return
    }

    notifyError(category, message)
  })
}

function notifyError(category: ErrorCategory, message: string) {
  ElNotification({
    title: category,
    message,
    type: 'error',
    duration: 5000,
    showClose: true,
    position: 'bottom-right',
  })
}

export function createError(message: string, category: ErrorCategory, info?: string): AppError {
  const error: AppError = new Error(message)
  error.category = category
  error.info = info
  return error
}
