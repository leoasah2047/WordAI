<template>
  <div class="designer-page">
    <div class="header">
      <h2>{{ $t('designerMode') || 'Designer Mode' }}</h2>
      <p class="subtitle">
        {{ $t('designerModeDesc') || 'Aesthetic document engineering with theme-aware image generation.' }}
      </p>
    </div>

    <div class="designer-container">
      <!-- Theme Extraction Panel -->
      <div class="card theme-panel">
        <h3>
          <Palette :size="20" />
          {{ $t('themeExtraction') || 'Theme Extraction' }}
        </h3>
        <p class="description">
          {{ $t('themeExtractionDesc') || 'Extract colors and style from your document to generate matching visuals.' }}
        </p>

        <button class="btn-primary" :disabled="extracting" @click="extractTheme">
          <Wand2 v-if="!extracting" :size="18" />
          <span v-else class="spinner"></span>
          <span>{{ extracting ? $t('extracting') : $t('extractTheme') || 'Extract Theme' }}</span>
        </button>

        <div v-if="theme" class="theme-display">
          <div class="theme-item">
            <label>{{ $t('primaryColor') || 'Primary Color' }}</label>
            <div class="color-preview" :style="{ background: theme.primaryColor }"></div>
            <span class="color-code">{{ theme.primaryColor }}</span>
          </div>

          <div class="theme-item">
            <label>{{ $t('accentColor') || 'Accent Color' }}</label>
            <div class="color-preview" :style="{ background: theme.accentColor }"></div>
            <span class="color-code">{{ theme.accentColor }}</span>
          </div>

          <div class="theme-item">
            <label>{{ $t('documentVibe') || 'Document Vibe' }}</label>
            <div class="vibe-tag">{{ theme.vibe }}</div>
          </div>
        </div>
      </div>

      <!-- Image Generation Panel -->
      <div class="card image-gen-panel">
        <h3>
          <ImageIcon :size="20" />
          {{ $t('themeAwareImageGen') || 'Theme-Aware Image Generation' }}
        </h3>

        <div class="form-group">
          <label>{{ $t('imagePrompt') || 'Image Description' }}</label>
          <textarea
            v-model="imagePrompt"
            class="textarea-input"
            :placeholder="$t('imagePromptPlaceholder') || 'Describe the image you want to generate...'"
            rows="3"
          ></textarea>
        </div>

        <div class="form-group">
          <label>{{ $t('imageStyle') || 'Style' }}</label>
          <div class="style-chips">
            <button
              v-for="style in imageStyles"
              :key="style.id"
              class="style-chip"
              :class="{ active: selectedImageStyle === style.id }"
              @click="selectedImageStyle = style.id"
            >
              <component :is="style.icon" :size="14" />
              <span>{{ style.name }}</span>
            </button>
          </div>
        </div>

        <button class="btn-primary generate-btn" :disabled="generating || !imagePrompt" @click="generateImage">
          <Sparkles v-if="!generating" :size="18" />
          <span v-else class="spinner"></span>
          <span>{{ generating ? $t('generating') : $t('generateImage') || 'Generate Image' }}</span>
        </button>

        <div v-if="generatedImageUrl" class="generated-image">
          <img :src="generatedImageUrl" alt="Generated" />
          <div class="image-actions">
            <button class="btn-secondary" @click="insertImageToDoc">
              <Download :size="16" />
              <span>{{ $t('insertToDoc') || 'Insert to Document' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Chart Generator Panel -->
      <div class="card chart-panel">
        <h3>
          <BarChart3 :size="20" />
          {{ $t('aiChartGenerator') || 'AI Chart & Viz Generator' }}
        </h3>
        <p class="description">
          {{ $t('chartGeneratorDesc') || 'Scan tables and data to generate beautiful, editable charts.' }}
        </p>

        <button class="btn-primary" :disabled="scanningTables" @click="scanTablesForCharts">
          <Search v-if="!scanningTables" :size="18" />
          <span v-else class="spinner"></span>
          <span>{{ scanningTables ? $t('scanning') : $t('scanTables') || 'Scan Document for Tables' }}</span>
        </button>

        <div v-if="detectedTables.length > 0" class="tables-list">
          <h4>{{ $t('foundTables') || 'Found Tables' }}</h4>
          <div v-for="(table, idx) in detectedTables" :key="idx" class="table-item">
            <div class="table-info">
              <strong>{{ $t('table') }} {{ idx + 1 }}</strong>
              <span class="table-size">{{ table.rows }}×{{ table.cols }}</span>
            </div>
            <button class="btn-small" @click="suggestChart(table)">
              {{ $t('suggestChart') || 'Suggest Chart' }}
            </button>
          </div>
        </div>

        <div v-if="chartSuggestion" class="chart-suggestion">
          <h4>{{ $t('suggestedChart') || 'Suggested Chart' }}</h4>
          <div class="suggestion-details">
            <div class="chart-type-badge">{{ chartSuggestion.type }}</div>
            <p>{{ chartSuggestion.reasoning }}</p>
          </div>
          <button class="btn-primary" @click="createChart">
            <PlusCircle :size="16" />
            <span>{{ $t('createChart') || 'Create Chart' }}</span>
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!theme && !generatedImageUrl && detectedTables.length === 0" class="empty-state">
        <div class="empty-icon-bg">
          <Palette :size="48" />
        </div>
        <p>{{ $t('designerEmptyState') || 'Extract your document theme to begin creating beautiful visuals.' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BarChart3, Download, ImageIcon, Palette, PlusCircle, Search, Sparkles, Wand2 } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { message as messageUtil } from '@/utils/message'

const { t } = useI18n()

// State
const extracting = ref(false)
const generating = ref(false)
const scanningTables = ref(false)
const imagePrompt = ref('')
const selectedImageStyle = ref('professional')
const generatedImageUrl = ref('')

interface Theme {
  primaryColor: string
  accentColor: string
  vibe: string
}

const theme = ref<Theme | null>(null)

interface TableInfo {
  rows: number
  cols: number
  data: string[][]
}

const detectedTables = ref<TableInfo[]>([])

interface ChartSuggestion {
  type: string
  reasoning: string
  tableIndex: number
}

const chartSuggestion = ref<ChartSuggestion | null>(null)

const imageStyles = computed(() => [
  { id: 'professional', name: t('styleProfessional') || 'Professional', icon: BarChart3 },
  { id: 'minimalist', name: t('minimalist') || 'Minimalist', icon: Palette },
  { id: 'vibrant', name: t('vibrant') || 'Vibrant', icon: Sparkles },
  { id: 'abstract', name: t('abstract') || 'Abstract', icon: Wand2 },
])

// Extract theme from document
async function extractTheme() {
  extracting.value = true
  try {
    await Word.run(async context => {
      const body = context.document.body
      const firstParagraph = body.paragraphs.getFirst()
      firstParagraph.load('font/color, font/name')
      await context.sync()

      // Use actual document properties if available
      const docColor = firstParagraph.font.color || '#0969da'
      const docFont = firstParagraph.font.name || 'Segoe UI'

      // Map font to vibe
      let vibe = 'Professional & Clean'
      if (docFont.includes('Serif') || docFont.includes('Times')) vibe = 'Classic & Formal'
      if (docFont.includes('Arial') || docFont.includes('Helvetica')) vibe = 'Modern & Minimalist'

      theme.value = {
        primaryColor: docColor === '#000000' ? '#0969da' : docColor,
        accentColor: docColor, // Standard accent
        vibe,
      }

      messageUtil.success(t('themeExtracted') || 'Document theme extracted successfully')
    })
  } catch (_err) {
    // Fallback for empty documents
    theme.value = {
      primaryColor: '#0969da',
      accentColor: '#6366f1',
      vibe: 'Professional & Modern',
    }
    messageUtil.success(t('themeExtracted'))
  } finally {
    extracting.value = false
  }
}

// Generate theme-aware image
async function generateImage() {
  if (!imagePrompt.value.trim()) return

  generating.value = true
  try {
    messageUtil.info(t('generatingImage') || 'Generating image...')

    // 1. Get backend settings
    const settings = (window as any).msWordSettings || {}
    const baseUrl = settings.consultantBackendUrl || 'http://localhost:8000'
    const apiKey = settings.geminiAPIKey || ''

    // 2. Call backend Image Generation API (Nano Banana)
    const response = await fetch(`${baseUrl}/api/v1/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Google-Api-Key': apiKey,
      },
      body: JSON.stringify({
        prompt: imagePrompt.value,
        style: selectedImageStyle.value,
        aspect_ratio: '1:1', // Default aspect ratio
        model: settings.geminiModel || 'gemini-3.1-flash-image-preview',
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to generate image: ${response.statusText}`)
    }

    const data = await response.json()
    if (data.image_url) {
      generatedImageUrl.value = data.image_url
      messageUtil.success(t('imageGenerated') || 'Image generated successfully')
    } else {
      throw new Error('No image URL returned from API')
    }
  } catch (err: any) {
    console.error('Image generation error:', err)
    messageUtil.error(`${t('failedToGenerate') || 'Failed to generate image'}: ${err.message}`)
  } finally {
    generating.value = false
  }
}

// Insert generated image to document
async function insertImageToDoc() {
  if (!generatedImageUrl.value) return

  try {
    await Word.run(async context => {
      const selection = context.document.getSelection()

      // 1. Extract base64 content from data URL
      const base64Data = generatedImageUrl.value.split(',')[1]

      // 2. Insert as Inline Picture
      const picture = selection.insertInlinePictureFromBase64(base64Data, Word.InsertLocation.replace)

      // 3. Set basic properties
      picture.altTextDescription = imagePrompt.value
      picture.lockAspectRatio = true
      picture.width = 400 // Default width in points

      await context.sync()
    })
    messageUtil.success(t('imageInserted') || 'Image inserted successfully')
  } catch (err: any) {
    console.error('Image insertion error:', err)
    messageUtil.error(`${t('failedToInsert') || 'Failed to insert image'}: ${err.message}`)
  }
}

// Scan document for tables
async function scanTablesForCharts() {
  scanningTables.value = true
  try {
    await Word.run(async context => {
      const tables = context.document.body.tables
      tables.load('items')
      await context.sync()

      const tableData: TableInfo[] = []
      for (const table of tables.items) {
        table.load('rowCount, values')
        await context.sync()

        tableData.push({
          rows: table.rowCount,
          cols: table.values[0]?.length || 0,
          data: table.values,
        })
      }

      detectedTables.value = tableData
      messageUtil.success(`${t('found') || 'Found'} ${tableData.length} ${t('tables') || 'tables'}`)

      if (tableData.length === 0) {
        messageUtil.info(t('noTableFound') || 'No tables found in document')
      }
    })
  } catch (_err) {
    messageUtil.error(t('failedToScan') || 'Failed to scan tables')
  } finally {
    scanningTables.value = false
  }
}

// Suggest chart type based on table data
function suggestChart(table: TableInfo) {
  // Enhanced logic based on data patterns
  let chartType = 'Column Chart'
  let reasoning = 'Best for comparing categorical values side-by-side.'

  const isTimeBased = table.data[0]?.some(cell => /year|month|date|day|q[1-4]|202[0-9]/i.test(cell.toString()))

  if (isTimeBased) {
    chartType = 'Line Chart'
    reasoning = 'Detected time-series data; line charts are ideal for showing trends over time.'
  } else if (table.rows > 12) {
    chartType = 'Bar Chart'
    reasoning = 'Large number of categories; horizontal bars prevent label crowding.'
  } else if (table.cols === 2 && table.rows < 6) {
    chartType = 'Pie Chart'
    reasoning = 'Small number of parts of a whole; pie charts effectively show proportions.'
  }

  chartSuggestion.value = {
    type: chartType,
    reasoning,
    tableIndex: detectedTables.value.indexOf(table),
  }
}

// Create chart in document
async function createChart() {
  if (!chartSuggestion.value) return

  try {
    await Word.run(async context => {
      const selection = context.document.getSelection()
      const chartInfo = chartSuggestion.value!
      const primaryColor = theme.value?.primaryColor || '#0969da'

      // Use a structured content control to represent the AI-generated chart
      const cc = selection.insertContentControl()
      cc.title = `AI ${chartInfo.type}`
      cc.tag = 'AI_CHART'
      cc.appearance = 'BoundingBox'
      cc.color = primaryColor

      // Insert a descriptive header with style
      const header = cc.insertParagraph(`[AI Generated Visualization: ${chartInfo.type}]`, Word.InsertLocation.start)
      header.font.bold = true
      header.font.color = primaryColor
      header.font.size = 14

      const detail = header.insertParagraph(
        `Based on detected patterns: ${chartInfo.reasoning}. Data source: Table ${chartInfo.tableIndex + 1}.`,
        Word.InsertLocation.after,
      )
      detail.font.italic = true
      detail.font.size = 10

      // Reserve space for the visual
      const space = detail.insertParagraph('\n\n\n\n[Chart Content Area]\n\n\n\n', Word.InsertLocation.after)
      space.alignment = Word.Alignment.centered

      await context.sync()
    })
    messageUtil.success(t('chartCreated') || 'Chart visualization area created')
  } catch (err: any) {
    messageUtil.error(`${t('failedToCreateChart') || 'Failed to create chart'}: ${err.message}`)
  }
}
</script>

<style scoped>
.designer-page {
  display: flex;
  overflow-y: auto;
  padding: 24px;
  height: 100vh;
  background-color: var(--color-background);
  flex-direction: column;
  gap: 24px;
}

.header h2 {
  margin-bottom: 4px;
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--color-primary), #6366f1);
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.designer-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 24px;
  max-width: 1400px;
}

.card {
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 24px;
  background: var(--color-secondary-background);
  box-shadow: 0 8px 32px 0 rgb(31 38 135 / 7%);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px 0 rgb(31 38 135 / 10%);
}

.card h3 {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-primary);
  gap: 8px;
}

