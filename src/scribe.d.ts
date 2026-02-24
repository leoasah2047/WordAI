declare module 'scribe.js-ocr' {
  interface ScribeFile {
    data: ArrayBuffer | Uint8Array | Blob | File
    name: string
  }

  interface ScribeOptions {
    skipRecPDFTextNative?: boolean
    skipRecPDFTextOCR?: boolean
    xmlMode?: boolean
    imageMode?: boolean
    pdfMode?: boolean
  }

  interface Scribe {
    extractText(files: ScribeFile[], langs?: string[], outputFormat?: string, options?: ScribeOptions): Promise<string>
    init(params?: { pdf?: boolean; ocr?: boolean; font?: boolean }): Promise<void>
    terminate(): Promise<void>
  }

  const scribe: Scribe
  export default scribe
}
