// import { message } from '@/utils/message'
import useSettingForm from '@/utils/settingForm'

export interface RequestConfig extends RequestInit {
  retries?: number
  retryDelay?: number
}

const DEFAULT_RETRIES = 3
const DEFAULT_DELAY = 1000

async function fetchWithRetry(url: string, config: RequestConfig = {}): Promise<Response> {
  const { retries = DEFAULT_RETRIES, retryDelay = DEFAULT_DELAY, ...init } = config

  try {
    const response = await fetch(url, init)

    // Retry on 5xx errors or 429 (Too Many Requests)
    if (!response.ok && (response.status >= 500 || response.status === 429)) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        return fetchWithRetry(url, { ...config, retries: retries - 1, retryDelay: retryDelay * 2 }) // Exponential backoff
      }
    }

    return response
  } catch (error) {
    if (retries > 0) {
      // Network error, also retry
      await new Promise(resolve => setTimeout(resolve, retryDelay))
      return fetchWithRetry(url, { ...config, retries: retries - 1, retryDelay: retryDelay * 2 })
    }
    throw error
  }
}

class ApiClient {
  private get baseUrl() {
    const settings = useSettingForm()
    // Ensure no trailing slash
    const base = (settings.value.consultantBackendUrl || 'http://localhost:8000').replace(/\/$/, '')
    return `${base}/api/v1`
  }

  async get<T = any>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const response = await fetchWithRetry(url, {
      ...config,
      method: 'GET',
    })
    return this.handleResponse<T>(response)
  }

  async post<T = any>(endpoint: string, body: any, config: RequestConfig = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const response = await fetchWithRetry(url, {
      ...config,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.headers as Record<string, string>),
      },
      body: JSON.stringify(body),
    })
    return this.handleResponse<T>(response)
  }

  async upload<T = any>(endpoint: string, formData: FormData, config: RequestConfig = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const response = await fetchWithRetry(url, {
      ...config,
      method: 'POST',
      body: formData,
    })
    return this.handleResponse<T>(response)
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.detail || `Request failed with status ${response.status}`
      throw new Error(errorMessage)
    }
    return response.json()
  }
}

export const apiClient = new ApiClient()
