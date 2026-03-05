<template>
  <div class="draft-workspace">
    <div class="workspace-header">
      <h2>{{ $t('createDraft') || 'Create Draft' }}</h2>
    </div>

    <div v-if="!selectedTemplate" class="templates-grid">
      <div class="grid-container">
        <div v-for="tpl in templates" :key="tpl.id" class="template-card" @click="handleSelectTemplate(tpl)">
          <slot name="icon" :icon="tpl.icon">
            <component :is="getIcon(tpl.icon)" :size="24" class="tpl-icon" />
          </slot>
          <div class="tool-info">
            <h3>{{ $t(tpl.id + '_name') || tpl.name }}</h3>
            <p>{{ $t(tpl.id + '_desc') || tpl.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="template-form">
      <div class="form-header">
        <button class="back-link" @click="selectedTemplate = null">
          <ArrowLeft :size="18" />
          <span>{{ $t('backToTemplates') || 'Back' }}</span>
        </button>
        <h2>{{ $t(selectedTemplate.id + '_name') || selectedTemplate.name }}</h2>
      </div>

      <div v-if="draftState !== 'result'" class="form-body">
        <div v-for="input in selectedTemplate.inputs" :key="input.key" class="form-group-row">
          <label>{{ $t(selectedTemplate.id + '_' + input.key + '_label') || input.label }}</label>
          <div class="input-wrapper">
            <div
              v-if="highlightRange && activeInputKey === input.key"
              class="input-highlight-overlay"
              :class="{ 'is-textarea': input.type !== 'text' }"
            >
              <span class="text-pre">{{ formValues[input.key].slice(0, highlightRange.start) }}</span>
              <span class="ash-tint">{{ formValues[input.key].slice(highlightRange.start, highlightRange.end) }}</span>
              <span class="text-post">{{ formValues[input.key].slice(highlightRange.end) }}</span>
            </div>
            <input
              v-if="input.type === 'text'"
              v-model="formValues[input.key]"
              :placeholder="$t(selectedTemplate.id + '_' + input.key + '_placeholder') || input.placeholder"
              class="input-field"
              @input="e => handleFormFieldInput(e, input.key)"
              @click="e => updateDropdownPosition(e, input.key)"
              @keyup="e => updateDropdownPosition(e, input.key)"
            />
            <textarea
              v-else
              v-model="formValues[input.key]"
              :placeholder="$t(selectedTemplate.id + '_' + input.key + '_placeholder') || input.placeholder"
              class="textarea-field"
              rows="3"
              @input="e => handleFormFieldInput(e, input.key)"
              @click="e => updateDropdownPosition(e, input.key)"
              @keyup="e => updateDropdownPosition(e, input.key)"
            ></textarea>
            <SlashCommandDropdown
              v-if="isDropdownVisible && activeInputKey === input.key"
              :items="searchResults"
              :position="dropdownPosition"
              :active-level="activeLevel"
              @select="handleCommandSelect"
              @close="closeDropdown"
            />
          </div>
        </div>
        <button v-show="!loading" class="btn-primary generate-btn" @click="handleGenerateDraft">
          <Sparkles :size="18" />
          <span>{{ $t('generateDraft') || 'Generate Draft' }}</span>
        </button>
        <AppLoading v-if="loading" :text="$t('generating') + '...'" />
      </div>

      <div v-else class="result-view">
        <div class="result-content">{{ generatedContent }}</div>
        <div class="result-actions">
          <button class="btn-primary" @click="handleInsertContent">{{ $t('insert') }}</button>
          <button class="btn-secondary" @click="draftState = 'input'">{{ $t('editInput') || 'Edit Input' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { ArrowLeft, Sparkles } from 'lucide-vue-next'
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { getChatResponse } from '@/api/union'
import AppLoading from '@/components/AppLoading.vue'
import SlashCommandDropdown from '@/components/SlashCommandDropdown.vue'
import { useSlashCommands } from '@/composables/useSlashCommands'
import { useAuthStore } from '@/stores/AuthStore'
import { getIcon } from '@/utils/icons'
import { message as messageUtil } from '@/utils/message'
import useSettingForm from '@/utils/settingForm'
import { templates, WritingTemplate } from '@/utils/templates'

const props = defineProps<{
  loading: boolean
  userIdentity: string
  outputLanguage: string
  extractedText: string
  useAgentMode: boolean
}>()

const emit = defineEmits(['update:loading', 'insert'])

const { t } = useI18n()
const settingForm = useSettingForm()

const selectedTemplate = ref<WritingTemplate | null>(null)
const draftState = ref<'input' | 'result'>('input')
const formValues = reactive<Record<string, string>>({})
const generatedContent = ref('')

const {
  isDropdownVisible,
  dropdownPosition,
  searchResults,
  activeLevel,
  highlightRange,
  handleInput: handleSlashInput,
  closeDropdown,
} = useSlashCommands()

const activeInputKey = ref<string | null>(null)

function handleFormFieldInput(e: Event, key: string) {
  const target = e.target as HTMLInputElement | HTMLTextAreaElement
  activeInputKey.value = key
  handleSlashInput(target.value, target.selectionStart || 0, target)
}

function updateDropdownPosition(e: Event, key: string) {
  const target = e.target as HTMLInputElement | HTMLTextAreaElement
  activeInputKey.value = key
  handleSlashInput(target.value, target.selectionStart || 0, target)
}

function handleCommandSelect(item: any) {
  if (item.id === 'documents' || item.id === 'tools' || !activeInputKey.value) return

  const tag = item.type === 'tool' ? `@Tool:${item.name} ` : `@Document:${item.name} `
  const start = highlightRange.value?.start || 0
  const end = highlightRange.value?.end || 0

  const currentVal = formValues[activeInputKey.value]
  formValues[activeInputKey.value] = currentVal.slice(0, start) + tag + currentVal.slice(end)

  closeDropdown()
}

function handleSelectTemplate(tpl: WritingTemplate) {
  selectedTemplate.value = tpl
  draftState.value = 'input'
  Object.keys(formValues).forEach(k => delete formValues[k])
  tpl.inputs.forEach((i: any) => (formValues[i.key] = ''))
}

async function callLLM(system: string, user: string): Promise<string> {
  const { state: authState } = useAuthStore()
  const nexusProfile = authState.user?.profile?.nexus_profile

  const messages = [new SystemMessage(system), new HumanMessage(user)]
  const settings = settingForm.value
  let config: any = {}
  if (settings.api === 'gemini') {
    config = { provider: 'gemini', geminiAPIKey: settings.geminiAPIKey, geminiModel: settings.geminiModelSelect }
  } else {
    config = {
      provider: 'official',
      config: { apiKey: settings.officialAPIKey, baseURL: settings.officialBasePath, dangerouslyAllowBrowser: true },
      model: settings.officialModelSelect,
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

async function handleGenerateDraft() {
  if (!selectedTemplate.value) return
  const missing = selectedTemplate.value.inputs.find(i => !formValues[i.key])
  if (missing) {
    messageUtil.warning(`${t('pleaseFillIn')} ${missing.label}`)
    return
  }

  emit('update:loading', true)
  const prompt = selectedTemplate.value.promptTemplate(formValues)

  if (props.useAgentMode) {
    try {
      const { getAgentResponse } = await import('@/api/union')
      const { CreateDocumentSetupSchema } = await import('@/schemas/agentSchemas')

      const settings = settingForm.value
      const taskPrompt = `Context (Source of Truth): ${props.extractedText}\n\nTask: ${prompt}`

      await getAgentResponse({
        provider: settings.api as any,
        config: {
          apiKey: settings.officialAPIKey,
          baseURL: settings.officialBasePath,
          dangerouslyAllowBrowser: true,
        },
        geminiAPIKey: settings.geminiAPIKey,
        groqAPIKey: settings.groqAPIKey,
        model: settings.officialModelSelect,
        geminiModel: settings.geminiModelSelect,
        groqModel: settings.groqModelSelect,
        ollamaModel: settings.ollamaModelSelect,
        azureAPIKey: settings.azureAPIKey,
        azureAPIEndpoint: settings.azureAPIEndpoint,
        azureDeploymentName: settings.azureDeploymentName,

        actionSchema: CreateDocumentSetupSchema,
        messages: [{ role: 'user', content: taskPrompt }],
        errorIssue: ref(null),
        loading: ref(true),
        onStream: (text: string) => {
          try {
            const data = JSON.parse(text)
            let md = `# ${data.title}\n\n*${data.description}*\n*Reasoning: ${data.agent_reasoning}*\n\n`
            for (const section of data.sections) {
              md += `## ${section.title}\n${section.content}\n`
              if (section.requires_source_verification && section.source_reference) {
                md += `\n*(Source: ${section.source_reference})*\n`
              }
              md += `\n`
            }
            generatedContent.value = md
          } catch {
            generatedContent.value = text
          }
        },
      })
      draftState.value = 'result'
      messageUtil.success(t('taskCompleted') || 'Document creation completed.')
    } catch (err: any) {
      messageUtil.error(err.message || t('failedToGenerate'))
    } finally {
      emit('update:loading', false)
    }
    return
  }

  const systemPrompt = `You are a professional ${props.userIdentity} assistant. 
    Language: ${props.outputLanguage}.
    Context (Source of Truth): ${props.extractedText ? 'CRITICAL: The provided documents are the ABSOLUTE SOURCE OF TRUTH. You MUST compare every claim, style, and fact against these documents. Your output must strictly adhere to the standards, terminology, and branding found in this context.' : 'No external context available.'}
    
    Task: ${t('writingAssistantSystemPrompt') || 'Write a professional document.'}`

  try {
    const res = await callLLM(systemPrompt, prompt)
    generatedContent.value = res
    draftState.value = 'result'
  } catch (_e) {
    messageUtil.error(t('failedToGenerate'))
  } finally {
    emit('update:loading', false)
  }
}

function handleInsertContent() {
  emit('insert', generatedContent.value)
}
</script>

<style scoped>
.workspace-header {
  margin-bottom: 24px;
}

.templates-grid {
  padding: 10px;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.template-card {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  gap: 12px;
}

.template-card:hover {
  border-color: var(--color-primary);
  background: var(--color-bg-hover);
  transform: translateY(-2px);
}

.tpl-icon {
  color: var(--color-primary);
  flex-shrink: 0;
}

.tool-info h3 {
  margin: 0 0 4px;
  font-size: 1rem;
}

.tool-info p {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

.template-form {
  max-width: 800px;
  margin: 0 auto;
}

.form-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
  font-size: 0.9rem;
}

.form-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-wrapper {
  position: relative;
  width: 100%;
}

.input-field,
.textarea-field {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  position: relative;
  z-index: 2;
}

.input-highlight-overlay {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  bottom: 0;
  pointer-events: none;
  white-space: pre;
  word-wrap: break-word;
  font-family: inherit;
  font-size: 14px;
  line-height: inherit;
  color: transparent;
  z-index: 1;
}

.input-highlight-overlay.is-textarea {
  white-space: pre-wrap;
}

.ash-tint {
  background-color: rgba(128, 128, 128, 0.15);
  border-radius: 3px;
  color: transparent;
}

.generate-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  margin-top: 10px;
}

.result-view {
  background: var(--color-bg-secondary);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.result-content {
  white-space: pre-wrap;
  margin-bottom: 20px;
  font-size: 0.95rem;
  line-height: 1.6;
}

.result-actions {
  display: flex;
  gap: 12px;
}
</style>
