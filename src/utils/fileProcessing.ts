// ============ Unified DMS Abstraction ============

export type DmsProviderType = 'erpnext' | 'googledrive'

export interface DmsFile {
  id: string
  name: string
  url: string
  size: number
  provider: DmsProviderType
  originalData?: any // Store original file object from provider
  isFolder?: boolean
}

export interface DmsConfig {
  erpnext?: ErpNextConfig
  googledrive?: GoogleDriveConfig
}

export interface GoogleDriveConfig {
  clientId: string
  apiKey: string
}

// ============ ERPNext API Client ============

export interface ErpNextFile {
  name: string
  file_name: string
  file_url: string
  is_private: number
  file_size: number
  attached_to_doctype?: string
  attached_to_name?: string
}

export interface ErpNextConfig {
  url: string
  apiKey: string
  apiSecret: string
}

/**
 * Creates authorization header for ERPNext API
 */
function getAuthHeader(config: ErpNextConfig): string {
  return `token ${config.apiKey}:${config.apiSecret}`
}

/**
 * Search files in ERPNext
 */
export async function searchErpNextFiles(
  config: ErpNextConfig,
  searchTerm: string = '',
  fileTypes: string[] = ['pdf', 'docx', 'doc'],
  limit: number = 20,
): Promise<ErpNextFile[]> {
  const baseUrl = config.url.replace(/\/$/, '')

  // Build filters for file types
  const typeFilters = fileTypes.map(ext => `["file_name", "like", "%.${ext}"]`).join(',')
  let filters = `[${typeFilters}]`

  if (searchTerm) {
    filters = `[["file_name", "like", "%${searchTerm}%"]]`
  }

  const params = new URLSearchParams({
    doctype: 'File',
    fields: JSON.stringify([
      'name',
      'file_name',
      'file_url',
      'is_private',
      'file_size',
      'attached_to_doctype',
      'attached_to_name',
    ]),
    filters,
    limit_page_length: String(limit),
  })

  const response = await fetch(`${baseUrl}/api/resource/File?${params}`, {
    method: 'GET',
    headers: {
      Authorization: getAuthHeader(config),
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`ERPNext API Error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data.data || []
}

/**
 * Download a file from ERPNext and return as ArrayBuffer
 */
export async function downloadErpNextFile(config: ErpNextConfig, fileUrl: string): Promise<ArrayBuffer> {
  const baseUrl = config.url.replace(/\/$/, '')
  const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${baseUrl}${fileUrl}`

  const response = await fetch(fullUrl, {
    method: 'GET',
    headers: {
      Authorization: getAuthHeader(config),
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.status}`)
  }

  return response.arrayBuffer()
}

// ============ Google Drive API Client ============

let gapiInitialized = false
let tokenClient: any = null

/**
 * Load Google API scripts
 */
export async function loadGoogleApi(): Promise<void> {
  if (gapiInitialized) return

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://apis.google.com/js/api.js'
    script.onload = () => {
      const gapi = (window as any).gapi
      gapi.load('client:picker', async () => {
        gapiInitialized = true
        resolve()
      })
    }
    script.onerror = reject
    document.head.appendChild(script)

    const gisScript = document.createElement('script')
    gisScript.src = 'https://accounts.google.com/gsi/client'
    gisScript.onload = () => {
      // Identity Services loaded
    }
    document.head.appendChild(gisScript)
  })
}

/**
 * Initialize Google OAuth token client
 */
export function initTokenClient(config: GoogleDriveConfig, callback: (token: any) => void) {
  const google = (window as any).google
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: config.clientId,
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    callback,
  })
  return tokenClient
}

/**
 * Trigger access token request
 */
export function requestAccessToken() {
  if (tokenClient) {
    tokenClient.requestAccessToken()
  }
}

/**
 * Request access token
 */
export async function getAccessToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!tokenClient) return reject(new Error('Token client not initialized'))

    tokenClient.callback = (resp: any) => {
      if (resp.error !== undefined) {
        reject(resp)
      }
      resolve(resp.access_token)
    }
    tokenClient.requestAccessToken({ prompt: 'consent' })
  })
}

/**
 * Download a file from Google Drive and return as ArrayBuffer
 */
export async function downloadGoogleDriveFile(fileId: string, accessToken: string): Promise<ArrayBuffer> {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to download Google Drive file: ${response.status}`)
  }

  return response.arrayBuffer()
}

/**
 * Search files in Google Drive
 */
export async function searchGoogleDriveFiles(
  accessToken: string,
  searchTerm: string = '',
  limit: number = 20,
): Promise<DmsFile[]> {
  const query = searchTerm
    ? `name contains '${searchTerm}' and (mimeType = 'application/vnd.google-apps.folder' or mimeType = 'application/pdf' or mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' or mimeType = 'text/plain') and trashed = false`
    : `(mimeType = 'application/vnd.google-apps.folder' or mimeType = 'application/pdf' or mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' or mimeType = 'text/plain') and trashed = false`

  const params = new URLSearchParams({
    q: query,
    pageSize: String(limit),
    fields: 'files(id, name, mimeType, size, webViewLink)',
  })

  const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Google Drive API Error: ${response.status}`)
  }

  const data = await response.json()
  return (data.files || []).map((file: any) => ({
    id: file.id,
    name: file.name,
    url: file.webViewLink,
    size: parseInt(file.size) || 0,
    provider: 'googledrive',
    isFolder: file.mimeType === 'application/vnd.google-apps.folder',
    originalData: file,
  }))
}

/**
 * List files inside a Google Drive folder
 */
export async function listGoogleDriveFolderFiles(accessToken: string, folderId: string): Promise<DmsFile[]> {
  const params = new URLSearchParams({
    q: `'${folderId}' in parents and (mimeType != 'application/vnd.google-apps.folder') and trashed = false`,
    fields: 'files(id, name, mimeType, size, webViewLink)',
  })

  const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Google Drive API Error: ${response.status}`)
  }

  const data = await response.json()
  return (data.files || []).map((file: any) => ({
    id: file.id,
    name: file.name,
    url: file.webViewLink,
    size: parseInt(file.size) || 0,
    provider: 'googledrive',
    isFolder: false,
    originalData: file,
  }))
}

// ============ Document Text Extraction ============

export interface ExtractedContent {
  text: string
  images: ExtractedImage[]
}

export interface ExtractedImage {
  id: string
  name: string
  data: string // base64
  width?: number
  height?: number
  pageNumber?: number
}

/**
 * Perform AI-powered OCR via backend
 */
async function performAiOcr(imageBase64: string, filename: string): Promise<string> {
  try {
    const response = await fetch('/api/v1/ocr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_base64: imageBase64,
        filename,
      }),
    })

    if (!response.ok) {
      throw new Error(`OCR API Error: ${response.status}`)
    }

    const data = await response.json()
    return data.text || ''
  } catch (error) {
    console.error('AI OCR direct call failed:', error)
    return ''
  }
}

