import { type AuthenticationResult, PublicClientApplication } from '@azure/msal-browser'

import { loginRequest, msalConfig } from './msalConfig'

class AuthService {
  private msalInstance: PublicClientApplication | null = null

  private initPromise: Promise<void> | null = null

  async initialize() {
    if (this.initPromise) return this.initPromise

    this.initPromise = (async () => {
      this.msalInstance = new PublicClientApplication(msalConfig)
      await this.msalInstance.initialize()
    })()

    return this.initPromise
  }

  async getAccessToken(): Promise<string> {
    await this.initialize()
    if (!this.msalInstance) throw new Error('MSAL not initialized')

    const accounts = this.msalInstance.getAllAccounts()
    const account = accounts.length > 0 ? accounts[0] : undefined

    try {
      // Try NAA first (silent acquisition)
      const result: AuthenticationResult = await this.msalInstance.acquireTokenSilent({
        ...loginRequest,
        account,
      })
      return result.accessToken
    } catch (error: any) {
      console.warn('Silent token acquisition failed, attempting fallback...', error)
      throw error // Re-throw to be handled by the caller (fallback logic in initiateOAuth)
    }
  }
}

export const authService = new AuthService()
