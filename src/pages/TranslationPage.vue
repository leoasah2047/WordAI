<template>
  <div class="translation-page">
    <div class="header">
      <h2>{{ $t('translationMode') || 'Translation Mode' }}</h2>
      <p class="subtitle">
        {{ $t('translationDesc') || 'Professional cultural adaptation and side-by-side translation.' }}
      </p>
    </div>

    <div class="translation-container">
      <!-- Config Panel -->
      <div class="config-panel card">
        <div class="form-group">
          <label>{{ $t('targetLanguage') || 'Target Language' }}</label>
          <select v-model="targetLanguage" class="select-input">
            <option v-for="lang in languages" :key="lang" :value="lang">{{ lang }}</option>
          </select>
        </div>

        <div class="form-group">
          <div class="label-with-info">
            <label>{{ $t('culturalNuance') || 'Cultural Nuance' }}</label>
            <span class="nuance-value">{{ nuanceLabel }}</span>
          </div>
          <input v-model="nuanceLevel" type="range" min="0" max="100" class="range-input" />
          <div class="range-labels">
            <span>{{ $t('literal') || 'Literal' }}</span>
            <span>{{ $t('creative') || 'Creative' }}</span>
          </div>
        </div>

        <div class="form-group">
          <label>{{ $t('translationStyle') || 'Translation Style' }}</label>
          <div class="style-chips">
            <button
              v-for="style in styles"
              :key="style.id"
              class="style-chip"
              :class="{ active: selectedStyle === style.id }"
              @click="selectedStyle = style.id"
            >
              <component :is="style.icon" :size="14" />
              <span>{{ style.name }}</span>
            </button>
          </div>
        </div>

        <button class="btn-primary translate-btn" :disabled="loading" @click="startTranslation">
          <Globe v-if="!loading" :size="18" />
          <span v-else class="spinner"></span>
          <span>{{ loading ? $t('translating') : $t('translate') }}</span>
        </button>
      </div>

      <!-- Result Panel -->
      <div v-if="state !== 'idle'" class="result-panel card">
        <div class="panel-header">
          <h3>{{ $t('translationResult') || 'Translation Result' }}</h3>
          <div class="header-actions">
            <button class="btn-icon" :title="$t('copy')" @click="copyToClipboard">
              <Copy :size="16" />
            </button>
            <button class="btn-secondary" @click="insertAsSideBySide">
              <Globe :size="16" />
              <span>{{ $t('insertSideBySide') || 'Insert Side-by-Side' }}</span>
            </button>
            <button class="btn-icon" :title="$t('insert')" @click="insertToDoc">
              <Check :size="16" />
            </button>
          </div>
        </div>

        <div class="dual-view">
          <div class="view-pane original">
            <label>{{ $t('originalText') || 'Original' }}</label>
            <div class="content-box">{{ originalText }}</div>
          </div>
          <div class="view-pane translated">
            <label>{{ $t('translatedText') || 'Translated' }}</label>
            <div class="content-box markdown-body" v-html="renderedTranslation"></div>
          </div>
        </div>

        <div v-if="insights" class="cultural-insights">
          <div class="insights-header">
            <Sparkles :size="16" />
            <span>{{ $t('culturalInsights') || 'Cultural insights' }}</span>
          </div>
          <p>{{ insights }}</p>
        </div>
      </div>

      <div v-else class="empty-result">
        <div class="empty-icon-bg">
          <Languages :size="48" />
        </div>
        <p>{{ $t('selectTextToBegin') || 'Select text in Word and choose your settings to begin.' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import DOMPurify from 'dompurify'
import { Briefcase, Check, Copy, Globe, Languages, MessageSquare, Sparkles, User } from 'lucide-vue-next'
import MarkdownIt from 'markdown-it'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { getChatResponse } from '@/api/union'
import { message as messageUtil } from '@/utils/message'
import useSettingForm from '@/utils/settingForm'
import { getSelectedText } from '@/utils/wordApi'

const { t } = useI18n()
const md = new MarkdownIt()
const settingForm = useSettingForm()

// State
const targetLanguage = ref(settingForm.value.replyLanguage || 'English')
const nuanceLevel = ref(50)
const selectedStyle = ref('professional')
const loading = ref(false)
const state = ref<'idle' | 'result'>('idle')
const originalText = ref('')
const translatedText = ref('')
const insights = ref('')

interface CustomTranslationMode {
  id: string
  name: string
  prompt: string
}
const customModes = ref<CustomTranslationMode[]>([])

const loadCustomModes = () => {
  const stored = localStorage.getItem('customTranslationModes')
  if (stored) {
    try {
      customModes.value = JSON.parse(stored)
    } catch (_e) {
      customModes.value = []
    }
  }
}

onMounted(() => {
  loadCustomModes()
})

const languages = [
  'English',
  'Chinese',
  'Spanish',
  'French',
  'German',
  'Japanese',
  'Korean',
  'Arabic',
  'Russian',
  'Portuguese',
]

interface TranslationStyle {
  id: string
  name: string
  icon: any
  isCustom?: boolean
  prompt?: string
}

const styles = computed<TranslationStyle[]>(() => {
  const defaults = [
    { id: 'professional', name: t('styleProfessional') || 'Professional', icon: Briefcase },
    { id: 'friendly', name: t('styleFriendly') || 'Friendly', icon: User },
    { id: 'creative', name: t('styleCreative') || 'Creative', icon: Sparkles },
    { id: 'conversational', name: t('styleConversational') || 'Conversational', icon: MessageSquare },
  ]

  const custom = customModes.value.map(m => ({
    id: m.id,
    name: m.name,
    icon: Sparkles,
    isCustom: true,
    prompt: m.prompt,
  }))

  return [...defaults, ...custom]
})

const nuanceLabel = computed(() => {
  const v = nuanceLevel.value
  if (v < 20) return t('veryLiteral') || 'Very Literal'
  if (v < 40) return t('literal') || 'Literal'
  if (v < 60) return t('balanced') || 'Balanced'
  if (v < 80) return t('adaptive') || 'Adaptive'
  return t('highlyCreative') || 'Highly Creative'
})

const renderedTranslation = computed(() => DOMPurify.sanitize(md.render(translatedText.value)))

async function startTranslation() {
  const text = await getSelectedText()
  if (!text || !text.trim()) {
    messageUtil.warning(t('selectTextPrompt'))
    return
  }

  originalText.value = text
  loading.value = true

  const selectedItem = styles.value.find(s => s.id === selectedStyle.value)
  const stylePrompt = selectedItem?.isCustom
    ? `Custom Instructions: ${selectedItem.prompt}`
    : `focus on ${selectedStyle.value} style`

  const systemPrompt = `You are an expert cultural adaptation engine and translator. 
  Your goal is to translate the provided text into ${targetLanguage.value}.
  Style/Instructions: ${stylePrompt}
  Nuance Level: ${nuanceLevel.value}/100 (0=Literal word-for-word, 100=Creative cultural localization).
  
  Format your response as follows:
  TRANSLATION:
  [The translated text]
  
  INSIGHTS:
  [Briefly explain any cultural adaptations or nuance choices made, especially if nuance level is high]`

  try {
    const config = getLLMConfig()
    let fullResponse = ''

    await getChatResponse({
      ...config,
      messages: [new SystemMessage(systemPrompt), new HumanMessage(text)],
      onStream: (chunk: string) => {
        fullResponse = chunk
      },
      errorIssue: ref(null),
      loading: ref(true),
    } as any)

    // Parse response
    const translationMatch = fullResponse.match(/TRANSLATION:([\s\S]*?)(?=INSIGHTS:|$)/i)
    const insightsMatch = fullResponse.match(/INSIGHTS:([\s\S]*)/i)

    translatedText.value = translationMatch ? translationMatch[1].trim() : fullResponse
    insights.value = insightsMatch ? insightsMatch[1].trim() : ''

    state.value = 'result'
  } catch (error) {
    console.error(error)
    messageUtil.error(t('failedToProcess'))
  } finally {
    loading.value = false
  }
}

function getLLMConfig() {
  const settings = settingForm.value
  if (settings.api === 'gemini') {
    return { provider: 'gemini', geminiAPIKey: settings.geminiAPIKey, geminiModel: settings.geminiModelSelect }
  }
  return {
    provider: 'official',
    config: { apiKey: settings.officialAPIKey, baseURL: settings.officialBasePath, dangerouslyAllowBrowser: true },
    model: settings.officialModelSelect,
  }
}

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(translatedText.value)
    messageUtil.success(t('copied'))
  } catch (_err) {
    messageUtil.error(t('copyFailed'))
  }
}

