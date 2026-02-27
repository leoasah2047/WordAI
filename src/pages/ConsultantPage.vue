<template>
  <div class="consultant-page">
    <div class="sidebar-panel">
      <!-- Mode Selection Tabs -->
      <div class="mode-tabs">
        <button class="mode-tab" :class="{ active: currentMode === 'draft' }" @click="currentMode = 'draft'">
          <FileText :size="18" />
          <span>{{ $t('createDraft') || 'Create Draft' }}</span>
        </button>
        <button class="mode-tab" :class="{ active: currentMode === 'chat' }" @click="currentMode = 'chat'">
          <MessageSquare :size="18" />
          <span>{{ $t('deepChat') || 'Deep Chat' }}</span>
        </button>
        <button class="mode-tab" :class="{ active: currentMode === 'advisor' }" @click="currentMode = 'advisor'">
          <Award :size="18" />
          <span>{{ $t('advisor') || 'Advisor' }}</span>
        </button>
      </div>

      <!-- Shared Configuration -->
      <div class="config-section">
        <h3 class="config-title">{{ $t('setup') || 'Setup' }}</h3>

        <!-- Source of Truth (Primary Document) -->
        <div class="form-group document-source-wrapper">
          <label>{{ $t('primaryTruth') || 'Primary Truth (.docx only)' }}</label>
          <button class="btn-secondary brand-book-btn" @click="initAdvisorTruth">
            <FileText :size="14" />
            {{ $t('uploadPrimaryTruth') || 'Upload Source of Truth' }}
          </button>
          <input
            ref="primaryTruthFileRef"
            type="file"
            accept=".docx"
            style="display: none"
            @change="onAdvisorTruthUpload"
          />
        </div>

        <!-- Brand Book Extraction -->
        <div class="form-group brand-book-wrapper">
          <label>{{ $t('brandGuidelines') || 'Brand Book (.docx only)' }}</label>
          <button class="btn-secondary brand-book-btn" @click="initAdvisorBrand">
            <FileText :size="14" />
            {{ $t('brandBook') || 'Brand Book Extraction' }}
          </button>
          <input
            ref="brandBookFileRef"
            type="file"
            accept=".docx"
            style="display: none"
            @change="onAdvisorBrandUpload"
          />
        </div>

        <!-- Autonomous Agent Toggle -->
        <div class="form-group agent-toggle-group">
          <label class="checkbox-label">
            <input v-model="useAgentMode" type="checkbox" />
            <Bot :size="16" />
            <span>{{ $t('useAutonomousAgent') || 'Autonomous Agent' }}</span>
          </label>
          <button v-if="useAgentMode" class="btn-link" @click="toggleActivityVisibility">
            {{ $t('viewActivity') || 'View Activity' }}
          </button>
        </div>

        <!-- Document Context (DMS) -->
        <div class="dms-section">
          <button class="btn-secondary dms-toggle" @click="showFilePicker = !showFilePicker">
            <FolderOpen :size="14" />
            {{ $t('selectDmsFiles') || 'Select Files' }}
            <ChevronDown v-if="!showFilePicker" :size="14" />
            <ChevronUp v-else :size="14" />
          </button>

          <!-- Selected Files Display -->
          <div v-if="selectedDmsFiles.length > 0" class="selected-files-list">
            <div v-for="file in selectedDmsFiles" :key="file.id" class="selected-file-chip">
              <FileText :size="12" />
              <span>{{ file.name }}</span>
              <button class="remove-file-btn" @click="removeSelectedFile(file)">
                <X :size="12" />
              </button>
            </div>
            <button class="btn-primary btn-sm btn-extract" :disabled="extracting" @click="extractFilesContent">
              {{ extracting ? '...' : $t('learn') || 'Learn' }}
            </button>
          </div>

          <div v-if="showFilePicker" class="file-picker-wrapper">
            <DmsFilePicker :initial-selected-files="selectedDmsFiles" @selected-files="onFilesSelected" />
          </div>
        </div>
      </div>

      <!-- Chat History (Only in Chat Mode) -->
      <div v-if="currentMode === 'chat'" class="history-section">
        <h3 class="config-title">
          {{ $t('chatHistory') || 'History' }}
          <button class="btn-icon" :title="$t('newChat') || 'New Chat'" @click="startNewChat">
            <Plus :size="16" />
          </button>
        </h3>
        <div class="history-list">
          <div
            v-for="chat in chatHistory"
            :key="chat.id"
            class="history-item"
            :class="{ active: currentChatId === chat.id }"
            @click="loadChat(chat)"
          >
            <div class="history-info">
              <span class="history-title">{{ chat.title }}</span>
              <span class="history-date">{{ formatDate(chat.timestamp) }}</span>
            </div>
            <button class="btn-icon delete-chat" @click.stop="deleteChat(chat.id)">
              <Trash2 :size="14" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="main-panel">
      <!-- Create Draft Mode -->
      <ConsultantDraft
        v-if="currentMode === 'draft'"
        :loading="loading"
        :user-identity="userIdentity"
        :output-language="outputLanguage"
        :extracted-text="extractedText"
        :use-agent-mode="useAgentMode"
        @insert="insertToDoc"
        @update:loading="loading = $event"
      />

      <!-- Advisor Workspace -->
      <ConsultantAdvisor
        v-else-if="currentMode === 'advisor'"
        v-model:active-workflow="activeWorkflow"
        v-model:current-step="currentStep"
        v-model:edit-form-data="editFormData"
        :advisor-workflows="advisorWorkflows"
        :editing-step-index="editingStepIndex"
        :loading="loading"
        :draft-result="draftState === 'result'"
        :advisor-state="advisorState"
        :generated-content="advisorGeneratedContent"
        @start-workflow="startAdvisorWorkflow"
        @add-custom-step="addAdvisorStep"
        @delete-step="deleteAdvisorStep"
        @move-step="({ idx, direction }) => moveAdvisorStep(idx, direction)"
        @edit-step="editAdvisorStep"
        @save-step-edit="saveAdvisorStepEdit"
        @execute-step="executeAdvisorStep"
        @clear-report="clearAdvisorReport"
        @insert-report="insertToDoc(advisorGeneratedContent)"
      />

      <!-- Deep Chat Mode -->
      <div v-else class="chat-workspace">
        <div class="chat-interface">
          <div ref="messagesContainer" class="messages-area">
            <div v-if="messages.length === 0" class="empty-state">
              <MessageSquare :size="48" class="empty-icon" />
              <p>
                {{
                  $t('consultantReady', { identity: userIdentity }) ||
                  `Ready to think deeply with you, as your ${userIdentity}.`
                }}
              </p>
              <p class="sub-text">
                {{ $t('contextLoaded') || 'Context loaded' }}: {{ selectedDmsFiles.length }}
                {{ $t('files') || 'files' }}
              </p>
            </div>
            <div v-for="(msg, index) in messages" :key="index" class="message" :class="msg.role">
              <div class="message-content">
                <div v-if="msg.role === 'assistant'" class="markdown-body" v-html="renderMarkdown(msg.content)"></div>
                <div v-else>{{ msg.content }}</div>
              </div>
              <div v-if="msg.role === 'assistant'" class="message-actions">
                <button :title="$t('insert')" @click="insertToDoc(msg.content)">
                  <Plus :size="14" /> {{ $t('insert') }}
                </button>
              </div>
            </div>
            <!-- Loading indicator at bottom of chat -->
            <div v-if="loading" class="message assistant loading">
              <AppLoading :text="$t('consulting') + '...'" />
            </div>
          </div>

          <ChatInput
            v-model="userQuery"
            :loading="loading"
            @send="sendQuery"
            @stop="stopGeneration"
            @file-extracted="handleFileExtracted"
          >
            <template #footer>
              <div class="chat-context-info">
                <span v-if="selectedDmsFiles.length > 0" class="context-tag">
                  {{ selectedDmsFiles.length }} {{ $t('filesSelected') || 'files' }}
                </span>
              </div>
            </template>
          </ChatInput>
        </div>
      </div>
    </div>
    <AgentActivityFeed />
  </div>
