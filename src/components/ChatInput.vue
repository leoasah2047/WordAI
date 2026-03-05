<template>
  <div class="chat-input-wrapper">
    <!-- Predictive Spark (if applicable) -->
    <div v-if="selectionHasPotential" class="predictive-spark-wrapper">
      <button class="predictive-spark-btn" @click="$emit('analyze-selection')">
        <Sparkles :size="16" class="spark-icon" />
        <span>{{ $t('predictiveAssistance') || 'Suggested Improvements' }}</span>
      </button>
    </div>

    <!-- Main Input Box -->
    <div class="input-box-container">
      <div v-if="highlightRange" class="input-highlight-overlay">
        <span class="text-pre">{{ modelValue.slice(0, highlightRange.start) }}</span>
        <span class="ash-tint">{{ modelValue.slice(highlightRange.start, highlightRange.end) }}</span>
        <span class="text-post">{{ modelValue.slice(highlightRange.end) }}</span>
      </div>
      <textarea
        ref="inputTextarea"
        v-model="modelValue"
        class="chat-input"
        :placeholder="placeholder || $t('chatInputPlaceholder')"
        rows="1"
        :disabled="loading"
        @keydown.enter.exact.prevent="handleEnter"
        @input="handleInput"
        @click="updateDropdownPosition"
        @keyup="updateDropdownPosition"
      />

      <!-- Voice Input -->
      <VoiceInput
        v-model="modelValue"
        :size="20"
        :show-label="false"
        class="voice-input-control"
        @update:model-value="handleVoiceUpdate"
      />

      <!-- Slash Command Dropdown -->
      <SlashCommandDropdown
        v-if="isDropdownVisible"
        :items="searchResults"
        :position="dropdownPosition"
        :active-level="activeLevel"
        @select="handleCommandSelect"
        @close="closeDropdown"
      />

      <!-- Action Row -->
      <div class="input-actions-row">
        <div class="left-actions">
          <slot name="left-actions"></slot>
        </div>
        <div class="right-actions">
          <button v-if="loading" class="stop-btn" :title="$t('stop')" @click="$emit('stop')">
            <Square :size="18" />
          </button>
          <button
            v-else
            class="send-btn"
            :title="$t('send')"
            :disabled="!modelValue.trim() || loading"
            @click="handleSend"
          >
            <Send :size="18" />
          </button>
        </div>
      </div>
    </div>

    <!-- Extra Footer Info (Mode specific) -->
    <div class="input-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Send, Sparkles, Square } from 'lucide-vue-next'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import SlashCommandDropdown from '@/components/SlashCommandDropdown.vue'
import VoiceInput from '@/components/VoiceInput.vue'
import { useSlashCommands } from '@/composables/useSlashCommands'
import {
  downloadFile,
  extractFileContent,
  getAccessToken,
  initTokenClient,
  loadGoogleApi,
} from '@/utils/fileProcessing'
import { getDmsConfigFromSettings } from '@/utils/homeFileSearch'
import { message as messageUtil } from '@/utils/message'
import useSettingForm from '@/utils/settingForm'

const props = defineProps<{
  modelValue: string
  loading?: boolean
  placeholder?: string
  selectionHasPotential?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'send', value: string): void
  (e: 'stop'): void
  (e: 'analyze-selection'): void
  (e: 'file-extracted', content: { text: string; fileName: string }): void
}>()

const { t } = useI18n()
const settingForm = useSettingForm()
const inputTextarea = ref<HTMLTextAreaElement | null>(null)

const {
  isDropdownVisible,
  dropdownPosition,
  searchResults,
  activeLevel,
  highlightRange,
  handleInput: handleSlashInput,
  closeDropdown,
} = useSlashCommands()

const modelValue = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

function handleInput(e: Event) {
  const target = e.target as HTMLTextAreaElement
  adjustHeight()
  handleSlashInput(target.value, target.selectionStart, target)
}

