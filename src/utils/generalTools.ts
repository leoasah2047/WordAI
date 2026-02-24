import { DynamicStructuredTool } from '@langchain/core/tools'
import { evaluate } from 'mathjs'
import { z } from 'zod'

export type GeneralToolName = 'fetchWebContent' | 'searchWeb' | 'getCurrentDate' | 'calculateMath'

export interface GeneralToolDefinition {
  name: GeneralToolName
  description: string
  tool: DynamicStructuredTool
}

const fetchWebContentTool = new DynamicStructuredTool({
  name: 'fetchWebContent',
  description:
    'Fetches content from a given URL. Useful for gathering reference material, quotes, or information to include in the document. Returns the main text content of the webpage.',
  schema: z.object({
    url: z.string().describe('The URL to fetch content from'),
  }),
  func: async ({ url }) => {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      })

      if (!response.ok) {
        return `Failed to fetch content: ${response.status} ${response.statusText}`
      }

      const html = await response.text()

      // Use Readability for high-fidelity extraction
      try {
        const parser = new DOMParser()
        const doc = parser.parseFromString(html, 'text/html')

        // Dynamic import to avoid issues if not fully loaded
        const { Readability } = await import('@mozilla/readability')
        const reader = new Readability(doc)
        const article = reader.parse()

        if (article && article.textContent) {
          const content =
            article.textContent.length > 10000 ? article.textContent.substring(0, 10000) + '...' : article.textContent
          return `Title: ${article.title}\nSource: ${url}\n\n${content}`
        }
      } catch (readabilityError) {
        console.warn('Readability failed, falling back to regex:', readabilityError)
      }

      // Simple but better HTML to Text conversion (Fallback)
      const textContent = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove styles
        .replace(/<head\b[^<]*(?:(?!<\/head>)<[^<]*)*<\/head>/gi, '') // Remove head
        .replace(/<h[1-6][^>]*>/gi, '\n\n# ') // Format headings
        .replace(/<\/h[1-6]>/gi, '\n\n')
        .replace(/<p[^>]*>/gi, '\n\n') // Format paragraphs
        .replace(/<br\s*\/?>/gi, '\n') // Line breaks
        .replace(/<li[^>]*>/gi, '\n* ') // List items
        .replace(/<[^>]+>/g, ' ') // Strip other tags
        .replace(/[ \t]+/g, ' ') // Collapse horizontal whitespace
        .replace(/\n\s*\n\s*\n+/g, '\n\n') // Collapse multiple blank lines
        .trim()

      const maxLength = 8000
      const content = textContent.length > maxLength ? textContent.substring(0, maxLength) + '...' : textContent

      return `Content from ${url}:\n\n${content}`
    } catch (error: any) {
      return `Error fetching content: ${error.message}`
    }
  },
})

const searchWebTool = new DynamicStructuredTool({
  name: 'searchWeb',
  description:
    'Searches the web for information. Returns top search results with titles and snippets. Useful for finding references, facts, or background information for the document. If you need to look up information you do not know, use this tool.',
  schema: z.object({
    query: z.string().describe('The search query'),
    maxResults: z.number().optional().default(10).describe('Maximum number of results to return (default: 10)'),
  }),
  func: async ({ query, maxResults = 10 }) => {
    try {
      const url = `https://ddgs.horosama.com/search/text?query=${encodeURIComponent(query)}&max_results=${maxResults <= 10 ? maxResults : 10}`
      const response = await fetch(url)
      if (!response.ok) {
        return `Search failed: ${response.status}`
      }
      const data = await response.json()
      let results = ''
      data.results.forEach((result: any, index: number) => {
        results += `Result ${index + 1}:\nTitle: ${result.title}\nLink: ${result.href}\nSnippet: ${result.body}\n\n`
      })
      return results
    } catch (error: any) {
      return `Error searching: ${error.message}`
    }
  },
})

const getCurrentDateTool = new DynamicStructuredTool({
  name: 'getCurrentDate',
  description:
    'Returns the current date and time. Useful for adding timestamps, dates to documents, or understanding temporal context.',
  schema: z.object({
    format: z
      .enum(['full', 'date', 'time', 'iso'])
      .optional()
      .default('full')
      .describe('Format: "full" (date and time), "date" (date only), "time" (time only), "iso" (ISO 8601)'),
  }),
  func: async ({ format = 'full' }) => {
    const now = new Date()

    switch (format) {
      case 'date':
        return now.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      case 'time':
        return now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      case 'iso':
        return now.toISOString()
      case 'full':
      default:
        return now.toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
    }
  },
})

const calculateMathTool = new DynamicStructuredTool({
  name: 'calculateMath',
  description:
    'Evaluates mathematical expressions safely. Useful for calculations, statistics, or numerical data in documents. Supports basic arithmetic (+, -, *, /), parentheses, and common math functions.',
  schema: z.object({
    expression: z.string().describe('The mathematical expression to evaluate (e.g., "2 + 2 * 3")'),
  }),
  func: async ({ expression }) => {
    try {
      const result = evaluate(expression)

      if (typeof result !== 'number' && typeof result !== 'bigint') {
        return `Calculation completed, but result is not a simple number: ${result}`
      }

      return `${expression} = ${result}`
    } catch (error: any) {
      return `Error evaluating expression: ${error.message}`
    }
  },
})

export const generalToolDefinitions: GeneralToolDefinition[] = [
  {
    name: 'fetchWebContent',
    description: fetchWebContentTool.description,
    tool: fetchWebContentTool,
  },
  {
    name: 'searchWeb',
    description: searchWebTool.description,
    tool: searchWebTool,
  },
  {
    name: 'getCurrentDate',
    description: getCurrentDateTool.description,
    tool: getCurrentDateTool,
  },
  {
    name: 'calculateMath',
    description: calculateMathTool.description,
    tool: calculateMathTool,
  },
]

export function createGeneralTools(enabledTools?: GeneralToolName[]): DynamicStructuredTool[] {
  if (!enabledTools || enabledTools.length === 0) {
    return generalToolDefinitions.map(def => def.tool)
  }

  return generalToolDefinitions.filter(def => enabledTools.includes(def.name)).map(def => def.tool)
}

export function getGeneralToolDefinitions(): GeneralToolDefinition[] {
  return generalToolDefinitions
}

export function getGeneralTool(name: GeneralToolName): GeneralToolDefinition | undefined {
  return generalToolDefinitions.find(def => def.name === name)
}