</template>

<script setup lang="ts">
import DOMPurify from 'dompurify'
import {
  Award,
  Bot,
  ChevronDown,
  ChevronUp,
  FileText,
  FolderOpen,
  MessageSquare,
  Plus,
  Trash2,
  X,
} from 'lucide-vue-next'
import MarkdownIt from 'markdown-it'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { QueryResponse } from '@/api/types'
import AgentActivityFeed from '@/components/AgentActivityFeed.vue'
import AppLoading from '@/components/AppLoading.vue'
import ChatInput from '@/components/ChatInput.vue'
import ConsultantAdvisor from '@/components/ConsultantAdvisor.vue'
import ConsultantDraft from '@/components/ConsultantDraft.vue'
import DmsFilePicker from '@/components/DmsFilePicker.vue'
import { useAdvisor } from '@/composables/useAdvisor'
import { useAgentActivity } from '@/composables/useAgentActivity'
import { useAuthStore } from '@/stores/AuthStore'
import { apiClient } from '@/utils/apiClient'
import { ChatConversation, ChatMessage, ChatStorageService } from '@/utils/chatStorage'
import {
  type DmsFile,
  downloadFile,
  type ExtractedImage,
  extractFileContent,
  getAccessToken,
  initTokenClient,
  loadGoogleApi,
} from '@/utils/fileProcessing'
import { message as messageUtil } from '@/utils/message'
import useSettingForm from '@/utils/settingForm'

