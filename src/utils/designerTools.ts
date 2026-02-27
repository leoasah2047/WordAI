import { tool } from '@langchain/core/tools'
import { z } from 'zod'

export type DesignerToolName = 'generateImage'

const designerToolDefinitions: Record<DesignerToolName, any> = {
  generateImage: {
    name: 'generateImage',
    description:
      'Generate an image based on a text prompt using Google Nano Banana API. Returns a URL to the generated image.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'The detailed description of the image to generate.',
        },
        style: {
          type: 'string',
          description: 'Optional style: "photorealistic", "sketch", "cartoon", "abstract".',
          enum: ['photorealistic', 'sketch', 'cartoon', 'abstract'],
        },
      },
      required: ['prompt'],
    },
    execute: async (args: any) => {
      const { prompt, style = 'photorealistic' } = args
      try {
        // Import dynamically to avoid circular dependencies if any, though apiClient is safe
        const { apiClient } = await import('@/utils/apiClient')
        const { default: useSettingForm } = await import('@/utils/settingForm')
        const settings = useSettingForm()
        const model = settings.value.geminiModelSelect || 'gemini-3.1-flash-image-preview'

        const result = await apiClient.post<any>('/generate-image', {
          prompt,
          style,
          aspect_ratio: '1:1',
          model,
        })

        if (result.image_url) {
          // Return a marker that HomePage can parse
          return `<<<IMAGE_GENERATED>>>${JSON.stringify({
            image_url: result.image_url,
            prompt: result.prompt || prompt,
          })}<<<END_IMAGE>>>`
        }
        return 'Failed to generate image: No URL returned.'
      } catch (error: any) {
        console.error('Image generation error:', error)
        return `Error generating image: ${error.message || 'Unknown error'}`
      }
    },
  },
}

export const createDesignerTools = () => {
  const tools = []

  for (const definition of Object.values(designerToolDefinitions)) {
    tools.push(
      tool(definition.execute, {
        name: definition.name,
        description: definition.description,
        schema: z.object({
          prompt: z.string().describe('The detailed description of the image to generate.'),
          style: z.string().optional().describe('Optional style: "photorealistic", "sketch", "cartoon", "abstract".'),
        }),
      }),
    )
  }

  return tools
}
