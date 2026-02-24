import { useStorage } from '@vueuse/core'

export interface TypesetStyle {
  name?: string // Display name if custom
  fontName?: string
  fontSize?: number
  color?: string
  bold?: boolean
  italic?: boolean
  alignment?: 'Left' | 'Center' | 'Right' | 'Justify'
  spacingBefore?: number
  spacingAfter?: number
  lineSpacing?: number
  outlineLevel?: number // 0-9 (0 is body text, 1-9 are levels)
}

export interface TypesetTemplate {
  id: string
  name: string
  description: string
  isCustom?: boolean
  westernFont?: string // Global override for western font
  pageMargins?: 'Narrow' | 'Normal' | 'Wide'
  orientation?: 'Portrait' | 'Landscape'
  styles: {
    Normal: TypesetStyle
    Heading1: TypesetStyle
    Heading2: TypesetStyle
    Heading3: TypesetStyle
    [key: string]: TypesetStyle // Allow dynamic styles
  }
}

export const defaultTemplates: TypesetTemplate[] = [
  {
    id: 'modern_clean',
    name: 'Modern Clean',
    description: 'A clean, sans-serif look perfect for startups and digital reports.',
    styles: {
      Normal: {
        fontName: 'Calibri',
        fontSize: 11,
        color: '#333333',
        alignment: 'Left',
        lineSpacing: 1.15,
        spacingAfter: 10,
        outlineLevel: 0,
      },
      Heading1: {
        fontName: 'Segoe UI',
        fontSize: 24,
        color: '#2c3e50',
        bold: true,
        spacingBefore: 24,
        spacingAfter: 12,
        outlineLevel: 1,
      },
      Heading2: {
        fontName: 'Segoe UI',
        fontSize: 18,
        color: '#34495e',
        bold: true,
        spacingBefore: 18,
        spacingAfter: 10,
        outlineLevel: 2,
      },
      Heading3: {
        fontName: 'Segoe UI',
        fontSize: 14,
        color: '#7f8c8d',
        bold: true,
        spacingBefore: 12,
        spacingAfter: 6,
        outlineLevel: 3,
      },
    },
  },
  {
    id: 'formal_legal',
    name: 'Formal Legal',
    description: 'Serif fonts and strict formatting for contracts and legal briefs.',
    westernFont: 'Times New Roman',
    styles: {
      Normal: {
        fontName: 'Times New Roman',
        fontSize: 12,
        color: '#000000',
        alignment: 'Justify',
        lineSpacing: 1.5,
        spacingAfter: 0,
        outlineLevel: 0,
      },
      Heading1: {
        fontName: 'Times New Roman',
        fontSize: 14,
        color: '#000000',
        bold: true,
        alignment: 'Center',
        spacingBefore: 12,
        spacingAfter: 12,
        outlineLevel: 1,
      },
      Heading2: {
        fontName: 'Times New Roman',
        fontSize: 12,
        color: '#000000',
        bold: true,
        italic: true,
        spacingBefore: 12,
        spacingAfter: 6,
        outlineLevel: 2,
      },
      Heading3: {
        fontName: 'Times New Roman',
        fontSize: 12,
        color: '#000000',
        italic: true,
        spacingBefore: 6,
        spacingAfter: 6,
        outlineLevel: 3,
      },
    },
  },
  {
    id: 'academic_paper',
    name: 'Academic Paper',
    description: 'Standard academic formatting (APA style inspired).',
    styles: {
      Normal: {
        fontName: 'Arial',
        fontSize: 11,
        color: '#000000',
        alignment: 'Left',
        lineSpacing: 2.0, // Double spacing
        outlineLevel: 0,
      },
      Heading1: {
        fontName: 'Arial',
        fontSize: 11,
        color: '#000000',
        bold: true,
        alignment: 'Center',
        outlineLevel: 1,
      },
      Heading2: {
        fontName: 'Arial',
        fontSize: 11,
        color: '#000000',
        bold: true,
        alignment: 'Left',
        outlineLevel: 2,
      },
      Heading3: {
        fontName: 'Arial',
        fontSize: 11,
        color: '#000000',
        bold: true,
        italic: true,
        outlineLevel: 3,
      },
    },
  },
]

// State for managing custom templates
export const customTemplates = useStorage<TypesetTemplate[]>('customTypesetTemplates', [])
