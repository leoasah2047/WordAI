<template>
  <div class="toolbox-page">
    <div class="toolbox-content">
      <!-- AI Tools Section -->
      <div class="toolbox-section">
        <h2 class="section-title">{{ $t('aiAssistants') }}</h2>
        <div class="tools-grid">
          <div class="tool-card premium-shadow" @click="runAiTool('meetingMinutes')">
            <div class="tool-icon-wrapper blue">
              <Users :size="24" />
            </div>
            <div class="tool-info">
              <h3>{{ $t('meetingMinutes') }}</h3>
              <p>{{ $t('meetingMinutesDesc') }}</p>
            </div>
          </div>

          <div class="tool-card premium-shadow" @click="runAiTool('summarize')">
            <div class="tool-icon-wrapper purple">
              <FileSearch :size="24" />
            </div>
            <div class="tool-info">
              <h3>{{ $t('summarize') }}</h3>
              <p>{{ $t('summarizeDesc') }}</p>
            </div>
          </div>

          <div class="tool-card premium-shadow" @click="runAiTool('weeklyReport')">
            <div class="tool-icon-wrapper indigo">
              <CalendarDays :size="24" />
            </div>
            <div class="tool-info">
              <h3>{{ $t('weeklyReportAssistant') }}</h3>
              <p>{{ $t('weeklyReportDesc') }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- One-click Cleanup Section -->
      <div class="toolbox-section">
        <h2 class="section-title">{{ $t('oneClickCleanup') }}</h2>
        <div class="tools-grid">
          <div class="tool-card premium-shadow" @click="runCleanup('blankLines')">
            <div class="tool-icon-wrapper orange">
              <Eraser :size="20" />
            </div>
            <div class="tool-info">
              <h3>{{ $t('deleteBlankLines') }}</h3>
            </div>
          </div>

          <div class="tool-card premium-shadow" @click="runCleanup('formatting')">
            <div class="tool-icon-wrapper red">
              <Type :size="20" />
            </div>
            <div class="tool-info">
              <h3>{{ $t('removeFormatting') }}</h3>
            </div>
          </div>

          <div class="tool-card premium-shadow" @click="runCleanup('hyperlinks')">
            <div class="tool-icon-wrapper cyan">
              <Link2Off :size="20" />
            </div>
            <div class="tool-info">
              <h3>{{ $t('removeHyperlinks') }}</h3>
            </div>
          </div>

          <div class="tool-card premium-shadow" @click="runCleanup('underlines')">
            <div class="tool-icon-wrapper pink">
              <Underline :size="20" />
            </div>
            <div class="tool-info">
              <h3>{{ $t('removeUnderlines') }}</h3>
            </div>
          </div>

          <div class="tool-card premium-shadow" @click="runCleanup('headerLine')">
            <div class="tool-icon-wrapper gray">
              <Minus :size="20" />
            </div>
            <div class="tool-info">
              <h3>{{ $t('removeHeaderLine') }}</h3>
            </div>
          </div>
        </div>
      </div>

      <!-- Table Processing Section -->
      <div class="toolbox-section">
        <h2 class="section-title">{{ $t('tableProcessing') }}</h2>
        <div class="tools-grid">
          <div class="tool-card premium-shadow" @click="runTableTool('cursorBefore', undefined)">
            <div class="tool-icon-wrapper emerald">
              <ArrowUpToLine :size="20" />
            </div>
            <div class="tool-info">
              <h3>{{ $t('cursorBeforeTable') }}</h3>
            </div>
          </div>

          <div class="tool-card premium-shadow" @click="runTableTool('headerAcrossPages', undefined)">
            <div class="tool-icon-wrapper teal">
              <Rows :size="20" />
            </div>
            <div class="tool-info">
              <h3>{{ $t('headerAcrossPages') }}</h3>
            </div>
          </div>

          <div class="tool-card premium-shadow" @click="runTableTool('selectAll', undefined)">
            <div class="tool-icon-wrapper violet">
              <Maximize :size="20" />
            </div>
            <div class="tool-info">
              <h3>{{ $t('selectAllTable') }}</h3>
            </div>
          </div>

          <div class="tool-card premium-shadow" @click="runTableTool('deleteBlankPageAfter', undefined)">
            <div class="tool-icon-wrapper rose">
              <FileX :size="20" />
            </div>
            <div class="tool-info">
              <h3>{{ $t('deleteBlankPageAfter') }}</h3>
            </div>
          </div>

          <div class="tool-card premium-shadow" @click="runTableTool('autoFit', undefined)">
            <div class="tool-icon-wrapper sky">
              <MoveDiagonal :size="20" />
            </div>
            <div class="tool-info">
              <h3>{{ $t('autoFitTable') }}</h3>
            </div>
          </div>

          <div class="tool-card premium-shadow" @click="triggerImageUpload">
            <div class="tool-icon-wrapper lime">
              <Image :size="20" />
            </div>
            <div class="tool-info">
              <h3>{{ $t('insertPictureIntoTable') }}</h3>
            </div>
            <input ref="fileInput" type="file" accept="image/*" style="display: none" @change="handleImageUpload" />
          </div>
        </div>
      </div>
    </div>

    <!-- Processing Overlay -->
    <div v-if="loading" class="processing-overlay blur-bg">
      <div class="loader-content">
        <div class="spinner"></div>
        <p>{{ statusText }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowUpToLine,
  CalendarDays,
  Eraser,
  FileSearch,
  FileX,
  Image,
  Link2Off,
  Maximize,
  Minus,
  MoveDiagonal,
  Rows,
  Type,
  Underline,
  Users,
} from 'lucide-vue-next'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { getChatResponse } from '@/api/union'
import { SYSTEM_PROMPTS } from '@/constants/prompts'
import { message as messageUtil } from '@/utils/message'
import useSettingForm from '@/utils/settingForm'
// import { getDocumentBodyText } from '@/utils/wordApi'

const { t } = useI18n()
const loading = ref(false)
const statusText = ref('')
const settingForm = useSettingForm()
const fileInput = ref<HTMLInputElement | null>(null)

async function runAiTool(type: string) {
  loading.value = true
  statusText.value = t('processingWithAi')

  try {
    await Word.run(async context => {
      const body = context.document.body
      body.load('text')
      await context.sync()

      const content = body.text
      if (!content) {
        messageUtil.warning(t('emptyDocument'))
        return
      }

      let systemPrompt = ''
      if (type === 'meetingMinutes') {
        systemPrompt = SYSTEM_PROMPTS.MEETING_MINUTES
      } else if (type === 'summarize') {
        systemPrompt = SYSTEM_PROMPTS.SUMMARY
      } else if (type === 'weeklyReport') {
        systemPrompt = SYSTEM_PROMPTS.WEEKLY_REPORT
      }

      const prompt = `${systemPrompt}\n\nContent:\n${content}`

      const settings = settingForm.value
      const provider = settings.api

      const providerConfigs: Record<string, any> = {
        official: {
          provider: 'official',
          config: {
            apiKey: settings.officialAPIKey,
            baseURL: settings.officialBasePath,
            dangerouslyAllowBrowser: true,
          },
          maxTokens: settings.officialMaxTokens,
          temperature: settings.officialTemperature,
          model: settings.officialModelSelect,
        },
        gemini: {
          provider: 'gemini',
          geminiAPIKey: settings.geminiAPIKey,
          maxTokens: settings.geminiMaxTokens,
          temperature: settings.geminiTemperature,
          geminiModel: settings.geminiModelSelect,
        },
      }

      const currentConfig = providerConfigs[provider]
      if (!currentConfig) {
        messageUtil.error(t('notSupportedProvider'))
        return
      }

      let resultText = ''
      await getChatResponse({
        ...currentConfig,
        messages: [{ role: 'user', content: prompt } as any],
        loading,
        onStream: (text: string) => {
          resultText = text
        },
      })

      // Insert result at the end of document
      body.insertParagraph(`${t(type)} ${t('output')}`, 'End').font.bold = true
      body.insertParagraph(resultText, 'End')

      await context.sync()
      messageUtil.success(t('toolCompleted'))
    })
  } catch (error) {
    console.error(error)
    messageUtil.error(t('toolFailed'))
  } finally {
    loading.value = false
  }
}

async function runCleanup(type: string) {
  loading.value = true
  statusText.value = t('cleaningUp')

  try {
    await Word.run(async context => {
      if (type === 'blankLines') {
        const paragraphs = context.document.body.paragraphs
        paragraphs.load('items')
        await context.sync()

        for (let i = paragraphs.items.length - 1; i >= 0; i--) {
          const p = paragraphs.items[i]
          p.load('text')
          await context.sync()
          if (p.text.trim() === '') {
            p.delete()
          }
        }
      } else if (type === 'formatting') {
        const selection = context.document.getSelection()
        ;(selection as any).clearFormatting()
        await context.sync()
      } else if (type === 'hyperlinks') {
        const links = context.document.body.getRange().hyperlinks
        links.load('items')
        await context.sync()
        for (const link of links.items) {
          link.delete()
        }
      } else if (type === 'underlines') {
        const body = context.document.body
        body.font.underline = 'None'
      } else if (type === 'headerLine') {
        const sections = context.document.sections
        sections.load('items')
        await context.sync()

        for (const section of sections.items) {
          const header = section.getHeader('Primary')
          const headerRange = header.getRange()
          const paragraphs = headerRange.paragraphs
          paragraphs.load('items')
          await context.sync()
          if (paragraphs.items.length > 0) {
            ;(paragraphs.items[0].borders as any).getItem('Bottom').style = 'None'
          }
        }
      }

      await context.sync()
      messageUtil.success(t('cleanupCompleted'))
    })
  } catch (error) {
    console.error(error)
    messageUtil.error(t('toolFailed'))
  } finally {
    loading.value = false
  }
}

function triggerImageUpload() {
  fileInput.value?.click()
}

async function handleImageUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async e => {
    const base64 = (e.target?.result as string).split(',')[1]
    await runTableTool('insertPicture', base64)
  }
  reader.readAsDataURL(file)
}

