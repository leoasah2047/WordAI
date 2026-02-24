export function generateCodeVerifier() {
  const array = new Uint8Array(32)
  window.crypto.getRandomValues(array)
  return b64urlencode(array)
}

export async function generateCodeChallenge(verifier: string) {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await window.crypto.subtle.digest('SHA-256', data)
  return b64urlencode(new Uint8Array(digest))
}

function b64urlencode(buffer: Uint8Array) {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}