const { t } = useI18n()
const { toggleVisibility: toggleActivityVisibility } = useAgentActivity()
const md = new MarkdownIt()
const renderMarkdown = (text: string) => DOMPurify.sanitize(md.render(text))
const settingForm = useSettingForm()

// Auth & Identity
const { getUserIdentity } = useAuthStore()
const userIdentity = computed(() => getUserIdentity())

// Layout State
const currentMode = ref<'draft' | 'chat' | 'advisor'>('draft')

// Shared Configuration State
const outputLanguage = ref(settingForm.value.replyLanguage || 'English')
const showFilePicker = ref(false)
const selectedDmsFiles = ref<DmsFile[]>([])
const extracting = ref(false)
const extractedText = ref('')
const extractedImages = ref<ExtractedImage[]>([])
const ocrEnabled = ref(false)

// Chat Logic State
const chatHistory = ref<ChatConversation[]>([])
const currentChatId = ref<string | null>(null)
const messages = ref<ChatMessage[]>([])
const userQuery = ref('')
const loading = ref(false)
const messagesContainer = ref<HTMLElement>()
const tenderContext = ref('') // Used for generic context in chat

const draftState = ref<'input' | 'result'>('input')
const draftGeneratedContent = ref('')
const useAgentMode = ref(true)

const {
  activeWorkflow,
  currentStep,
  editingStepIndex,
  editFormData,
  advisorWorkflows,
  advisorState,
  generatedContent: advisorGeneratedContent,
  primaryTruthFileRef,
  brandBookFileRef,
  startWorkflow: startAdvisorWorkflow,
  addCustomStep: addAdvisorStep,
  deleteStep: deleteAdvisorStep,
  moveStep: moveAdvisorStep,
  editStep: editAdvisorStep,
  saveStepEdit: saveAdvisorStepEdit,
  executeStep: executeAdvisorStep,
  clearReport: clearAdvisorReport,
  startPrimaryTruth: initAdvisorTruth,
  handlePrimaryTruthUpload: onAdvisorTruthUpload,
  startBrandBook: initAdvisorBrand,
  handleBrandBookUpload: onAdvisorBrandUpload,
} = useAdvisor(extractedText, outputLanguage, userIdentity, useAgentMode, loading)

// getIcon is now imported from @/utils/icons
// Removed functionArea and styleAuthor computed properties