async function runTableTool(type: string, data?: string) {
  loading.value = true
  statusText.value = t('processingTable')

  try {
    await Word.run(async context => {
      const selection = context.document.getSelection()
      const tables = selection.tables
      tables.load('items')
      await context.sync()

      if (tables.items.length === 0) {
        messageUtil.warning(t('noTableSelected'))
        return
      }

      const table = tables.items[0]

      if (type === 'cursorBefore') {
        table.insertParagraph(' ', 'Before').select()
      } else if (type === 'headerAcrossPages') {
        table.headerRowCount = 1
      } else if (type === 'selectAll') {
        table.select()
      } else if (type === 'deleteBlankPageAfter') {
        // Heuristic: check paragraph after table
        const nextPara = table.getRange('After').paragraphs.getFirst()
        nextPara.load('text')
        await context.sync()
        if (nextPara.text.trim() === '') {
          nextPara.delete()
        }
      } else if (type === 'autoFit') {
        // Direct autofit property might not be in all API versions, but we can set width
        table.distributeColumns()
      } else if (type === 'insertPicture' && data) {
        const range = selection.getRange()
        range.insertInlinePictureFromBase64(data, 'Replace')
      }

      await context.sync()
      messageUtil.success(t('tableToolCompleted'))
    })
  } catch (error) {
    console.error(error)
    messageUtil.error(t('toolFailed'))
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.toolbox-page {
  display: flex;
  overflow: hidden;
  height: 100vh;
  color: var(--color-text-primary);
  background: var(--color-background);
  flex-direction: column;
}

.header {
  border-bottom: 1px solid var(--color-border);
  padding: 20px 24px;
  background: rgb(255 255 255 / 70%);
  backdrop-filter: blur(10px);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  color: var(--color-primary);
}

.header-left h1 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}

.toolbox-content {
  display: flex;
  overflow-y: auto;
  padding: 24px;
  flex: 1;
  flex-direction: column;
  gap: 32px;
}

.toolbox-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.tool-card {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 16px;
  background: var(--color-input-background);
  transition: all 0.2s ease;
  gap: 16px;
  cursor: pointer;
}

.tool-card:hover {
  transform: translateY(-2px);
  border-color: var(--color-primary);
  background: var(--color-secondary-background);
}

.tool-icon-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 10px;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}