/**
 * Extract text and images from a PDF file
 */
export async function extractPdfContent(
  arrayBuffer: ArrayBuffer,
  fileName: string,
  options: { ocrEnabled?: boolean } = {},
): Promise<ExtractedContent> {
  const scribe = (await import('scribe.js-ocr')).default
  const pdfjsLib = await import('pdfjs-dist')

  // Initialize PDF.js worker using a local path (handled by Vite)
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    // pdf.worker.min.mjs is available in pdfjs-dist/build/
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href
  }

  // Use scribe.js-ocr for high-quality text extraction (including OCR for scanned PDFs)
  let fullText = ''
  try {
    // scribe.extractText takes an array of file objects
    const scribeResult = await scribe.extractText([{ data: arrayBuffer, name: fileName }], ['eng'], 'txt', {
      skipRecPDFTextNative: false, // Extract native text if available
      skipRecPDFTextOCR: false, // Perform OCR if needed
    })
    fullText = typeof scribeResult === 'string' ? scribeResult : String(scribeResult)
  } catch (error) {
    console.error('Scribe OCR failed, falling back to basic PDF.js extraction:', error)
  }

  // Use PDF.js to extract images and as a fallback for text if scribe failed
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const numPages = pdf.numPages
  const images: ExtractedImage[] = []

  if (!fullText) {
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map((item: any) => item.str).join(' ')
      fullText += pageText + '\n\n'
    }
  }

  // Extract images using PDF.js and perform OCR fallback if needed
  for (let i = 1; i <= numPages; i++) {
    try {
      const page = await pdf.getPage(i)
      const operatorList = await page.getOperatorList()

      // If page has no text or is very short, it might be a scan. Flag for OCR.
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map((item: any) => item.str).join(' ')
      const isLikelyScan = pageText.trim().length < 50

      for (let j = 0; j < operatorList.fnArray.length; j++) {
        if (operatorList.fnArray[j] === pdfjsLib.OPS.paintImageXObject) {
          const imgName = operatorList.argsArray[j][0]
          try {
            const img = await page.objs.get(imgName)
            if (img && img.data) {
              const canvas = document.createElement('canvas')
              canvas.width = img.width
              canvas.height = img.height
              const ctx = canvas.getContext('2d')
              if (ctx) {
                const imageData = ctx.createImageData(img.width, img.height)
                imageData.data.set(img.data)
                ctx.putImageData(imageData, 0, 0)
                const base64Data = canvas.toDataURL('image/png').split(',')[1]
                const imgId = `img_${fileName.replace(/[^a-zA-Z0-9]/g, '_')}_p${i}_${j}`

                images.push({
                  id: imgId,
                  name: `${fileName} - Page ${i} Image ${j}`,
                  data: base64Data,
                  width: img.width,
                  height: img.height,
                  pageNumber: i,
                })

                // If it's a scan or text extraction failed, perform AI OCR on this image
                if (isLikelyScan && options.ocrEnabled) {
                  try {
                    const aiOcrResult = await performAiOcr(base64Data, `${fileName}_p${i}_img${j}`)
                    if (aiOcrResult) {
                      fullText += `\n\n--- OCR Results (Page ${i}, Image ${j}) ---\n${aiOcrResult}\n`
                    }
                  } catch (ocrErr) {
                    console.error('AI OCR Fallback failed:', ocrErr)
                  }
                }
              }
            }
          } catch {
            // Skip images that can't be extracted
          }
        }
      }
    } catch {
      // Continue without images if extraction fails
    }
  }

  return { text: fullText.trim(), images }
}

