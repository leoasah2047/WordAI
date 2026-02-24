export interface WritingTemplate {
  id: string
  name: string
  description: string
  icon: string // lucide icon name
  category: string
  inputs: {
    key: string
    label: string
    placeholder: string
    type: 'text' | 'textarea'
  }[]
  promptTemplate: (inputs: Record<string, string>) => string
}
