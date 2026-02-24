<template>
  <div class="edit-page">
    <div class="header">
      <h2>{{ $t('editMode') }}</h2>
      <p class="subtitle">
        {{ $t('precisionRefinementDesc') || 'Advanced proofreading, fact-checking, and bias detection.' }}
      </p>
    </div>

    <!-- Actions Grid -->
    <div class="actions-grid">
      <button class="action-card" @click="startProofread">
        <CheckCircle :size="20" class="icon-proofread" />
        <span>{{ $t('proofread') }}</span>
      </button>
      <button class="action-card" @click="startPolish">
        <Sparkles :size="20" class="icon-polish" />
        <span>{{ $t('polish') }}</span>
      </button>
      <button class="action-card" @click="startContinue">
        <PenTool :size="20" class="icon-continue" />
        <span>{{ $t('continueWriting') }}</span>
      </button>

      <!-- New Features -->
      <button class="action-card" @click="startFactCheck">
        <ShieldAlert :size="20" class="icon-factcheck" />
        <span>{{ $t('factCheck') }}</span>
      </button>
      <button class="action-card" @click="startBiasScan">
        <Scale :size="20" class="icon-bias" />
        <span>{{ $t('biasScan') }}</span>
      </button>

      <div class="action-card-wrapper">
        <button class="action-card" @click="startTranslate">
          <Globe :size="20" class="icon-translate" />
          <span>{{ $t('translate') }}</span>
        </button>
        <div v-if="translationModes.length > 0" class="mode-selector-mini">
          <select v-model="selectedTranslationModeId" class="mini-select">
            <option v-for="mode in translationModes" :key="mode.id" :value="mode.id">
              {{ mode.name }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Result Area -->
    <div v-if="state !== 'idle'" class="result-area">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <span class="spinner"></span>
        <p>{{ loadingText }}...</p>
      </div>

      <!-- Diff View (Proofread/Polish/Translate) -->
      <div v-else-if="state === 'diff'" class="diff-view">
        <div class="diff-header">
          <span>{{ $t('suggestedChanges') }}</span>
          <div class="diff-actions">
            <button class="btn-primary small" :title="$t('acceptAll')" @click="acceptAllSegments">
              <CheckSquare :size="16" /> {{ $t('acceptAll') }}
            </button>
            <button class="btn-secondary small" :title="$t('discard')" @click="state = 'idle'">
              <RotateCcw :size="16" />
            </button>
          </div>
        </div>

        <div class="segments-list">
          <div v-for="seg in segments" :key="seg.id" class="segment-item" :class="seg.status">
            <div class="segment-original">{{ seg.original }}</div>
            <div class="segment-arrow"><ChevronRight :size="14" /></div>
            <div class="segment-modified">{{ seg.modified }}</div>
            <div class="segment-item-actions">
              <button class="btn-accept tiny" :disabled="seg.status !== 'pending'" @click="acceptSegment(seg)">
                <Check :size="14" />
              </button>
              <button class="btn-discard tiny" :disabled="seg.status !== 'pending'" @click="rejectSegment(seg)">
                <X :size="14" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Continue Writing View -->
      <div v-else-if="state === 'continue'" class="continue-view">
        <div class="generated-text-header">
          <span>{{ $t('generatedText') }}</span>
        </div>
        <div class="generated-content">
          {{ generatedText }}
        </div>
        <div class="continue-actions">
          <button class="btn-primary" @click="finalizeContinue">{{ $t('apply') }}</button>
          <button class="btn-secondary" @click="applyContinuePreview">{{ $t('preview') }}</button>
          <button class="btn-ghost" @click="undoContinue">{{ $t('undo') }}</button>
        </div>
      </div>

      <!-- Fact Check View -->
      <div v-else-if="state === 'factcheck'" class="factcheck-view">
        <div class="view-header">
          <h3>{{ $t('factCheckIssues') || 'Fact Check Issues' }}</h3>
          <button class="btn-ghost small" @click="state = 'idle'">
            <X :size="16" />
          </button>
        </div>
        <div class="issues-list">
          <div v-for="(issue, idx) in factCheckIssues" :key="idx" class="issue-card warning">
            <div class="issue-icon"><ShieldAlert :size="18" /></div>
            <div class="issue-content">
              <h4>{{ issue.claim }}</h4>
              <p class="verification-note">{{ issue.verification }}</p>
              <a v-if="issue.source" :href="issue.source" target="_blank" class="source-link"
                >Source: {{ issue.source }}</a
              >
            </div>
          </div>
          <div v-if="factCheckIssues.length === 0" class="empty-results">
            <CheckCircle :size="32" class="success-icon" />
            <p>{{ $t('verifiedClaims') || 'No fact-check issues found.' }}</p>
          </div>
        </div>
      </div>

      <!-- Bias Scan View -->
      <div v-else-if="state === 'biasscan'" class="bias-view">
        <div class="view-header">
          <h3>{{ $t('biasScanResults') || 'Bias & Tone Analysis' }}</h3>
          <button class="btn-ghost small" @click="state = 'idle'">
            <X :size="16" />
          </button>
        </div>

        <div class="bias-scorecard">
          <div class="score-item">
            <div class="score-label">{{ $t('tone') }}</div>
            <div class="score-value">{{ biasResults?.tone || 'Neutral' }}</div>
          </div>
          <div class="score-item">
            <div class="score-label">{{ $t('objectivity') || 'Objectivity' }}</div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: (biasResults?.objectivity || 0) + '%' }"></div>
            </div>
            <span class="score-text">{{ biasResults?.objectivity }}%</span>
          </div>
        </div>

        <div class="issues-list">
          <div v-for="(flag, idx) in biasResults?.flags" :key="idx" class="issue-card info">
            <div class="issue-icon"><Scale :size="18" /></div>
            <div class="issue-content">
              <h4>{{ flag.text }}</h4>
              <p>{{ flag.suggestion }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import {
  Check,
  CheckCircle,
  CheckSquare,
  ChevronRight,
  Globe,
  PenTool,
  RotateCcw,
  Scale,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-vue-next'
import { onBeforeMount, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { getChatResponse } from '@/api/union'
import { SYSTEM_PROMPTS } from '@/constants/prompts'
import { useAuthStore } from '@/stores/AuthStore'
import { message as messageUtil } from '@/utils/message'
import useSettingForm from '@/utils/settingForm'
import { getSelectedText } from '@/utils/wordApi'

const { t } = useI18n()
const settingForm = useSettingForm()
const { state: authState } = useAuthStore()

type EditorState = 'idle' | 'diff' | 'continue' | 'translate' | 'factcheck' | 'biasscan'

const state = ref<EditorState>('idle')
const loading = ref(false)
const loadingText = ref('')
const originalText = ref('')
const generatedText = ref('')

interface Segment {
  id: string
  original: string
  modified: string
  status: 'pending' | 'accepted' | 'rejected'
}
const segments = ref<Segment[]>([])

// Fact Check & Bias State
interface FactIssue {
  claim: string
  verification: string
  source?: string
}
const factCheckIssues = ref<FactIssue[]>([])

interface BiasResult {
  tone: string
  objectivity: number
  flags: { text: string; suggestion: string }[]
}
const biasResults = ref<BiasResult | null>(null)

// Translation Modes
interface TranslationMode {
  id: string
  name: string
  prompt: string
}
const translationModes = ref<TranslationMode[]>([])
const selectedTranslationModeId = ref('')

const loadTranslationModes = () => {
  const stored = localStorage.getItem('customTranslationModes')
  if (stored) {
    try {
      translationModes.value = JSON.parse(stored)
      if (translationModes.value.length > 0) {
        selectedTranslationModeId.value = translationModes.value[0].id
      }
      return
    } catch (_e) {}
  }
}

onBeforeMount(() => {
  loadTranslationModes()
})

async function getSelectionText() {
  return await getSelectedText()
}

async function getDocumentContext() {
  return await getSelectedText()
}

// === Proofread & Polish ===
async function processText(promptType: 'proofread' | 'polish') {
  const text = await getSelectionText()
  if (!text || !text.trim()) {
    messageUtil.warning(t('selectTextPrompt'))
    return
  }

  originalText.value = text
  loading.value = true
  loadingText.value = promptType === 'proofread' ? t('proofreading') : t('polishing')
  state.value = 'idle'

  const systemPrompt = promptType === 'proofread' ? SYSTEM_PROMPTS.GRAMMAR : SYSTEM_PROMPTS.POLISH

  try {
    const res = await callLLM(systemPrompt, text)
    generatedText.value = res
    generateSegments(text, res)
    state.value = 'diff'
  } catch (_e) {
    console.error(_e)
    messageUtil.error(t('failedToProcess'))
  } finally {
    loading.value = false
  }
}

function startProofread() {
  processText('proofread')
}
function startPolish() {
  processText('polish')
}

// === Fact Check ===
async function startFactCheck() {
  const text = await getSelectionText()
  if (!text || !text.trim()) {
    messageUtil.warning(t('selectTextPrompt'))
    return
  }

  loading.value = true
  loadingText.value = t('factChecking') || 'Fact checking...'
  state.value = 'idle'
  factCheckIssues.value = []

  try {
    const systemPrompt = SYSTEM_PROMPTS.FACT_CHECK
    const res = await callLLM(systemPrompt, text)

    // Parse JSON response from LLM
    let data = []
    try {
      // Find JSON block
      const match = res.match(/\[.*\]/s)
      data = JSON.parse(match ? match[0] : res)
    } catch {
      console.warn('Failed to parse fact check JSON, using raw text fallback')
      data = [{ claim: 'Summary', verification: res }]
    }

    factCheckIssues.value = data.filter(
      (i: any) => i.verification.toLowerCase().includes('unverified') || i.verification.toLowerCase().includes('false'),
    )
    state.value = 'factcheck'
  } catch (err: any) {
    messageUtil.error(`${t('failedToProcess')}: ${err.message}`)
  } finally {
    loading.value = false
  }
}

// === Bias Scan ===
async function startBiasScan() {
  const text = await getSelectionText()
  if (!text || !text.trim()) {
    messageUtil.warning(t('selectTextPrompt'))
    return
  }

  loading.value = true
  loadingText.value = t('analyzing') || 'Analyzing tone...'
  state.value = 'idle'
  biasResults.value = null

  try {
    const systemPrompt = SYSTEM_PROMPTS.BIAS_SCAN
    const res = await callLLM(systemPrompt, text)

    // Parse JSON
    try {
      const match = res.match(/\{.*\}/s)
      biasResults.value = JSON.parse(match ? match[0] : res)
    } catch {
      biasResults.value = {
        tone: 'Analysis Complete',
        objectivity: 50,
        flags: [{ text: 'Could not categorize flags', suggestion: res }],
      }
    }

    state.value = 'biasscan'
  } catch (err: any) {
    messageUtil.error(`${t('failedToProcess')}: ${err.message}`)
  } finally {
    loading.value = false
  }
}

// === Continue Writing ===
async function startContinue() {
  const text = await getDocumentContext()
  if (!text || !text.trim()) {
    messageUtil.warning(t('selectContextPrompt') || t('selectTextPrompt'))
    return
  }

  loading.value = true
  loadingText.value = t('generating')
  state.value = 'idle'

  const systemPrompt = SYSTEM_PROMPTS.WRITE

  try {
    const res = await callLLM(systemPrompt, text)
    generatedText.value = res
    state.value = 'continue'
  } catch (_e) {
    console.error(_e)
    messageUtil.error(t('failedToProcess'))
  } finally {
    loading.value = false
  }
}

// === Translate ===
async function startTranslate() {
  const text = await getSelectionText()
  if (!text || !text.trim()) {
    messageUtil.warning(t('selectTextPrompt'))
    return
  }

  loading.value = true
  loadingText.value = t('translating')
  state.value = 'idle'

  let systemPrompt = SYSTEM_PROMPTS.TRANSLATE.replace('{language}', settingForm.value.replyLanguage)
  const mode = translationModes.value.find(m => m.id === selectedTranslationModeId.value)
  if (mode) {
    systemPrompt = mode.prompt
  }

  try {
    const res = await callLLM(systemPrompt, text)
    generatedText.value = res
    generateSegments(text, res)
    state.value = 'diff' // Use diffuse view for translation too as it's segmented
  } catch (_e) {
    console.error(_e)
    messageUtil.error(t('failedToProcess'))
  } finally {
    loading.value = false
  }
}

// === LLM Call Wrapper ===
async function callLLM(system: string, user: string): Promise<string> {
  const nexusProfile = authState.user?.profile?.nexus_profile

  const messages = [new SystemMessage(system), new HumanMessage(user)]
  const settings = settingForm.value
  const provider = settings.api

  let config: any = {}

  if (provider === 'official') {
    config = {
      provider: 'official',
      config: { apiKey: settings.officialAPIKey, baseURL: settings.officialBasePath },
      model: settings.officialModelSelect,
    }
  } else if (provider === 'gemini') {
    config = {
      provider: 'gemini',
      geminiAPIKey: settings.geminiAPIKey,
      geminiModel: settings.geminiModelSelect,
    }
  }

  if (!config.provider) {
    if (settings.api === 'gemini') {
      config = { provider: 'gemini', geminiAPIKey: settings.geminiAPIKey, geminiModel: settings.geminiModelSelect }
    } else {
      config = {
        provider: 'official',
        config: { apiKey: settings.officialAPIKey, baseURL: settings.officialBasePath, dangerouslyAllowBrowser: true },
        model: settings.officialModelSelect,
      }
    }
  }

  let fullResponse = ''
  await getChatResponse({
    ...config,
    messages,
    nexusProfile,
    onStream: text => {
      fullResponse = text
    },
    errorIssue: ref(null),
    loading: ref(true),
  })

  return fullResponse
}

// === Segmented Result Logic ===
function generateSegments(original: string, modified: string) {
  const origParas = original.split('\n')
  const modParas = modified.split('\n')

  const news: Segment[] = []
  const max = Math.max(origParas.length, modParas.length)
  for (let i = 0; i < max; i++) {
    news.push({
      id: Math.random().toString(36).substr(2, 9),
      original: origParas[i] || '',
      modified: modParas[i] || '',
      status: 'pending',
    })
  }
  segments.value = news
}

async function acceptSegment(segment: Segment) {
  segment.status = 'accepted'
}

async function rejectSegment(segment: Segment) {
  segment.status = 'rejected'
}

async function acceptAllSegments() {
  const result = segments.value.map(s => (s.status === 'rejected' ? s.original : s.modified)).join('\n')
  try {
    await Word.run(async context => {
      const selection = context.document.getSelection()
      selection.insertText(result, Word.InsertLocation.replace)
      await context.sync()
    })
    state.value = 'idle'
    messageUtil.success(t('appliedSuccessfully'))
  } catch (_e) {
    messageUtil.error(t('failedToApply'))
  }
}

// === Continue Writing Preview ===
async function applyContinuePreview() {
  if (state.value !== 'continue') return

  loading.value = true
  try {
    await Word.run(async context => {
      const selection = context.document.getSelection()
      const range = selection.insertText(generatedText.value, Word.InsertLocation.after)
      range.font.color = 'blue' // Preview in blue
      await context.sync()
    })
    messageUtil.info(t('previewInserted'))
  } catch (_e) {
    messageUtil.error(t('failedToPreview'))
  } finally {
    loading.value = false
  }
}

async function finalizeContinue() {
  try {
    await Word.run(async context => {
      const selection = context.document.getSelection()
      selection.insertText(generatedText.value, Word.InsertLocation.after)
      await context.sync()
    })
    state.value = 'idle'
  } catch (_e) {
    messageUtil.error(t('failedToApply'))
  }
}

async function undoContinue() {
  state.value = 'idle'
  messageUtil.info(t('undoContinueInfo'))
}
</script>

<style scoped>
.edit-page {
  display: flex;
  padding: 16px;
  height: 100vh;
  color: var(--color-text-primary);
  background: var(--color-background);
  flex-direction: column;
}

.header h2 {
  margin-bottom: 4px;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
}

.subtitle {
  margin-bottom: 20px;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.action-card {
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 16px 8px;
  color: var(--color-text-primary);
  background: var(--color-secondary-background);
  box-shadow: 0 2px 4px rgb(0 0 0 / 5%);
  transition: all 0.2s;
  flex-direction: column;
  cursor: pointer;
}

.action-card-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mode-selector-mini {
  padding: 0 4px;
}

.mini-select {
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 4px;
  width: 100%;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  background: var(--color-background);
  outline: none;
}

.action-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
}

.action-card span {
  margin-top: 8px;
  font-size: 0.8rem;
  font-weight: 500;
  text-align: center;
}

.result-area {
  display: flex;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 16px;
  background: var(--color-secondary-background);
  flex: 1;
  flex-direction: column;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: var(--color-text-secondary);
  flex-direction: column;
}

.spinner {
  margin-bottom: 12px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.diff-view,
.continue-view,
.factcheck-view,
.bias-view {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.diff-header,
.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 1rem;
  font-weight: 600;
}

.diff-actions,
.continue-actions {
  display: flex;
  gap: 8px;
}

.segments-list,
.issues-list {
  display: flex;
  overflow-y: auto;
  padding-right: 4px;
  flex: 1;
  flex-direction: column;
  gap: 12px;
}

.segment-item {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 12px;
  font-size: 0.9rem;
  background: var(--color-background);
  gap: 12px;
}

.segment-item.pending {
  border-left: 4px solid var(--color-primary);
}

.segment-item.accepted {
  border-left: 4px solid #1a7f37;
  background: #f0fff4;
}

.segment-item.rejected {
  border-left: 4px solid #cf222e;
  background: #fff5f5;
  opacity: 0.7;
}

.segment-original {
  text-decoration: line-through;
  color: #cf222e;
  opacity: 0.7;
  flex: 1;
}

.segment-modified {
  font-weight: 500;
  color: #1a7f37;
  flex: 1;
}

.issue-card {
  display: flex;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 12px;
  background: var(--color-background);
  gap: 12px;
}

.issue-card.warning {
  border-left: 4px solid #eab308;
}

.issue-card.info {
  border-left: 4px solid #3b82f6;
}

.issue-content h4 {
  margin-bottom: 4px;
  font-size: 0.9rem;
  color: var(--color-text-primary);
}

.verification-note {
  font-size: 0.85rem;
  font-weight: 500;
  color: #eab308;
}

.source-link {
  display: block;
  margin-top: 4px;
  font-size: 0.75rem;
  text-decoration: none;
  color: var(--color-primary);
}

.bias-scorecard {
  display: grid;
  margin-bottom: 16px;
  border-radius: 8px;
  padding: 16px;
  background: var(--color-background);
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.score-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.score-label {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.score-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-primary);
}

.progress-bar {
  overflow: hidden;
  margin-top: 4px;
  border-radius: 3px;
  height: 6px;
  background: #e2e8f0;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
}

.score-text {
  font-size: 0.8rem;
  color: var(--color-text-primary);
}

.btn-primary,
.btn-secondary,
.btn-ghost {
  display: flex;
  align-items: center;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 0.9rem;
  transition: all 0.2s;
  gap: 6px;
  cursor: pointer;
}

.btn-primary {
  border: none;
  color: white;
  background: var(--color-primary);
}

.btn-secondary {
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  background: transparent;
}

.btn-ghost {
  border: none;
  color: var(--color-text-secondary);
  background: transparent;
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-secondary:hover,
.btn-ghost:hover {
  background: rgb(0 0 0 / 5%);
}

.tiny {
  justify-content: center;
  padding: 0;
  width: 28px;
  height: 28px;
}

.btn-accept {
  display: flex;
  justify-content: center;
  align-items: center;
  border: none;
  border-radius: 6px;
  color: #166534;
  background: #dcfce7;
  cursor: pointer;
}

.btn-discard {
  display: flex;
  justify-content: center;
  align-items: center;
  border: none;
  border-radius: 6px;
  color: #991b1b;
  background: #fee2e2;
  cursor: pointer;
}

.empty-results {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: var(--color-text-secondary);
  flex-direction: column;
  gap: 12px;
}

.success-icon {
  color: #22c55e;
}
</style>
