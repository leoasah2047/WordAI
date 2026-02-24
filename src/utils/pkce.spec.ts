import { describe, expect, it, vi } from 'vitest'

import { generateCodeChallenge, generateCodeVerifier } from './pkce'

// Mock crypto
const cryptoMock = {
  getRandomValues: (arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256)
    return arr
  },
  subtle: {
    digest: async (algo: string, data: Uint8Array) => {
      if (algo === 'SHA-256') {
        const verifier = 'dBjftJeZ4CVP-mB92K27uhbUbP1mc1hu4thms6AsZdg'
        const encoder = new TextEncoder()
        if (data.length === encoder.encode(verifier).length) {
          return new Uint8Array([
            0x13, 0xd3, 0x1e, 0x96, 0x1a, 0x36, 0x3b, 0x49, 0xfb, 0xb2, 0xae, 0xba, 0x5e, 0x31, 0xfb, 0x63, 0x2f, 0xc6,
            0xfe, 0x9d, 0x77, 0xbd, 0x3f, 0x7e, 0x4a, 0x91, 0x63, 0x5a, 0x11, 0xb8, 0x0b, 0x83,
          ]).buffer
        }
      }
      return new Uint8Array(32).buffer
    },
  },
}

vi.stubGlobal('crypto', cryptoMock)
vi.stubGlobal('window', { crypto: cryptoMock })

describe('pkce utils', () => {
  it('generateCodeVerifier returns a string of correct length', () => {
    const verifier = generateCodeVerifier()
    expect(typeof verifier).toBe('string')
    expect(verifier.length).toBeGreaterThanOrEqual(43)
    expect(verifier.length).toBeLessThanOrEqual(128)
  })

  it('generateCodeChallenge returns a base64url encoded hash', async () => {
    // Known verifier and its S256 challenge (standard PKCE example)
    const verifier = 'dBjftJeZ4CVP-mB92K27uhbUbP1mc1hu4thms6AsZdg'
    // Challenge for this verifier should be E9Melho2O0n7sq66XjH7Yy_G_p13vT9-SpFjWhG4C4M
    const challenge = await generateCodeChallenge(verifier)
    expect(challenge).toBe('E9Melho2O0n7sq66XjH7Yy_G_p13vT9-SpFjWhG4C4M')
  })
})