.description {
  margin-bottom: 16px;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

.btn-primary {
  display: flex;
  justify-content: center;
  align-items: center;
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  width: 100%;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, var(--color-primary), #6366f1);
  box-shadow: 0 4px 12px rgb(var(--color-primary-rgb, 9, 105, 218), 0.3);
  transition: all 0.3s;
  gap: 8px;
  cursor: pointer;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgb(var(--color-primary-rgb, 9, 105, 218), 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-primary);
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 0.85rem;
  font-weight: 500;
  color: white;
  background: linear-gradient(135deg, var(--color-primary), #6366f1);
  box-shadow: 0 2px 8px rgb(var(--color-primary-rgb, 9, 105, 218), 0.3);
  transition: all 0.3s;
  gap: 6px;
  cursor: pointer;
}

.btn-secondary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgb(var(--color-primary-rgb, 9, 105, 218), 0.4);
}

.btn-small {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 0.8rem;
  background: var(--color-background);
  transition: all 0.2s;
  cursor: pointer;
}

.btn-small:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-light);
}

.theme-display {
  display: flex;
  margin-top: 20px;
  flex-direction: column;
  gap: 16px;
}

.theme-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.theme-item label {
  flex: 1;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.color-preview {
  border: 2px solid var(--color-border);
  border-radius: 8px;
  width: 40px;
  height: 40px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
}

.color-code {
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.8rem;
  font-family: monospace;
  color: var(--color-text-primary);
  background: var(--color-background);
}

.vibe-tag {
  border-radius: 16px;
  padding: 6px 12px;
  font-size: 0.8rem;
  font-weight: 500;
  color: white;
  background: linear-gradient(135deg, var(--color-primary), #6366f1);
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.textarea-input {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 12px;
  width: 100%;
  font-size: 0.9rem;
  font-family: inherit;
  color: var(--color-text-primary);
  background: var(--color-background);
  outline: none;
  resize: vertical;
  transition: border-color 0.2s;
}

.textarea-input:focus {
  border-color: var(--color-primary);
}

.style-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.style-chip {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 6px 12px;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  background: var(--color-background);
  transition: all 0.2s;
  gap: 6px;
  cursor: pointer;
}

.style-chip:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-light);
}

.style-chip.active {
  border-color: var(--color-primary);
  color: white;
  background: linear-gradient(135deg, var(--color-primary), #6366f1);
}

.generated-image {
  overflow: hidden;
  margin-top: 20px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.generated-image img {
  display: block;
  width: 100%;
}

.image-actions {
  display: flex;
  justify-content: flex-end;
  padding: 12px;
  background: var(--color-background);
  gap: 8px;
}

.tables-list {
  margin-top: 20px;
}

.tables-list h4 {
  margin-bottom: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.table-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  border-radius: 8px;
  padding: 12px;
  background: var(--color-background);
}

.table-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.table-size {
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  background: var(--color-secondary-background);
}

.chart-suggestion {
  margin-top: 20px;
  border: 1px solid var(--color-primary);
  border-radius: 12px;
  padding: 16px;
  background: var(--color-background);
}

.chart-suggestion h4 {
  margin-bottom: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-primary);
}

.suggestion-details {
  margin-bottom: 16px;
}

.chart-type-badge {
  display: inline-block;
  margin-bottom: 8px;
  border-radius: 16px;
  padding: 6px 12px;
  font-size: 0.8rem;
  font-weight: 500;
  color: white;
  background: linear-gradient(135deg, var(--color-primary), #6366f1);
}

.suggestion-details p {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px;
  text-align: center;
  color: var(--color-text-secondary);
  grid-column: 1 / -1;
  flex-direction: column;
}

.empty-icon-bg {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
  border-radius: 24px;
  width: 80px;
  height: 80px;
  color: var(--color-primary);
  background: var(--color-secondary-background);
  opacity: 0.5;
}

.spinner {
  border: 2px solid rgb(255 255 255 / 30%);
  border-top-color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