async function insertToDoc() {
  try {
    await Word.run(async context => {
      const selection = context.document.getSelection()
      selection.insertText(translatedText.value, Word.InsertLocation.replace)
      await context.sync()
    })
    messageUtil.success(t('appliedSuccessfully'))
  } catch (_err) {
    messageUtil.error(t('failedToApply'))
  }
}

async function insertAsSideBySide() {
  try {
    await Word.run(async context => {
      const selection = context.document.getSelection()

      // Create a 2-column table with 2 rows (header + content)
      const table = selection.insertTable(2, 2, Word.InsertLocation.after, [
        [t('originalText') || 'Original', t('translatedText') || 'Translated'],
        [originalText.value, translatedText.value],
      ])

      // Style the table for professional appearance
      table.styleBuiltIn = Word.BuiltInStyleName.gridTable1Light
      table.width = 450 // points, roughly 6.25 inches

      // Format header row
      const headerRow = table.rows.getFirst()
      headerRow.font.bold = true
      headerRow.font.size = 11
      headerRow.shadingColor = '#f3f4f6'

      // Add paragraph after table for spacing
      selection.insertParagraph('', Word.InsertLocation.after)

      await context.sync()
    })
    messageUtil.success(t('insertedSideBySide') || 'Side-by-side translation inserted successfully')
  } catch (_err) {
    console.error(_err)
    messageUtil.error(t('failedToApply'))
  }
}
</script>