onMounted(async () => {
  await loadHistory()
})

watch(currentMode, async newMode => {
  if (newMode === 'chat') {
    if (!currentChatId.value) {
      startNewChat()
    }
    await loadHistory()
  }
})

// --- Chat History Methods ---
async function loadHistory() {
  chatHistory.value = await ChatStorageService.getConversations()
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString()
}

async function startNewChat() {
  const newChat = ChatStorageService.createNewConversation()
  // Pre-fill with current config
  newChat.context.selectedFiles = [...selectedDmsFiles.value]
  newChat.context.extractedText = extractedText.value
  newChat.context.extractedImages = [...extractedImages.value]
  newChat.context.outputLanguage = outputLanguage.value
  newChat.context.tenderContext = tenderContext.value

  await ChatStorageService.saveConversation(newChat)
  chatHistory.value.unshift(newChat)
  loadChat(newChat)
}

async function loadChat(chat: ChatConversation) {
  currentChatId.value = chat.id
  messages.value = chat.messages
  // Restore context
  extractedText.value = chat.context.extractedText || ''
  selectedDmsFiles.value = chat.context.selectedFiles ? [...chat.context.selectedFiles] : []
  extractedImages.value = chat.context.extractedImages ? [...chat.context.extractedImages] : []
  outputLanguage.value = chat.context.outputLanguage || 'English'
  tenderContext.value = chat.context.tenderContext || ''
}

async function deleteChat(id: string) {
  await ChatStorageService.deleteConversation(id)
  if (currentChatId.value === id) {
    startNewChat()
  } else {
    await loadHistory()
  }
}

async function saveCurrentChat() {
  if (!currentChatId.value) return
  const chat = await ChatStorageService.loadConversation(currentChatId.value)
  if (chat) {
    chat.messages = messages.value
    chat.updatedAt = Date.now()
    chat.context.extractedText = extractedText.value
    chat.context.selectedFiles = [...selectedDmsFiles.value]
    chat.context.extractedImages = [...extractedImages.value]
    chat.context.outputLanguage = outputLanguage.value
    chat.context.tenderContext = tenderContext.value

    if (messages.value.length > 0 && chat.title === 'New Conversation') {
      // Generate simple title from first message
      chat.title = messages.value[0].content.substring(0, 30) + (messages.value[0].content.length > 30 ? '...' : '')
    }
    await ChatStorageService.saveConversation(chat)
    await loadHistory()
  }
}

// --- DMS Methods ---
function getDmsConfig() {
  return {
    erpnext: {
      url: settingForm.value.erpnextUrl || '',
      apiKey: settingForm.value.erpnextApiKey || '',
      apiSecret: settingForm.value.erpnextApiSecret || '',
    },
    googledrive: {
      clientId: settingForm.value.googleClientId || '',
      apiKey: settingForm.value.googleApiKey || '',
    },
  }
}

function onFilesSelected(files: DmsFile[]) {
  selectedDmsFiles.value = files
  showFilePicker.value = false
}

function removeSelectedFile(file: DmsFile) {
  selectedDmsFiles.value = selectedDmsFiles.value.filter(f => f.id !== file.id)
}

async function extractFilesContent() {
  if (selectedDmsFiles.value.length === 0) return

  extracting.value = true
  extractedText.value = ''
  extractedImages.value = []

  const config = getDmsConfig()
  let combinedText = ''
  const allImages: ExtractedImage[] = []
  let googleAccessToken = ''

  if (selectedDmsFiles.value.some(f => f.provider === 'googledrive')) {
    try {
      await loadGoogleApi()
      initTokenClient({ clientId: settingForm.value.googleClientId, apiKey: settingForm.value.googleApiKey }, () => {})
      googleAccessToken = await getAccessToken()
    } catch (err) {
      console.error('Failed to get Google access token:', err)
      extracting.value = false
      return
    }
  }

  for (const file of selectedDmsFiles.value) {
    try {
      const arrayBuffer = await downloadFile(config, file, googleAccessToken)
      const content = await extractFileContent(arrayBuffer, file.name, { ocrEnabled: ocrEnabled.value })

      combinedText += `\n\n=== ${file.name} ===\n${content.text}`
      allImages.push(...content.images)
    } catch (error) {
      console.error(`Failed to extract ${file.name}:`, error)
      combinedText += `\n\n=== ${file.name} ===\n[Error extracting content]`
    }
  }

  extractedText.value = combinedText.trim()
  extractedImages.value = allImages
  extracting.value = false

  if (currentMode.value === 'chat' && currentChatId.value) {
    saveCurrentChat()
  }
}