/* Colors for icon wrappers */
.blue {
  color: #0ea5e9;
  background: #e0f2fe;
}

.purple {
  color: #a855f7;
  background: #f3e8ff;
}

.indigo {
  color: #6366f1;
  background: #e0e7ff;
}

.orange {
  color: #f97316;
  background: #ffedd5;
}

.red {
  color: #ef4444;
  background: #fee2e2;
}

.cyan {
  color: #06b6d4;
  background: #ecfeff;
}

.pink {
  color: #ec4899;
  background: #fce7f3;
}

.gray {
  color: #64748b;
  background: #f1f5f9;
}

.emerald {
  color: #10b981;
  background: #ecfdf5;
}

.teal {
  color: #14b8a6;
  background: #f0fdfa;
}

.violet {
  color: #8b5cf6;
  background: #ede9fe;
}

.rose {
  color: #f43f5e;
  background: #fff1f2;
}

.sky {
  color: #0ea5e9;
  background: #f0f9ff;
}

.lime {
  color: #84cc16;
  background: #f7fee7;
}

.tool-info h3 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.tool-info p {
  margin: 4px 0 0;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.processing-overlay {
  position: absolute;
  z-index: 100;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgb(255 255 255 / 60%);
  inset: 0;
  backdrop-filter: blur(4px);
}

.loader-content {
  text-align: center;
}

.spinner {
  margin: 0 auto 16px;
  border: 4px solid var(--color-primary-light);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.premium-shadow {
  box-shadow:
    0 1px 3px rgb(0 0 0 / 5%),
    0 4px 12px rgb(0 0 0 / 2%);
}

.blur-bg {
  background: rgb(255 255 255 / 80%);
  backdrop-filter: blur(8px);
}
</style>
