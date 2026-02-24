import { generateCodeChallenge, generateCodeVerifier } from '@/utils/pkce'

// Placeholders - in production these should be in .env
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID'
const MS_CLIENT_ID = 'YOUR_MS_CLIENT_ID'
const API_BASE_URL = 'http://localhost:8000'

export const AUTH_CONFIG = {
  google: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    clientId: GOOGLE_CLIENT_ID,
    scope: 'openid email profile',
  },
  microsoft: {
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    clientId: MS_CLIENT_ID,
    scope: 'openid email profile User.Read',
  },
}

export async function initiateOAuth(provider: 'google' | 'microsoft') {
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
  const response = await fetch(`${API_BASE_URL}/auth/me`)
  if (!response.ok) return null
  return await response.json()
}

export async function logout() {
  await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST' })
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
    body: JSON.stringify(updates),
  })
  if (!response.ok) {
    throw new Error('Failed to update profile')
  }
  return await response.json()
}