// --- Chat Interface Logic ---
function handleFileExtracted({ text, fileName }: { text: string; fileName: string }) {
  if (!extractedText.value.includes(text)) {
    extractedText.value += `\n\n=== ${fileName} ===\n${text}`
    messageUtil.success(t('addedToContext', { name: fileName }) || `Added ${fileName} to context`)
  }
}

async function sendQuery() {
  if (!userQuery.value.trim() || loading.value) return

  const query = userQuery.value
  messages.value.push({ role: 'user', content: query, timestamp: Date.now() })
  userQuery.value = ''
  loading.value = true
  await saveCurrentChat()

  await nextTick()
  if (messagesContainer.value) messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight

  let fullContext = tenderContext.value
  if (extractedText.value) {
    fullContext = fullContext ? `${fullContext}\n\n${extractedText.value}` : extractedText.value
  }

  try {
    const data = await apiClient.post<QueryResponse>(
      '/query',
      {
        query,
        tender_context: fullContext,
        language: outputLanguage.value,
        top_k: 4,
        sources: selectedDmsFiles.value.map(f => f.name),
        has_images: extractedImages.value.length > 0,
        image_count: extractedImages.value.length,
      },
      {
        headers: {
          'x-google-api-key': settingForm.value.geminiAPIKey || '',
        },
      },
    )

    messages.value.push({ role: 'assistant', content: data.response, timestamp: Date.now() })
    await saveCurrentChat()
  } catch (error: any) {
    console.error(error)
    const errorMsg = error.message || t('consultantError') || 'Error connecting to Consultant Backend.'
    messages.value.push({
      role: 'assistant',
      content: errorMsg,
      timestamp: Date.now(),
    })
  } finally {
    loading.value = false
    await nextTick()
    if (messagesContainer.value) messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

function stopGeneration() {
  loading.value = false
}

async function insertToDoc(text: string) {
  try {
    await Word.run(async context => {
      const selection = context.document.getSelection()
      selection.insertText(text, Word.InsertLocation.replace)
      await context.sync()
    })
  } catch (e) {
    console.error('Error inserting text', e)
  }
}

// --- Draft Logic Methods ---
// Draft Logic moved to ConsultantDraft.vue

async function insertContent() {
  await insertToDoc(draftGeneratedContent.value)
}
</script>

<style scoped>
.consultant-page {
  display: flex;
  overflow: hidden;
  width: 100%;
  height: 100vh;
  color: var(--color-text-primary);
  background-color: var(--color-background);
}

.sidebar-panel {
  display: flex;
  border-right: 1px solid var(--color-border);
  width: 300px;
  background: var(--color-secondary-background);
  flex-direction: column;
  flex-shrink: 0;
}

.mode-tabs {
  display: flex;
  border-bottom: 1px solid var(--color-border);
}

.mode-tab {
  display: flex;
  justify-content: center;
  align-items: center;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  background: transparent;
  transition: all 0.2s;
  flex: 1;
  gap: 8px;
  cursor: pointer;
}

.mode-tab.active {
  border-bottom-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-light);
}

.config-section {
  overflow-y: auto;
  border-bottom: 1px solid var(--color-border);
  padding: 15px;
}

.config-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-size: 0.8rem;
}

.select-input {
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 6px 8px;
  width: 100%;
  color: var(--color-text-primary);
  background: var(--color-input-background);
}

