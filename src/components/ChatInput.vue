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
      <textarea
        ref="inputTextarea"
        v-model="modelValue"
        class="chat-input"
        :placeholder="placeholder || $t('chatInputPlaceholder')"
        rows="1"
        :disabled="loading"
        @keydown.enter.exact.prevent="handleEnter"
        @input="handleInput"
      />

      <!-- Voice Input -->
      <VoiceInput
        v-model="modelValue"
        :size="20"
        :show-label="false"
        class="voice-input-control"
        @update:model-value="handleVoiceUpdate"
      />

      <!-- File Search Dropdown -->
      <div v-if="showFileSearch" class="file-search-dropdown glass-blur">
        <div v-if="fileSearchLoading" class="file-item loading">
          <AppLoading :text="$t('searching') || 'Searching files...'" />
        </div>
        <div v-else-if="filteredFiles.length === 0" class="file-item empty">
          <span>{{ $t('noFilesFound') || 'No files found' }}</span>
        </div>
        <div v-for="file in filteredFiles" v-else :key="file.id" class="file-item" @click="selectFile(file)">
          <FileText :size="14" />
          <div class="file-info">
            <span class="file-name">{{ file.name }}</span>
            <span class="file-provider">{{ file.provider }}</span>
          </div>
        </div>
      </div>

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
import { FileText, Send, Sparkles, Square } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import AppLoading from '@/components/AppLoading.vue'
import VoiceInput from '@/components/VoiceInput.vue'
import {
  type DmsFile,
  downloadFile,
  extractFileContent,
  getAccessToken,
  initTokenClient,
  loadGoogleApi,
} from '@/utils/fileProcessing'
import { getDmsConfigFromSettings, searchFiles } from '@/utils/homeFileSearch'
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

// File Search State
const showFileSearch = ref(false)
const filteredFiles = ref<DmsFile[]>([])
const fileSearchLoading = ref(false)

const modelValue = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

function handleInput(e: Event) {
  const target = e.target as HTMLTextAreaElement
  const val = target.value
  adjustHeight()

  // Slash command trigger
  if (val.trim() === '/') {
    showFileSearch.value = true
    triggerFileSearch('')
  } else if (showFileSearch.value && val.includes('/')) {
    const query = val.split('/').pop() || ''
    triggerFileSearch(query)
  } else {
    showFileSearch.value = false
  }
}

async function triggerFileSearch(query: string) {
  fileSearchLoading.value = true
  try {
    const config = getDmsConfigFromSettings(settingForm.value)
    filteredFiles.value = await searchFiles(query, config)
  } catch (error) {
    console.error('File search failed:', error)
  } finally {
    fileSearchLoading.value = false
  }
}

async function selectFile(file: DmsFile) {
  showFileSearch.value = false
  // Remove the slash command from input
  const parts = modelValue.value.split('/')
  parts.pop()
  modelValue.value = parts.join('/').trim()

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
  if (showFileSearch.value && filteredFiles.value.length > 0) {
    selectFile(filteredFiles.value[0])
    return
  }
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

.file-search-dropdown {
  position: absolute;
  bottom: 100%;
  left: 0;
  background-color: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  box-shadow: var(--glass-shadow);
  max-height: 200px;
  overflow-y: auto;
  width: 100%;
  z-index: 50;
  margin-bottom: 8px;
}

.file-item {
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.file-item:hover {
  background-color: var(--color-bg-hover);
}

.file-info {
  display: flex;
  flex-direction: column;
}

.file-name {
  font-size: 0.9em;
  font-weight: 500;
}

.file-provider {
  font-size: 0.75em;
  color: var(--color-text-secondary);
  text-transform: uppercase;
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
