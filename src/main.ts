import 'element-plus/dist/index.css'
import './styles/variables.css'

import ElementUI from 'element-plus'
import { createApp } from 'vue'

import App from './App.vue'
import { i18n } from './i18n'
import router from './router'
import { setupGlobalErrorHandler } from './utils/errorHandling'

window.Office.onReady(() => {
  // Handle OAuth callback hydration from path to hash
  const path = window.location.pathname
  if (path === '/auth/callback' || path.endsWith('/auth/callback')) {
    const params = new URLSearchParams(window.location.search)
    // Redirect to hash route so Vue Router can handle it
    window.location.href = `${window.location.origin}/#/auth/callback?${params.toString()}`
    return
  }

  const app = createApp(App)
  const debounce = (fn: (...args: any[]) => void, delay?: number) => {
    let timer: number | null = null
    return function (this: unknown, ...args: any[]) {
      const context = this

      if (timer !== null) clearTimeout(timer)
      timer = window.setTimeout(() => {
        fn.apply(context, args)
      }, delay)
    }
  }

  const _ResizeObserver = window.ResizeObserver
  window.ResizeObserver = class ResizeObserver extends _ResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      callback = debounce(callback, 16)
      super(callback)
    }
  }
  app.use(i18n)
  app.use(ElementUI)
  app.use(router)

  // Hydrate Memory History from the current hash
  if (window.location.hash) {
    const hashPath = window.location.hash.slice(1) // remove #
    if (hashPath) {
      router.push(hashPath)
    }
  }

  // Global Error Handler
  setupGlobalErrorHandler(app)

  app.mount('#app')
})