/**
 * Extract text and images from a DOCX file
 */
export async function extractDocxContent(arrayBuffer: ArrayBuffer, fileName: string): Promise<ExtractedContent> {
  const mammoth = await import('mammoth')
  const images: ExtractedImage[] = []

  // Extract text with mammoth
  const result = await mammoth.extractRawText({ arrayBuffer })
  const text = result.value

  // Extract images
  try {
    const imageResult = await mammoth.convertToHtml({ arrayBuffer })
    // Parse HTML for base64 images
    const imgRegex = /<img[^>]+src="data:image\/([^;]+);base64,([^"]+)"[^>]*>/g
    let match
    let count = 0
    while ((match = imgRegex.exec(imageResult.value)) !== null) {
      count++
      const data = match[2]
      images.push({
        id: `img_${fileName.replace(/[^a-zA-Z0-9]/g, '_')}_${count}`,
        name: `${fileName} - Image ${count}`,
        data,
      })
    }
  } catch {
    // Continue without images
  }

  return { text, images }
}

/**
 * Extract text from an XLSX file
 */
export async function extractXlsxContent(arrayBuffer: ArrayBuffer, fileName: string): Promise<ExtractedContent> {
  try {
    const XLSX = await import('xlsx')
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    let text = ''

    workbook.SheetNames.forEach((sheetName: string) => {
      const worksheet = workbook.Sheets[sheetName]
      text += `\n--- Sheet: ${sheetName} ---\n`
      text += XLSX.utils.sheet_to_txt(worksheet)
    })

    return { text: text.trim(), images: [] }
  } catch (error) {
    console.error('Failed to extract XLSX content:', error)
    return {
      text: `[Error: Failed to extract content from ${fileName}. Ensure 'xlsx' library is installed.]`,
      images: [],
    }
  }
}