/* DMS Styles */
.dms-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding: 8px;
  width: 100%;
}

.selected-files-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.selected-file-chip {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.8rem;
  background: var(--color-input-background);
}

.remove-file-btn {
  border: none;
  color: var(--color-text-secondary);
  background: none;
  cursor: pointer;
}

.remove-file-btn:hover {
  color: var(--color-error);
}

.btn-extract {
  margin-top: 5px;
  width: 100%;
}

/* History Styles */
.history-section {
  overflow-y: auto;
  padding: 15px;
  flex: 1;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
  border-radius: 6px;
  padding: 10px;
  transition: background 0.2s;
  cursor: pointer;
}

.history-item:hover {
  background: var(--color-primary-light);
}

.history-item.active {
  border-left: 3px solid var(--color-primary);
  background: var(--color-primary-light);
}

.history-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.history-title {
  overflow: hidden;
  font-size: 0.9rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-date {
  font-size: 0.7rem;
  color: var(--color-text-secondary);
}

.btn-icon {
  border: none;
  color: var(--color-text-secondary);
  background: none;
  cursor: pointer;
}

.delete-chat:hover {
  color: var(--color-error);
}

/* Main Panel */
.main-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Draft Workspace */
.draft-workspace {
  display: flex;
  overflow-y: auto;
  padding: 20px;
  flex: 1;
  flex-direction: column;
}

.workspace-header {
  margin-bottom: 20px;
}

.templates-grid {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.template-card {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  background: var(--color-input-background);
  transition: all 0.2s;
  cursor: pointer;
  flex-direction: column;
}

.template-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgb(0 0 0 / 10%);
}

.tpl-icon {
  margin-bottom: 12px;
  color: var(--color-primary);
}

.template-card h3 {
  margin-bottom: 8px;
  font-size: 1rem;
}

.template-card p {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

/* Template Form */
.template-form {
  display: flex;
  margin: 0 auto;
  width: 100%;
  max-width: 800px;
  flex: 1;
  flex-direction: column;
}

.form-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.back-link {
  display: flex;
  align-items: center;
  border: none;
  color: var(--color-text-secondary);
  background: none;
  gap: 5px;
  cursor: pointer;
}

.form-group-row {
  margin-bottom: 15px;
}

.form-group-row label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.input-field,
.textarea-field {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 10px;
  width: 100%;
  color: var(--color-text-primary);
  background: var(--color-input-background);
}

.generate-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 10px;
  padding: 12px;
  width: 100%;
  gap: 8px;
}

.result-content {
  overflow-y: auto;
  margin-bottom: 15px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 20px;
  min-height: 300px;
  white-space: pre-wrap;
  background: var(--color-input-background);
  flex: 1;
}

.result-actions {
  display: flex;
  gap: 10px;
}

.btn-primary,
.btn-secondary {
  border: 1px solid transparent;
  border-radius: 6px;
  padding: 10px 15px;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary {
  color: white;
  background: var(--color-primary);
}

.btn-secondary {
  border-color: var(--color-border);
  color: var(--color-text-primary);
  background: transparent;
}

/* Chat Workspace */
.chat-workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chat-interface {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.messages-area {
  display: flex;
  overflow-y: auto;
  padding: 20px;
  flex: 1;
  flex-direction: column;
  gap: 20px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  opacity: 0.6;
  flex: 1;
  flex-direction: column;
}

.empty-icon {
  margin-bottom: 15px;
  color: var(--color-primary);
}

.sub-text {
  margin-top: 5px;
  font-size: 0.8rem;
}

.message {
  display: flex;
  flex-direction: column;
  max-width: 85%;
  align-self: flex-start;
}

.message.user {
  align-self: flex-end;
  align-items: flex-end;
}

.message-content {
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 12px 16px;
  background: var(--color-input-background);
}

.message.user .message-content {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-light);
}

.message-actions {
  display: flex;
  margin-top: 5px;
  gap: 5px;
}

.input-area {
  display: flex;
  align-items: flex-end;
  border-top: 1px solid var(--color-border);
  padding: 15px;
  background: var(--color-secondary-background);
  gap: 10px;
}

.query-input {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 10px;
  height: 50px;
  max-height: 150px;
  color: var(--color-text-primary);
  background: var(--color-input-background);
  resize: none;
  flex: 1;
}

.send-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  color: white;
  background: var(--color-primary);
  cursor: pointer;
}

.send-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.compliance-btn {
  margin-left: 8px;
}

/* Advisor Workspace */
.advisor-workspace {
  display: flex;
  height: 100%;
  flex-direction: column;
}

.advisor-content {
  overflow-y: auto;
  padding: 20px;
  flex: 1;
}

.workflow-list {
  display: grid;
  gap: 16px;
  margin-top: 20px;
}

.workflow-card {
  display: flex;
  align-items: center;
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  padding: 16px;
  background: var(--glass-bg);
  transition: all 0.2s ease;
  gap: 16px;
  cursor: pointer;
}

.workflow-card:hover {
  border-color: var(--color-primary);
  transform: translateX(4px);
  box-shadow: var(--glass-shadow);
}

.wf-icon-bg {
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  width: 40px;
  height: 40px;
  color: var(--color-primary);
  background: rgb(var(--color-primary-rgb), 0.1);
}

.wf-info h4 {
  margin: 0;
  font-size: 1.1em;
}

.wf-info p {
  margin: 4px 0 0;
  font-size: 0.9em;
  color: var(--color-text-secondary);
}

.wf-arrow {
  margin-left: auto;
  opacity: 0.5;
}

.active-workflow {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.workflow-steps {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.workflow-step {
  position: relative;
  display: flex;
  align-items: center;
  font-size: 0.85em;
  color: var(--color-text-secondary);
  flex: 1;
  gap: 8px;
}

.step-num {
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  background: var(--color-bg-secondary);
}

.workflow-step.active .step-num {
  border-color: var(--color-primary);
  color: white;
  background: var(--color-primary);
}

.workflow-step.completed .step-num {
  border-color: var(--color-success);
  color: white;
  background: var(--color-success);
}

.step-workspace {
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 24px;
  background: var(--color-bg-secondary);
}

.step-instruction {
  margin-bottom: 20px;
  font-size: 1.1em;
  font-weight: 500;
}

.step-input {
  margin-bottom: 20px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 12px;
  width: 100%;
  min-height: 150px;
  background: var(--color-bg-primary);
}

/* Dynamic Step Management UI */
.workflow-steps-management {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 16px;
  background: var(--color-bg-secondary);
  gap: 15px;
}

.steps-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.steps-scroll-wrapper {
  display: flex;
  flex-direction: column;
  max-height: 300px;
  overflow-y: auto;
  gap: 8px;
}

.workflow-step-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 10px;
  background: var(--color-bg-primary);
  transition: all 0.2s;
  cursor: pointer;
}

.workflow-step-item.active {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.step-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.step-edit-input {
  border: 1px solid var(--color-primary);
  border-radius: 4px;
  padding: 2px 5px;
  width: 100%;
  font-size: 0.9em;
}

.step-controls {
  display: flex;
  gap: 4px;
}

.delete-btn:hover {
  color: var(--color-error);
}

.edit-instruction-zone {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.edit-instruction-zone label {
  font-weight: 600;
  font-size: 0.9em;
}

.execution-placeholder {
  text-align: center;
  padding: 20px;
  opacity: 0.7;
}

.step-actions {
  display: flex;
  justify-content: space-between;
}

/* Agent Toggle Styles */
.agent-toggle-group {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  border-top: 1px solid var(--color-border);
  padding: 8px 0;
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

.btn-link {
  border: none;
  padding: 0;
  font-size: 0.75rem;
  text-decoration: underline;
  color: var(--color-primary);
  background: none;
  cursor: pointer;
}

.btn-link:hover {
  color: var(--color-primary-dark);
}
</style>
