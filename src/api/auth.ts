import { authService } from '@/utils/authService'
import { generateCodeChallenge, generateCodeVerifier } from '@/utils/pkce'

// Placeholders - in production these should be in .env
const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID || '591959427519-ahul5uf85pg5sntkg82tl9kgc09rsn4a.apps.googleusercontent.com'
const MS_CLIENT_ID = import.meta.env.VITE_MS_CLIENT_ID || '87759d28-5815-4503-af54-280d464e9030'
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'https://wordai-production-fa22.up.railway.app'
    : 'https://wordai-production-fa22.up.railway.app')

export const AUTH_CONFIG = {
  google: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    clientId: GOOGLE_CLIENT_ID,
    scope: 'openid email profile',
  },
  microsoft: {
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    clientId: MS_CLIENT_ID,
    scope: `openid email profile User.Read api://${MS_CLIENT_ID}/access_as_user`,
  },
}

// Helper to manage auth state in cookies (more reliable in some Office environments than localStorage)
function setAuthCookie(name: string, value: string) {
  // Use a short-lived cookie (15 mins)
  const date = new Date()
  date.setTime(date.getTime() + 15 * 60 * 1000)
  document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/; SameSite=None; Secure`
}

function getAuthCookie(name: string): string | null {
  const nameEQ = name + '='
  const ca = document.cookie.split(';')
  for (let cookie of ca) {
    while (cookie.charAt(0) === ' ') cookie = cookie.substring(1, cookie.length)
    if (cookie.indexOf(nameEQ) === 0) return cookie.substring(nameEQ.length, cookie.length)
  }
  return null
}

function clearAuthCookies() {
  document.cookie = 'auth_state=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; Secure'
  document.cookie = 'auth_verifier=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; Secure'
  document.cookie = 'auth_provider=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; Secure'
}

export async function initiateOAuth(provider: 'google' | 'microsoft') {
  const isOffice = typeof window.Office !== 'undefined' && window.Office.context
  const officeAuth = (window.Office?.context as any)?.auth

  if (provider === 'microsoft' && officeAuth) {
    try {
      console.log('Attempting Nested App Authentication (NAA)...')
      const token = await authService.getAccessToken()
      return await handleMicrosoftNAA(token)
    } catch (error) {
      console.warn('NAA failed, falling back to standard OAuth after a short delay', error)
      // Small delay to ensure any NAA internal state or dialog attempts are cleared
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  // Removed the unused getAccessToken() fallback that was causing dual-dialog conflicts

  const verifier = generateCodeVerifier()
  const challenge = await generateCodeChallenge(verifier)
  const state = Math.random().toString(36).substring(7)

  setAuthCookie('auth_verifier', verifier)
  setAuthCookie('auth_state', state)
  setAuthCookie('auth_provider', provider)

  console.log(`Auth Initiation: State and verifier saved (${provider})`)

  const config = AUTH_CONFIG[provider]
  const redirectUri = `${window.location.origin}/auth/callback`

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: config.scope,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  })

  const authUrl = `${config.authUrl}?${params.toString()}`

  // Pass the state and verifier into the dialog so it doesn't need to rely on localStorage
  const localParams = new URLSearchParams({
    url: authUrl,
    state,
    verifier,
  })
  const startUrl = `${window.location.origin}/auth/start?${localParams.toString()}`

  if (isOffice) {
    return new Promise((resolve, reject) => {
      // Open the local start URL in a dialog instead of the cross-domain authUrl directly
      Office.context.ui.displayDialogAsync(startUrl, { height: 60, width: 40, displayInIframe: false }, asyncResult => {
        if (asyncResult.status === Office.AsyncResultStatus.Failed) {
          console.error('Dialog failed to open:', asyncResult.error.message)
          reject(new Error('Popup blocked or dialog unavailable. Please allow popups for this Add-in and try again.'))
        } else {
          const dialog = asyncResult.value

          dialog.addEventHandler(Office.EventType.DialogMessageReceived, async (arg: any) => {
            dialog.close()
            const message = arg.message as string
            try {
              let code: string | null = null
              let callbackState: string | null = null

              try {
                const data = JSON.parse(message)
                code = data.code || null
                callbackState = data.state || null
              } catch {
                // Fallback for older query string format
                const messageParams = new URLSearchParams(message.startsWith('?') ? message : `?${message}`)
                code = messageParams.get('code')
                callbackState = messageParams.get('state')
              }

              if (code && callbackState) {
                const userData = await handleAuthCallback(code, callbackState)
                resolve(userData)
              } else {
                reject(new Error('Invalid callback parameters from dialog'))
              }
            } catch (err) {
              reject(err)
            }
          })

          dialog.addEventHandler(Office.EventType.DialogEventReceived, (arg: any) => {
            if (arg.error === 12006) {
              reject(new Error('Authentication cancelled by user'))
            }
          })
        }
      })
    })
  } else {
    window.location.href = authUrl
    return null
  }
}

export async function handleMicrosoftNAA(token: string) {
  const response = await fetch(`${API_BASE_URL}/auth/microsoft/naa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ token }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'NAA Authentication failed')
  }

  return await response.json()
}

// Track processing to handle double-calls in Dev Mode
let processingState: string | null = null
let processedResult: any = null

export async function handleAuthCallback(code: string, state: string) {
  // If we just finished this state, return the cached result
  if (processingState === state && processedResult) {
    console.log('Auth Callback: Returning cached result for double-call')
    return processedResult
  }

  // Try localStorage first, then fallback to Cookies
  const savedState = localStorage.getItem('auth_state') || getAuthCookie('auth_state')
  const verifier = localStorage.getItem('auth_verifier') || getAuthCookie('auth_verifier')
  const provider = (localStorage.getItem('auth_provider') || getAuthCookie('auth_provider')) as 'google' | 'microsoft'

  const isFromLocalStorage = !!localStorage.getItem('auth_state')
  console.log('Auth Callback Verification:', {
    receivedState: state,
    savedState,
    hasVerifier: !!verifier,
    provider,
    source: isFromLocalStorage ? 'localStorage' : 'Cookies',
  })

  if (state !== savedState || !verifier || !provider) {
    // If the state is missing but it matches what we just processed, return that result
    if (processingState === state && processedResult) {
      return processedResult
    }
    // Clear temp auth data so the next attempt starts clean
    localStorage.removeItem('auth_state')
    localStorage.removeItem('auth_verifier')
    localStorage.removeItem('auth_provider')
    clearAuthCookies()

    const errorMsg = `Authentication state mismatch. Received: ${state}, Saved: ${savedState}. Please try again.`
    console.error(errorMsg)
    throw new Error(errorMsg)
  }

  processingState = state

  const response = await fetch(`${API_BASE_URL}/auth/${provider}/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      code,
      code_verifier: verifier,
      redirect_uri: `${window.location.origin}/auth/callback`,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Authentication failed')
  }

  const result = await response.json()
  processedResult = result

  // Clear temp auth data
  localStorage.removeItem('auth_state')
  localStorage.removeItem('auth_verifier')
  localStorage.removeItem('auth_provider')
  clearAuthCookies()

  return result
}

export async function getMe() {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    credentials: 'include',
  })
  if (!response.ok) return null
  return await response.json()
}

export async function logout() {
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  })
  window.location.reload()
}

export async function updateProfile(updates: {
  identity?: string
  dms_provider?: string
  dms_api_key?: string
  dms_oauth_token?: string
  gemini_api_key?: string
}) {
  const response = await fetch(`${API_BASE_URL}/user/profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(updates),
  })
  if (!response.ok) {
    throw new Error('Failed to update profile')
  }
  return await response.json()
}