/**
 * Auto-detect file type and extract content
 */
export async function extractFileContent(
  arrayBuffer: ArrayBuffer,
  fileName: string,
  options: { ocrEnabled?: boolean } = {},
): Promise<ExtractedContent> {
  const extension = fileName.toLowerCase().split('.').pop()

  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(extension || '')) {
    // Handle standalone image
    const uint8Array = new Uint8Array(arrayBuffer)
    let binary = ''
    for (let i = 0; i < uint8Array.byteLength; i++) {
      binary += String.fromCharCode(uint8Array[i])
    }
    const base64 = btoa(binary)

    let extractedText = `[Image File: ${fileName}]`

    // Extract text from image via OCR if enabled
    if (options.ocrEnabled) {
      try {
        const scribe = (await import('scribe.js-ocr')).default
        const scribeResult = await scribe.extractText([{ data: arrayBuffer, name: fileName }], ['eng'], 'txt')
        if (scribeResult) {
          extractedText = typeof scribeResult === 'string' ? scribeResult : String(scribeResult)
        }
      } catch (error) {
        console.error('Scribe Image OCR failed:', error)
        extractedText += '\n[OCR Failed]'
      }
    }

    return {
      text: extractedText,
      images: [
        {
          id: `img_${fileName.replace(/[^a-zA-Z0-9]/g, '_')}`,
          name: fileName,
          data: base64,
        },
      ],
    }
  }

  switch (extension) {
    case 'pdf':
      return extractPdfContent(arrayBuffer, fileName, options)
    case 'docx':
    case 'doc':
      return extractDocxContent(arrayBuffer, fileName)
    case 'xlsx':
    case 'xls':
    case 'csv':
      return extractXlsxContent(arrayBuffer, fileName)
    default:
      // Try to read as text
      const decoder = new TextDecoder('utf-8')
      return {
        text: decoder.decode(arrayBuffer),
        images: [],
      }
  }
}

/**
 * Download a file from any supported DMS
 */
export async function downloadFile(
  config: DmsConfig,
  file: { id: string; url: string; provider: DmsProviderType },
  accessToken?: string,
): Promise<ArrayBuffer> {
  if (file.provider === 'googledrive') {
    if (!accessToken) throw new Error('Access token required for Google Drive')
    return downloadGoogleDriveFile(file.id, accessToken)
  } else {
    if (!config.erpnext) throw new Error('ERPNext config required')
    return downloadErpNextFile(config.erpnext, file.url)
  }
}

/**
 * Process multiple files and combine their content
 */
export async function processMultipleFiles(
  config: DmsConfig,
  files: DmsFile[],
  googleAccessToken?: string,
  options: { ocrEnabled?: boolean } = {},
): Promise<{ combinedText: string; allImages: ExtractedImage[]; fileContents: Record<string, ExtractedContent> }> {
  const fileContents: Record<string, ExtractedContent> = {}
  let combinedText = ''
  const allImages: ExtractedImage[] = []

  for (const file of files) {
    try {
      const arrayBuffer = await downloadFile(config, file, googleAccessToken)
      const content = await extractFileContent(arrayBuffer, file.name, options)

      fileContents[file.name] = content
      combinedText += `\n\n=== ${file.name} ===\n${content.text}`
      allImages.push(...content.images)
    } catch (error) {
      console.error(`Failed to process file ${file.name}:`, error)
      fileContents[file.name] = { text: `[Error extracting content from ${file.name}]`, images: [] }
    }
  }

  return { combinedText: combinedText.trim(), allImages, fileContents }
}
