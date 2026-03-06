import 'element-plus/dist/index.css'
import './styles/variables.css'

import ElementUI from 'element-plus'
import { createApp } from 'vue'

import App from './App.vue'
import { i18n } from './i18n'
import router from './router'
import { setupGlobalErrorHandler } from './utils/errorHandling'

window.Office.onReady(() => {
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

  // Handle OAuth callback hydration for memory history
  const path = window.location.pathname
  if (path === '/auth/callback') {
    const params = new URLSearchParams(window.location.search)
    router.push({
      path: '/auth/callback',
      query: {
        code: params.get('code'),
        state: params.get('state'),
      },
    })
  }

  // Global Error Handler
  setupGlobalErrorHandler(app)

  app.mount('#app')
})
