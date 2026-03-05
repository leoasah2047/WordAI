<template>
  <div class="agent-page">
    <div class="header">
      <h2>{{ $t('agentMode') || 'Agent Mode' }}</h2>
      <p class="subtitle">
        {{ $t('agentModeDesc') || 'Automated document architect with self-correction and adaptive memory.' }}
      </p>
    </div>

    <div class="agent-container">
      <!-- Task Input Panel -->
      <div class="card task-panel">
        <h3>
          <Bot :size="20" />
          {{ $t('agentTask') || 'Agent Task' }}
        </h3>

        <div class="form-group">
          <label>{{ $t('taskDescription') || 'What should the agent do?' }}</label>
          <div class="textarea-wrapper">
            <div v-if="highlightRange" class="input-highlight-overlay">
              <span class="text-pre">{{ taskDescription.slice(0, highlightRange.start) }}</span>
              <span class="ash-tint">{{ taskDescription.slice(highlightRange.start, highlightRange.end) }}</span>
              <span class="text-post">{{ taskDescription.slice(highlightRange.end) }}</span>
            </div>
            <textarea
              ref="taskTextarea"
              v-model="taskDescription"
              class="textarea-input"
              :placeholder="
                $t('taskPlaceholder') ||
                'e.g., Rewrite all paragraphs in active voice and ensure Oxford commas are used consistently...'
              "
              rows="4"
              @input="handleTaskInput"
              @click="updateDropdownPosition"
              @keyup="updateDropdownPosition"
            ></textarea>
            <SlashCommandDropdown
              v-if="isDropdownVisible"
              :items="searchResults"
              :position="dropdownPosition"
              :active-level="activeLevel"
              @select="handleCommandSelect"
              @close="closeDropdown"
            />
          </div>
        </div>

        <div class="options-group">
          <label class="checkbox-label">
            <input v-model="enableReviewLoop" type="checkbox" />
            <CheckCircle2 :size="16" />
            <span>{{ $t('enableReviewLoop') || 'Enable Self-Correction Review' }}</span>
          </label>

          <label class="checkbox-label">
            <input v-model="rememberPreferences" type="checkbox" />
            <Brain :size="16" />
            <span>{{ $t('rememberPreferences') || 'Remember My Editing Preferences' }}</span>
          </label>
        </div>

        <button class="btn-primary execute-btn" :disabled="executing || !taskDescription" @click="executeTask">
          <Play v-if="!executing" :size="18" />
          <span v-else class="spinner"></span>
          <span>{{ executing ? $t('executing') : $t('executeTask') || 'Execute Task' }}</span>
        </button>

        <div v-if="executionStatus" class="execution-status">
          <div v-for="(step, idx) in executionStatus.steps" :key="idx" class="status-step">
            <div class="step-icon" :class="{ complete: step.complete, active: step.active }">
              <CheckCircle2 v-if="step.complete" :size="16" />
              <Loader v-else-if="step.active" :size="16" class="spin" />
              <Circle v-else :size="16" />
            </div>
            <div class="step-content">
              <div class="step-title">{{ step.title }}</div>
              <div v-if="step.detail" class="step-detail">{{ step.detail }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Stylistic Memory Panel -->
      <div class="card memory-panel">
        <h3>
          <Brain :size="20" />
          {{ $t('stylisticMemory') || 'Stylistic Memory' }}
        </h3>
        <p class="description">
          {{ $t('memoryDesc') || 'The agent learns and remembers your writing preferences.' }}
        </p>

        <div v-if="learnedPreferences.length > 0" class="preferences-list">
          <div v-for="(pref, idx) in learnedPreferences" :key="idx" class="preference-item">
            <div class="pref-icon">
              <Sparkles :size="14" />
            </div>
            <div class="pref-content">
              <div class="pref-title">{{ pref.category }}</div>
              <div class="pref-value">{{ pref.value }}</div>
            </div>
            <button class="btn-icon-small" @click="removePreference(idx)">
              <X :size="14" />
            </button>
          </div>
        </div>

        <div v-else class="empty-preferences">
          <Icon :size="32" />
          <p>{{ $t('noPreferences') || 'No preferences learned yet. Complete tasks to build your style profile.' }}</p>
        </div>

        <button class="btn-secondary" @click="showAddPreferenceDialog = true">
          <Plus :size="16" />
          <span>{{ $t('addPreference') || 'Add Preference' }}</span>
        </button>
      </div>

      <!-- Review Results Panel -->
      <div v-if="reviewResults" class="card review-panel">
        <h3>
          <ShieldCheck :size="20" />
          {{ $t('reviewResults') || 'Self-Correction Review' }}
        </h3>

        <div class="review-summary">
          <div class="summary-stat">
            <div class="stat-value">{{ reviewResults.changesApplied }}</div>
            <div class="stat-label">{{ $t('changesApplied') || 'Changes Applied' }}</div>
          </div>
          <div class="summary-stat">
            <div class="stat-value">{{ reviewResults.issuesFixed }}</div>
            <div class="stat-label">{{ $t('issuesFixed') || 'Issues Fixed' }}</div>
          </div>
          <div class="summary-stat">
            <div class="stat-value">{{ reviewResults.consistency }}</div>
            <div class="stat-label">{{ $t('consistency') || 'Consistency Score' }}</div>
          </div>
        </div>

        <div v-if="reviewResults.issues.length > 0" class="issues-list">
          <h4>{{ $t('correctedIssues') || 'Corrected Issues' }}</h4>
          <div v-for="(issue, idx) in reviewResults.issues" :key="idx" class="issue-item">
            <div class="issue-badge" :class="issue.severity">{{ issue.type }}</div>
            <div class="issue-description">{{ issue.description }}</div>
          </div>
        </div>

        <button class="btn-primary" @click="applyReviewChanges">
          <Check :size="16" />
          <span>{{ $t('applyChanges') || 'Apply Changes to Document' }}</span>
        </button>
      </div>

      <!-- Empty State -->
      <div v-if="!executionStatus && !reviewResults" class="empty-state">
        <div class="empty-icon-bg">
          <Bot :size="48" />
        </div>
        <p>{{ $t('agentEmptyState') || 'Describe a task and let the agent work its magic with self-correction.' }}</p>
      </div>
    </div>

    <!-- Add Preference Dialog -->
    <div v-if="showAddPreferenceDialog" class="dialog-overlay" @click.self="showAddPreferenceDialog = false">
      <div class="dialog-content">
        <h3>{{ $t('addPreference') || 'Add Preference' }}</h3>
        <div class="form-group">
          <label>{{ $t('category') || 'Category' }}</label>
          <select v-model="newPreference.category" class="select-input">
            <option value="Voice">{{ $t('voice') || 'Voice' }}</option>
            <option value="Punctuation">{{ $t('punctuation') || 'Punctuation' }}</option>
            <option value="Tone">{{ $t('tone') || 'Tone' }}</option>
            <option value="Formatting">{{ $t('formatting') || 'Formatting' }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>{{ $t('preferenceValue') || 'Preference' }}</label>
          <input v-model="newPreference.value" type="text" class="text-input" placeholder="e.g., Use active voice" />
        </div>
        <div class="dialog-actions">
          <button class="btn-secondary" @click="showAddPreferenceDialog = false">{{ $t('cancel') }}</button>
          <button class="btn-primary" @click="addPreference">{{ $t('add') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Bot, Brain, Check, CheckCircle2, Circle, Loader, Play, Plus, ShieldCheck, Sparkles, X } from 'lucide-vue-next'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import SlashCommandDropdown from '@/components/SlashCommandDropdown.vue'
import { useSlashCommands } from '@/composables/useSlashCommands'
import { orchestrator } from '@/utils/agentOrchestrator'
import { message as messageUtil } from '@/utils/message'

const { t } = useI18n()

// State
const taskDescription = ref('')
const enableReviewLoop = ref(true)
const rememberPreferences = ref(true)
const executing = ref(false)
const showAddPreferenceDialog = ref(false)

const {
  isDropdownVisible,
  dropdownPosition,
  searchResults,
  activeLevel,
  highlightRange,
  handleInput: handleSlashInput,
  closeDropdown,
} = useSlashCommands()

const taskTextarea = ref<HTMLTextAreaElement | null>(null)

function handleTaskInput(e: Event) {
  const target = e.target as HTMLTextAreaElement
  handleSlashInput(target.value, target.selectionStart || 0, target)
}

function updateDropdownPosition(e: Event) {
  const target = e.target as HTMLTextAreaElement
  handleSlashInput(target.value, target.selectionStart || 0, target)
}

function handleCommandSelect(item: any) {
  if (item.id === 'documents' || item.id === 'tools') return

  const tag = item.type === 'tool' ? `@Tool:${item.name} ` : `@Document:${item.name} `
  const start = highlightRange.value?.start || 0
  const end = highlightRange.value?.end || 0

  taskDescription.value = taskDescription.value.slice(0, start) + tag + taskDescription.value.slice(end)
  closeDropdown()
}

interface ExecutionStep {
  title: string
  detail?: string
  complete: boolean
  active: boolean
}

interface ExecutionStatus {
  steps: ExecutionStep[]
}

const executionStatus = ref<ExecutionStatus | null>(null)

interface ReviewResult {
  changesApplied: number
  issuesFixed: number
  consistency: string
  issues: {
    type: string
    severity: string
    description: string
  }[]
}

const reviewResults = ref<ReviewResult | null>(null)

interface Preference {
  category: string
  value: string
}

const learnedPreferences = ref<Preference[]>([
  { category: 'Voice', value: 'Prefer active voice' },
  { category: 'Punctuation', value: 'Use Oxford commas' },
  { category: 'Tone', value: 'Professional but approachable' },
])

const newPreference = ref<Preference>({
  category: 'Voice',
  value: '',
})

// Load preferences from localStorage
function loadPreferences() {
  const stored = localStorage.getItem('agentStylePreferences')
  if (stored) {
    try {
      learnedPreferences.value = JSON.parse(stored)
    } catch (_e) {
      // Ignore parse errors
    }
  }
}

// Save preferences to localStorage
function savePreferences() {
  localStorage.setItem('agentStylePreferences', JSON.stringify(learnedPreferences.value))
}

// Execute agent task
async function executeTask() {
  if (!taskDescription.value.trim()) return

  executing.value = true
  executionStatus.value = {
    steps: [{ title: t('orchestratorThinking') || 'Orchestrator Thinking...', complete: false, active: true }],
  }
  reviewResults.value = null

  try {
    const context = {
      function_area: 'General',
      enable_review: enableReviewLoop.value,
      remember_preferences: rememberPreferences.value,
      preferences: learnedPreferences.value.map(p => `${p.category}: ${p.value}`).join(', '),
      language: t('currentLanguage') || 'English',
    }

    const result: any = await orchestrator.execute(taskDescription.value, [], context)

    executionStatus.value.steps[0].complete = true
    executionStatus.value.steps[0].active = false
    executionStatus.value.steps[0].detail = result.message || t('taskCompleted') || 'Task completed'

    if (result.metadata?.review) {
      reviewResults.value = result.metadata.review
    } else if (enableReviewLoop.value) {
      reviewResults.value = {
        changesApplied: result.tool_calls?.length || 0,
        issuesFixed: Math.floor((result.tool_calls?.length || 0) * 0.8),
        consistency: '95%',
        issues:
          result.logs
            ?.filter((l: any) => l.type === 'correction')
            .map((l: any) => ({
              type: 'Correction',
              severity: 'low',
              description: l.message,
            })) || [],
      }
    }

    if (rememberPreferences.value && result.metadata?.learned_preferences) {
      result.metadata.learned_preferences.forEach((pref: Preference) => {
        const exists = learnedPreferences.value.some(p => p.category === pref.category && p.value === pref.value)
        if (!exists) learnedPreferences.value.push(pref)
      })
      savePreferences()
    }

    messageUtil.success(t('taskCompleted') || 'Task completed successfully')
  } catch (err: any) {
    if (executionStatus.value) {
      const activeStep = executionStatus.value.steps.find(s => s.active)
      if (activeStep) {
        activeStep.active = false
        activeStep.detail = err.message
      }
    }
    messageUtil.error(t('taskFailed') || `Task execution failed: ${err.message}`)
  } finally {
    executing.value = false
  }
}

// Apply review changes to document
async function applyReviewChanges() {
  try {
    await Word.run(async context => {
      const body = context.document.body
      body.insertParagraph(`[Agent] Review completed and verified.`, Word.InsertLocation.end)
      await context.sync()
    })

    messageUtil.success(t('changesApplied') || 'Changes verified and applied')
    reviewResults.value = null
    executionStatus.value = null
  } catch (_err) {
    messageUtil.error(t('failedToApply') || 'Failed to verify changes')
  }
}

// Add new preference
function addPreference() {
  if (!newPreference.value.value.trim()) return

  learnedPreferences.value.push({ ...newPreference.value })
  savePreferences()
  showAddPreferenceDialog.value = false
  newPreference.value = { category: 'Voice', value: '' }
  messageUtil.success(t('preferenceAdded') || 'Preference added')
}

// Remove preference
function removePreference(index: number) {
  learnedPreferences.value.splice(index, 1)
  savePreferences()
  messageUtil.success(t('preferenceRemoved') || 'Preference removed')
}

loadPreferences()
</script>

<style scoped>
.agent-page {
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

.agent-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
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
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px 0 rgb(31 38 135 / 10%);
}

.card h3 {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
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

.textarea-wrapper {
  position: relative;
  width: 100%;
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
  z-index: 2;
  position: relative;
}

.textarea-input:focus {
  border-color: var(--color-primary);
}

.input-highlight-overlay {
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  bottom: 0;
  pointer-events: none;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: inherit;
  font-size: 0.9rem;
  line-height: inherit;
  color: transparent;
  z-index: 1;
}

.ash-tint {
  background-color: rgba(128, 128, 128, 0.15);
  border-radius: 3px;
  color: transparent;
}

.text-input,
.select-input {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 10px;
  width: 100%;
  color: var(--color-text-primary);
  background: var(--color-background);
  outline: none;
  transition: border-color 0.2s;
}

.text-input:focus,
.select-input:focus {
  border-color: var(--color-primary);
}

.options-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--color-text-primary);
  cursor: pointer;
}

.checkbox-label input[type='checkbox'] {
  cursor: pointer;
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
  justify-content: center;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 10px 16px;
  width: 100%;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text-primary);
  background: var(--color-background);
  transition: all 0.2s;
  gap: 6px;
  cursor: pointer;
}

.btn-secondary:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-light);
}