function updateDropdownPosition(e: Event) {
  const target = e.target as HTMLTextAreaElement
  handleSlashInput(target.value, target.selectionStart, target)
}

async function handleCommandSelect(item: any) {
  if (item.id === 'documents' || item.id === 'tools') {
    return
  }

  const tag = item.type === 'tool' ? `@Tool:${item.name} ` : `@Document:${item.name} `
  const start = highlightRange.value?.start || 0
  const end = highlightRange.value?.end || 0

  modelValue.value = modelValue.value.slice(0, start) + tag + modelValue.value.slice(end)
  closeDropdown()

  if (item.type === 'document') {
    await selectFile(item)
  }
}

async function selectFile(file: any) {
  messageUtil.info(t('extractingFile', { name: file.name }) || `Extracting ${file.name}...`)

  try {
    const dmsConfig = getDmsConfigFromSettings(settingForm.value)
    let googleAccessToken = ''

    if (file.provider === 'googledrive') {
      await loadGoogleApi()
      initTokenClient({ clientId: dmsConfig.googledrive.clientId, apiKey: dmsConfig.googledrive.apiKey }, () => {})
      googleAccessToken = await getAccessToken()
    }

    const arrayBuffer = await downloadFile(dmsConfig, file, googleAccessToken)
    const content = await extractFileContent(arrayBuffer, file.name, { ocrEnabled: true })

    emit('file-extracted', { text: content.text, fileName: file.name })
    messageUtil.success(t('fileExtracted', { name: file.name }) || `Extracted content from ${file.name}`)
  } catch (error) {
    console.error(`Failed to extract ${file.name}:`, error)
    messageUtil.warning(t('fileExtractionFailed', { name: file.name }) || `Could not extract ${file.name}`)
  }
}

function handleVoiceUpdate(val: string) {
  modelValue.value += (modelValue.value ? ' ' : '') + val
  adjustHeight()
}

function handleEnter() {
  handleSend()
}

function handleSend() {
  if (modelValue.value.trim() && !props.loading) {
    emit('send', modelValue.value.trim())
  }
}

function adjustHeight() {
  if (inputTextarea.value) {
    inputTextarea.value.style.height = 'auto'
    inputTextarea.value.style.height = Math.min(inputTextarea.value.scrollHeight, 120) + 'px'
  }
}

onMounted(() => {
  adjustHeight()
})

watch(
  () => props.modelValue,
  () => {
    nextTick(adjustHeight)
  },
)
</script>

<style scoped>
.chat-input-wrapper {
  position: relative;
  width: 100%;
}

.input-box-container {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  position: relative;
}

.chat-input {
  width: 100%;
  border: none;
  background: transparent;
  resize: none;
  outline: none;
  font-family: inherit;
  font-size: 1em;
  max-height: 120px;
  padding: 0;
  margin-bottom: 8px;
  color: var(--color-text-primary);
  z-index: 2;
  position: relative;
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
  font-size: 1em;
  line-height: inherit;
  color: transparent;
  z-index: 1;
}

.ash-tint {
  background-color: rgba(128, 128, 128, 0.15);
  border-radius: 3px;
  color: transparent;
}

.voice-input-control {
  position: absolute;
  top: 12px;
  right: 12px;
}

.input-actions-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.left-actions,
.right-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.send-btn,
.stop-btn {
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 4px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.send-btn:hover:not(:disabled) {
  background-color: var(--color-primary-dark, #0756b3);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 0.85em;
  color: var(--color-text-secondary);
}

.predictive-spark-wrapper {
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.predictive-spark-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  border: 1px solid #e2e8f0;
  padding: 6px 12px;
  border-radius: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  color: var(--color-primary);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  animation: float 3s ease-in-out infinite;
}

.spark-icon {
  color: #fbbf24;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px) translateX(-50%);
  }
  50% {
    transform: translateY(-5px) translateX(-50%);
  }
}
</style>
