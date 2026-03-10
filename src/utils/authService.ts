import { type AuthenticationResult, PublicClientApplication } from '@azure/msal-browser'

import { loginRequest, msalConfig } from './msalConfig'

class AuthService {
  private msalInstance: PublicClientApplication | null = null

  async initialize() {
    if (this.msalInstance) return
    this.msalInstance = new PublicClientApplication(msalConfig)
    await this.msalInstance.initialize()
  }

  async getAccessToken(): Promise<string> {
    await this.initialize()
    if (!this.msalInstance) throw new Error('MSAL not initialized')

    try {
      // Try NAA first
      const result: AuthenticationResult = await this.msalInstance.acquireTokenSilent({
        ...loginRequest,
        account: this.msalInstance.getAllAccounts()[0],
      })
      return result.accessToken
    } catch (error) {
      console.warn('Silent token acquisition failed, attempting fallback...', error)
      return this.fallbackLogin()
    }
  }

  private async fallbackLogin(): Promise<string> {
    return new Promise((resolve, reject) => {
      const dialogUrl = `${window.location.origin}/auth.html`

      Office.context.ui.displayDialogAsync(
        dialogUrl,
        { height: 60, width: 40, displayInIframe: false },
        asyncResult => {
          if (asyncResult.status === Office.AsyncResultStatus.Failed) {
            reject(new Error(asyncResult.error.message))
            return
          }

          const dialog = asyncResult.value
          dialog.addEventHandler(Office.EventType.DialogMessageReceived, (args: any) => {
            if (args.message) {
              const response = JSON.parse(args.message)
              if (response.accessToken) {
                resolve(response.accessToken)
              } else {
                reject(new Error('No token received from dialog'))
              }
              dialog.close()
            }
          })

          dialog.addEventHandler(Office.EventType.DialogEventReceived, (args: any) => {
            if (args.error) {
              reject(new Error(`Dialog error: ${args.error}`))
            }
          })
        },
      )
    })
  }
}

export const authService = new AuthService()