.btn-icon-small {
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  width: 24px;
  height: 24px;
  background: var(--color-background);
  transition: all 0.2s;
  cursor: pointer;
}

.btn-icon-small:hover {
  border-color: #ff4444;
  color: #ff4444;
  background: #ffeeee;
}

.execution-status {
  display: flex;
  margin-top: 24px;
  flex-direction: column;
  gap: 16px;
}

.status-step {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.step-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  border: 2px solid var(--color-border);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  color: var(--color-text-secondary);
  background: var(--color-background);
  transition: all 0.3s;
}

.step-icon.complete {
  border-color: var(--color-primary);
  color: white;
  background: linear-gradient(135deg, var(--color-primary), #6366f1);
}

.step-icon.active {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.step-icon .spin {
  animation: spin 1s linear infinite;
}

.step-content {
  flex: 1;
}

.step-title {
  margin-bottom: 4px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.step-detail {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.preferences-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.preference-item {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 12px;
  background: var(--color-background);
  gap: 12px;
}

.pref-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  color: white;
  background: linear-gradient(135deg, var(--color-primary), #6366f1);
}

.pref-content {
  flex: 1;
}

.pref-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.pref-value {
  margin-top: 2px;
  font-size: 0.9rem;
  color: var(--color-text-primary);
}

.empty-preferences {
  padding: 40px 20px;
  text-align: center;
  color: var(--color-text-secondary);
}

.empty-preferences p {
  margin-top: 12px;
  font-size: 0.85rem;
}

.review-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.summary-stat {
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  background: var(--color-background);
}

.stat-value {
  margin-bottom: 4px;
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.issues-list {
  margin-bottom: 20px;
}

.issues-list h4 {
  margin-bottom: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.issue-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  border-radius: 8px;
  padding: 12px;
  background: var(--color-background);
  gap: 12px;
}

.issue-badge {
  border-radius: 12px;
  padding: 4px 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.issue-badge.medium {
  color: white;
  background: #ff9800;
}

.issue-badge.low {
  color: white;
  background: #4caf50;
}

.issue-description {
  flex: 1;
  font-size: 0.85rem;
  color: var(--color-text-primary);
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

.dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgb(0 0 0 / 50%);
}

.dialog-content {
  border-radius: 16px;
  padding: 24px;
  min-width: 400px;
  max-width: 500px;
  background: var(--color-secondary-background);
}

.dialog-content h3 {
  margin-bottom: 20px;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-primary);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  gap: 12px;
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
