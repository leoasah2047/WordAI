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

  // Handle Dialog API same-origin requirement by redirecting to MS from a local URL
  if (path === '/auth/start' || path.endsWith('/auth/start')) {
    const params = new URLSearchParams(window.location.search)
    const authUrl = params.get('url')
    const state = params.get('state')
    const verifier = params.get('verifier')

    // The dialog has its own isolated cookie/storage space. We need to save the
    // pkce parameters passed from the task pane here locally before continuing the OAuth flow.
    if (state && verifier) {
      const date = new Date()
      date.setTime(date.getTime() + 15 * 60 * 1000)
      const expires = `expires=${date.toUTCString()}`
      document.cookie = `auth_state=${state}; ${expires}; path=/; SameSite=None; Secure`
      document.cookie = `auth_verifier=${verifier}; ${expires}; path=/; SameSite=None; Secure`
      document.cookie = `auth_provider=microsoft; ${expires}; path=/; SameSite=None; Secure`

      console.log('Auth Start: PKCE parameters saved to cookies')
    }

    if (authUrl) {
      window.location.href = authUrl
      return
    }
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
