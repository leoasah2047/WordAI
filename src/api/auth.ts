import { authService } from '@/utils/authService'
import { generateCodeChallenge, generateCodeVerifier } from '@/utils/pkce'

// Placeholders - in production these should be in .env
const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID || '591959427519-ahul5uf85pg5sntkg82tl9kgc09rsn4a.apps.googleusercontent.com'
const MS_CLIENT_ID = import.meta.env.VITE_MS_CLIENT_ID || '87759d28-5815-4503-af54-280d464e9030'
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (window.location.hostname === 'localhost'
    ? 'https://wordai-production-fa22.up.railway.app'
    : 'https://wordai-production-fa22.up.railway.app')

export const AUTH_CONFIG = {
  google: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    clientId: GOOGLE_CLIENT_ID,
    scope: 'openid email profile',
  },
  microsoft: {
    authUrl: 'https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize',
    clientId: MS_CLIENT_ID,
    scope: `openid email profile User.Read api://${MS_CLIENT_ID}/access_as_user`,
  },
}

export async function initiateOAuth(provider: 'google' | 'microsoft') {
  if (provider === 'microsoft' && window.Office?.context?.auth) {
    try {
      const token = await authService.getAccessToken()
      return await handleMicrosoftNAA(token)
    } catch (error) {
      console.error('NAA failed, falling back to standard OAuth', error)
    }
  }

  const verifier = generateCodeVerifier()
  const challenge = await generateCodeChallenge(verifier)
  const state = Math.random().toString(36).substring(7)

  // Store verifier and state to verify on callback
  localStorage.setItem('auth_verifier', verifier)
  localStorage.setItem('auth_state', state)
  localStorage.setItem('auth_provider', provider)

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

  window.location.href = `${config.authUrl}?${params.toString()}`
}

async function handleMicrosoftNAA(token: string) {
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

export async function handleAuthCallback(code: string, state: string) {
  const savedState = localStorage.getItem('auth_state')
  const verifier = localStorage.getItem('auth_verifier')
  const provider = localStorage.getItem('auth_provider')

  if (state !== savedState || !verifier || !provider) {
    throw new Error('Invalid state or missing verifier')
  }

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

  // Clear temp auth data
  localStorage.removeItem('auth_state')
  localStorage.removeItem('auth_verifier')
  localStorage.removeItem('auth_provider')

  return await response.json()
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
