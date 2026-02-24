import {
  type DmsFile,
  getAccessToken,
  initTokenClient,
  loadGoogleApi,
  searchErpNextFiles,
  searchGoogleDriveFiles,
} from './fileProcessing'

export interface DmsConfig {
  erpnext: {
    url: string
    apiKey: string
    apiSecret: string
  }
  googledrive: {
    clientId: string
    apiKey: string
  }
}

interface SearchCache {
  query: string
  results: DmsFile[]
  timestamp: number
}

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
let searchCache: SearchCache | null = null

/**
 * Search files across ERPNext and Google Drive with caching
 * @param query Search query string
 * @param config DMS configuration from settings
 * @returns Promise<DmsFile[]> Combined search results
 */
export async function searchFiles(query: string, config: DmsConfig): Promise<DmsFile[]> {
  // Check cache first
  if (searchCache && searchCache.query === query && Date.now() - searchCache.timestamp < CACHE_TTL) {
    console.log('Returning cached search results for:', query)
    return searchCache.results
  }

  const results: DmsFile[] = []

  // Search ERPNext if configured
  if (config.erpnext.url && config.erpnext.apiKey && config.erpnext.apiSecret) {
    try {
      console.log('Searching ERPNext for:', query)
      const erpFiles = await searchErpNextFiles(config.erpnext, query)
      results.push(
        ...erpFiles.map(f => ({
          id: f.name,
          name: f.file_name,
          url: f.file_url,
          size: f.file_size,
          provider: 'erpnext' as const,
          originalData: f,
        })),
      )
    } catch (error) {
      console.error('ERPNext search failed:', error)
      // Don't throw - continue with Google Drive search
    }
  }

  // Search Google Drive if configured
  if (config.googledrive.clientId && config.googledrive.apiKey) {
    try {
      console.log('Searching Google Drive for:', query)
      await loadGoogleApi()
      initTokenClient(config.googledrive, () => {})
      const token = await getAccessToken()
      const googleFiles = await searchGoogleDriveFiles(token, query)
      results.push(...googleFiles)
    } catch (error) {
      console.error('Google Drive search failed:', error)
      // Don't throw - return whatever results we have
    }
  }

  // Update cache
  searchCache = {
    query,
    results,
    timestamp: Date.now(),
  }

  console.log(`Found ${results.length} total files for query:`, query)
  return results
}

/**
 * Clear the search cache (e.g., when settings change)
 */
export function clearSearchCache(): void {
  searchCache = null
}

/**
 * Get DMS configuration from settings form
 * @param settingForm Settings form object
 * @returns DmsConfig
 */
export function getDmsConfigFromSettings(settingForm: any): DmsConfig {
  return {
    erpnext: {
      url: settingForm.erpnextUrl || '',
      apiKey: settingForm.erpnextApiKey || '',
      apiSecret: settingForm.erpnextApiSecret || '',
    },
    googledrive: {
      clientId: settingForm.googleClientId || '',
      apiKey: settingForm.googleApiKey || '',
    },
  }
}