<style scoped>
.translation-page {
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

.translation-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 900px;
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

.config-panel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  align-items: end;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.select-input {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 10px;
  color: var(--color-text-primary);
  background: var(--color-background);
  outline: none;
}

.range-input {
  width: 100%;
  accent-color: var(--color-primary);
}

.range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: var(--color-text-secondary);
}

.label-with-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nuance-value {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-primary);
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
}

.style-chip.active {
  border-color: var(--color-primary);
  color: white;
  background: var(--color-primary);
}

.translate-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 12px;
  padding: 12px;
  height: 44px;
  gap: 8px;
}

/* Result Panel */
.result-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  font-size: 1.1rem;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  width: 32px;
  height: 32px;
  background: var(--color-background);
  transition: all 0.2s;
  cursor: pointer;
}

.btn-icon:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-light);
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

.dual-view {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.view-pane {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.view-pane label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
}

.content-box {
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 16px;
  min-height: 120px;
  max-height: 300px;
  font-size: 0.95rem;
  background: var(--color-background);
  line-height: 1.6;
}

.cultural-insights {
  border: 1px solid rgb(var(--color-primary-rgb, 9, 105, 218), 0.1);
  border-radius: 12px;
  padding: 16px;
  background: rgb(var(--color-primary-rgb, 9, 105, 218), 0.05);
}

.insights-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-primary);
  gap: 8px;
}

.cultural-insights p {
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--color-text-secondary);
}

.empty-result {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px;
  text-align: center;
  color: var(--color-text-secondary);
  flex: 1;
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

@media (width <= 600px) {
  .dual-view {
    grid-template-columns: 1fr;
  }
}
</style>
