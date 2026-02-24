import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as fileProcessing from './fileProcessing'
import { clearSearchCache, getDmsConfigFromSettings, searchFiles } from './homeFileSearch'

vi.mock('./fileProcessing', () => ({
  searchErpNextFiles: vi.fn(),
  searchGoogleDriveFiles: vi.fn(),
  loadGoogleApi: vi.fn(),
  initTokenClient: vi.fn(),
  getAccessToken: vi.fn(),
}))

describe('homeFileSearch', () => {
  const mockConfig = {
    erpnext: { url: 'http://erp.com', apiKey: 'key', apiSecret: 'secret' },
    googledrive: { clientId: 'client', apiKey: 'gkey' },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    clearSearchCache()
  })

  it('searches ERPNext files', async () => {
    vi.mocked(fileProcessing.searchErpNextFiles).mockResolvedValue([
      { name: 'F1', file_name: 'File 1', file_url: '/url', file_size: 100 },
    ] as any)

    const results = await searchFiles('test', {
      erpnext: mockConfig.erpnext,
      googledrive: { clientId: '', apiKey: '' },
    })

    expect(results).toHaveLength(1)
    expect(results[0].name).toBe('File 1')
    expect(fileProcessing.searchErpNextFiles).toHaveBeenCalled()
  })

  it('uses cache for subsequent searches', async () => {
    vi.mocked(fileProcessing.searchErpNextFiles).mockResolvedValue([])
    vi.mocked(fileProcessing.searchGoogleDriveFiles).mockResolvedValue([])

    await searchFiles('test', mockConfig)
    await searchFiles('test', mockConfig)

    expect(fileProcessing.searchErpNextFiles).toHaveBeenCalledTimes(1)
  })

  it('getDmsConfigFromSettings maps fields correctly', () => {
    const form = {
      erpnextUrl: 'url',
      erpnextApiKey: 'key',
      erpnextApiSecret: 'sec',
      googleClientId: 'cid',
      googleApiKey: 'gak',
    }
    const config = getDmsConfigFromSettings(form)
    expect(config.erpnext.url).toBe('url')
    expect(config.googledrive.clientId).toBe('cid')
  })
})
