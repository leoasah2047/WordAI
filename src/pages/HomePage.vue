<template>
  <div class="copilot-chat" :class="{ 'zero-state': history.length === 0 }">
    <!-- History Sidebar -->
    <div class="chat-history-sidebar" :class="{ open: showHistory }">
      <div class="history-header">
        <h3>{{ $t('chatHistory') }}</h3>
        <button class="close-btn" @click="showHistory = false">
          <X :size="16" />
        </button>
      </div>
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
          <button class="delete-btn" @click.stop="deleteChat(chat.id)">
            <Trash2 :size="14" />
          </button>
        </div>
      </div>
    </div>

    <!-- Header (only visible when not in zero state or pushed to top) -->
    <div class="chat-header">
      <div class="chat-title">
        <MessageSquare :size="18" />
        <span>Word AI</span>
      </div>
      <div class="header-actions">
        <!-- Agent Mode Undo/Redo Controls -->
        <template v-if="mode === 'agent'">
          <button
            class="header-btn"
            :disabled="!canUndo"
            :title="$t('undo') + ' (Ctrl+Z)'"
            :aria-label="$t('undo')"
            @click="undoAction"
          >
            <Undo :size="16" />
          </button>
          <button
            class="header-btn"
            :disabled="!canRedo"
            :title="$t('redo') + ' (Ctrl+Y)'"
            :aria-label="$t('redo')"
            @click="redoAction"
          >
            <Redo :size="16" />
          </button>
        </template>

        <button
          class="header-btn"
          :class="{ active: showHistory }"
          :title="$t('chatHistory')"
          :aria-label="$t('chatHistory')"
          @click="showHistory = !showHistory"
        >
          <History :size="16" />
        </button>
        <button
          v-if="history.length > 0"
          class="header-btn"
          :title="$t('exportHistory')"
          :aria-label="$t('exportHistory')"
          @click="exportHistoryToDocument"
        >
          <Download :size="16" />
        </button>
        <button class="header-btn" :title="$t('startNewChat')" :aria-label="$t('startNewChat')" @click="startNewChat">
          <Plus :size="16" />
        </button>

        <div class="header-divider"></div>

        <button
          class="header-btn"
          :class="{ active: isVisible }"
          title="Agent Activity Feed"
          aria-label="Agent Activity Feed"
          @click="toggleVisibility"
        >
          <Activity :size="16" />
        </button>
      </div>
    </div>

    <!-- Chat Messages Container -->
    <ChatMessages
      :messages="displayHistory"
      :loading="loading"
      @insert="insertToDocument"
      @execute-action="executeAction"
    />

    <!-- Center Content for Zero State -->
    <ZeroState
      v-if="history.length === 0"
      v-model:user-input="userInput"
      :mode="mode"
      :quick-actions="quickActions"
      @apply-action="applyQuickAction"
    />

    <!-- Input Area (Centered in Zero State, Fixed Bottom otherwise) -->
    <div class="chat-input-container" :class="{ 'centered-input': history.length === 0 }">
      <ChatInput
        v-model="userInput"
        :loading="loading"
        :selection-has-potential="selectionHasPotential"
        @send="sendMessage"
        @stop="stopGeneration"
        @analyze-selection="analyzeSelectionForImprovement"
        @file-extracted="handleFileExtracted"
      >
        <template #left-actions>
          <ModeSelector :initial-mode="mode" @update:mode="handleModeChange" />
        </template>
        <template #footer>
          <div class="model-controls">
            <select v-model="settingForm.api" class="compact-select">
              <option v-for="item in settingPreset.api.optionObj" :key="item.value" :value="item.value">
                {{ item.label.replace('official', 'OpenAI') }}
              </option>
            </select>
          </div>
          <label class="checkbox-small">
            <input v-model="useWordFormatting" type="checkbox" />
            <span>{{ $t('useWordFormattingLabel') }}</span>
          </label>
          <label class="checkbox-small">
            <input v-model="useSelectedText" type="checkbox" />
            <span>{{ $t('includeSelectionLabel') }}</span>
          </label>
        </template>
      </ChatInput>
    </div>

    <ConfirmationDialog
      :visible="confirmVisible"
      :title="confirmTitle"
      :message="confirmMessage"
      @confirm="handleConfirmDialog"
      @cancel="handleCancelDialog"
    />

    <!-- Agent Activity Feed Sidebar -->
    <AgentActivityFeed />

    <!-- Selection Floating Menu -->
    <SelectionFloatingMenu
      :visible="selectionMenuVisible"
      :x="selectionMenuPosition.x"
      :y="selectionMenuPosition.y"
      @action="handleFloatingMenuAction"
    />
  </div>
</template>

<script lang="ts" setup>
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages'
import { useStorage } from '@vueuse/core'
import {
  Activity,
  BookOpen,
  CheckCircle,
  Download,
  FileCheck,
  Globe,
  History,
  MessageSquare,
  Plus,
  Redo,
  Sparkle,
  Trash2,
  Undo,
  X,
} from 'lucide-vue-next'
import { v4 as uuidv4 } from 'uuid'
import { computed, nextTick, onBeforeMount, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

import { insertFormattedResult, insertResult } from '@/api/common'
import AgentActivityFeed from '@/components/AgentActivityFeed.vue'
import ChatInput from '@/components/ChatInput.vue'
import ChatMessages from '@/components/ChatMessages.vue'
import ConfirmationDialog from '@/components/ConfirmationDialog.vue'
import ModeSelector from '@/components/ModeSelector.vue'
import SelectionFloatingMenu from '@/components/SelectionFloatingMenu.vue'
import ZeroState from '@/components/ZeroState.vue'
import { useAgentActivity } from '@/composables/useAgentActivity'
import { useChatHistory } from '@/composables/useChatHistory'
import { SYSTEM_PROMPTS } from '@/constants/prompts'
import { useAuthStore } from '@/stores/AuthStore'
import { getAgentHistoryManager } from '@/utils/agentHistory'
import { checkAuth, formatDate } from '@/utils/common'
import { buildInPrompt, getBuiltInPrompt } from '@/utils/constant'
import { localStorageKey } from '@/utils/enum'
import { type GeneralToolName } from '@/utils/generalTools'
import { message as messageUtil } from '@/utils/message'
import { cleanMessageText } from '@/utils/messageParsing'
import useSettingForm from '@/utils/settingForm'
import { settingPreset } from '@/utils/settingPreset'
import { type WordToolName } from '@/utils/wordTools'

const settingForm = useSettingForm()

const allWordToolNames: WordToolName[] = [
  'getSelectedText',
  'getDocumentContent',
  'insertText',
  'replaceSelectedText',
  'appendText',
  'insertParagraph',
  'formatText',
  'searchAndReplace',
  'getDocumentProperties',
  'insertTable',
  'insertList',
  'deleteText',
  'clearFormatting',
  'setFontName',
  'insertPageBreak',
  'getRangeInfo',
  'selectText',
  'insertImage',
  'getTableInfo',
  'insertBookmark',
  'goToBookmark',
  'insertContentControl',
  'findText',
  'bulkFindReplace',
  'applyStyle',
  'createSection',
  'formatTable',
  'getDocumentStructure',
]

const allGeneralToolNames: GeneralToolName[] = ['fetchWebContent', 'searchWeb', 'getCurrentDate', 'calculateMath']

// Tool state
const enabledWordTools = ref<WordToolName[]>(loadEnabledWordTools())
const enabledGeneralTools = ref<GeneralToolName[]>(loadEnabledGeneralTools())

function loadEnabledWordTools(): WordToolName[] {
  const stored = localStorage.getItem('enabledWordTools')
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      return parsed.filter((name: string) => allWordToolNames.includes(name as WordToolName))
    } catch {
      return [...allWordToolNames]
    }
  }
  return [...allWordToolNames]
}

function loadEnabledGeneralTools(): GeneralToolName[] {
  const stored = localStorage.getItem('enabledGeneralTools')
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      return parsed.filter((name: string) => allGeneralToolNames.includes(name as GeneralToolName))
    } catch {
      return [...allGeneralToolNames]
    }
  }
  return [...allGeneralToolNames]
}

// Confirmation Dialog State
const confirmVisible = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmCurrentTool = ref('')
const confirmResolve = ref<((value: boolean) => void) | null>(null)
const dontAskAgainMap = useStorage<Record<string, boolean>>('confirmationDontAskAgain', {})

function handleConfirmDialog(dontAsk: boolean) {
  if (dontAsk && confirmCurrentTool.value) {
    dontAskAgainMap.value[confirmCurrentTool.value] = true
  }
  if (confirmResolve.value) {
    confirmResolve.value(true)
    confirmResolve.value = null
  }
}

function handleCancelDialog() {
  if (confirmResolve.value) {
    confirmResolve.value(false)
    confirmResolve.value = null
  }
}

const handleToolConfirmation = async (toolName: string, _args: any): Promise<boolean> => {
  // Destructive tools requiring confirmation
  const destructiveTools = [
    'deleteText',
    'replaceSelectedText',
    'clearFormatting',
    'searchAndReplace',
    'bulkFindReplace',
    'applyStyle',
    'createSection',
    'formatTable',
  ]

  if (!destructiveTools.includes(toolName)) return true
  if (dontAskAgainMap.value[toolName]) return true

  return new Promise(resolve => {
    confirmCurrentTool.value = toolName
    confirmTitle.value = t('confirmAction') || 'Confirm Action'
    confirmMessage.value = t('confirmToolExecution', { tool: toolName }) || `Allow agent to execute ${toolName}?`
    confirmVisible.value = true
    confirmResolve.value = resolve
  })
}

async function getActiveTools() {
  const { createWordTools } = await import('@/utils/wordTools')
  const { createGeneralTools } = await import('@/utils/generalTools')

  const wordTools = createWordTools({
    enabledTools: enabledWordTools.value,
    onPreExecute: handleToolConfirmation,
  })
  const generalTools = createGeneralTools(enabledGeneralTools.value)

  if (mode.value === 'designer') {
    const { createDesignerTools } = await import('@/utils/designerTools')
    const designerTools = createDesignerTools()
    return [...generalTools, ...wordTools, ...designerTools]
  }

  return [...generalTools, ...wordTools]
}

// Chat state
const mode = useStorage(localStorageKey.chatMode, 'chat')
const {
  history,
  chatHistory,
  currentChatId,
  threadId,
  showHistory,
  loadHistory,
  startNewChat: _startNewChat,
  loadChat,
  deleteChat,
  saveCurrentChat,
} = useChatHistory()

const userInput = ref('')
const loading = ref(false)
const messagesContainer = ref<HTMLElement>()
const inputTextarea = ref<HTMLTextAreaElement>()
const abortController = ref<AbortController | null>(null)

function startNewChat() {
  if (loading.value) {
    stopGeneration()
  }
  _startNewChat()
  userInput.value = ''
  customSystemPrompt.value = ''
  selectedPromptId.value = ''
}

// Agent History State
const agentHistoryManager = getAgentHistoryManager()
const canUndo = ref(false)
const canRedo = ref(false)

// Predictive Assistance
const selectionHasPotential = ref(false)
const selectionMenuVisible = ref(false)
const selectedTextContext = ref('')
const selectionMenuPosition = ref<{ x?: number; y?: number }>({})
const selectionTimer = ref<ReturnType<typeof setTimeout> | null>(null)

// Monitor selection for "Zero-Latency" and "Predictive Spark"
async function handleSelectionChange() {
  try {
    await Word.run(async context => {
      const selection = context.document.getSelection()
      selection.load('text')
      await context.sync()

      const hasSelection = selection.text.trim().length > 0
      selectionHasPotential.value = hasSelection

      if (hasSelection) {
        if (!selectionMenuVisible.value && !selectionTimer.value) {
          selectionTimer.value = setTimeout(() => {
            // Because Word.js doesn't give pixel coords easily for context menus,
            // we will use the fallback centered position by omitting x, y.
            selectionMenuPosition.value = {}
            selectionMenuVisible.value = true
            selectionTimer.value = null
          }, 1000)
        }
      } else {
        if (selectionTimer.value) {
          clearTimeout(selectionTimer.value)
          selectionTimer.value = null
        }
        selectionMenuVisible.value = false
      }
    })
  } catch (_e) {
    // Fail silently to avoid interrupting the user's flow
  }
}

async function analyzeSelectionForImprovement() {
  userInput.value = 'Analyze the selected text for improvements in clarity, tone, and grammar.'
  sendMessage()
  selectionHasPotential.value = false
}

// Slash Command State
const translationControlsRef = ref<any>(null)

// Settings
const useWordFormatting = useStorage(localStorageKey.useWordFormatting, true)
const useSelectedText = useStorage(localStorageKey.useSelectedText, true)
const insertType = ref<insertTypes>('replace')

// const errorIssue = ref<boolean | string | null>(false)

const displayHistory = computed(() => {
  return history.value.filter(msg => !(msg instanceof SystemMessage))
})

// Quick actions
const quickActions: {
  key: keyof typeof buildInPrompt
  label: string
  icon: any
}[] = [
  { key: 'translate', label: t('translate'), icon: Globe },
  { key: 'polish', label: t('polish'), icon: Sparkle },
  { key: 'academic', label: t('academic'), icon: BookOpen },
  { key: 'summary', label: t('summary'), icon: FileCheck },
  { key: 'grammar', label: t('grammar'), icon: CheckCircle },
]

function handleModeChange(newMode: string) {
  mode.value = newMode
}

// ===== AGENT HISTORY UNDO/REDO =====

/**
 * Undo the last agent action
 */
async function undoAction() {
  if (!agentHistoryManager.canUndo()) {
    return
  }

  try {
    const success = await agentHistoryManager.undo()
    if (success) {
      updateHistoryState()
      messageUtil.success(t('undoSuccess') || 'Undo successful')
    } else {
      messageUtil.error(t('undoFailed') || 'Undo failed')
    }
  } catch (error) {
    console.error('Undo error:', error)
    messageUtil.error(t('undoFailed') || 'Undo failed')
  }
}

/**
 * Redo the last undone action
 */
async function redoAction() {
  if (!agentHistoryManager.canRedo()) {
    return
  }

  try {
    const success = await agentHistoryManager.redo()
    if (success) {
      updateHistoryState()
      messageUtil.success(t('redoSuccess') || 'Redo successful')
    } else {
      messageUtil.error(t('redoFailed') || 'Redo failed')
    }
  } catch (error) {
    console.error('Redo error:', error)
    messageUtil.error(t('redoFailed') || 'Redo failed')
  }
}

/**
 * Update UI state based on history manager state
 */
function updateHistoryState() {
  canUndo.value = agentHistoryManager.canUndo()
  canRedo.value = agentHistoryManager.canRedo()
}

/**
 * Handle keyboard shortcuts for undo/redo
 */
function handleKeyboardShortcuts(event: KeyboardEvent) {
  // Only handle shortcuts in agent mode
  if (mode.value !== 'agent') return

  // Ctrl+Z or Cmd+Z for Undo
  if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
    event.preventDefault()
    undoAction()
  }

  // Ctrl+Y or Cmd+Shift+Z for Redo
  if (
    ((event.ctrlKey || event.metaKey) && event.key === 'y') ||
    ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'z')
  ) {
    event.preventDefault()
    redoAction()
  }
}

function handleFileExtracted({ text, fileName }: { text: string; fileName: string }) {
  // Add extracted content to context
  if (!userInput.value.includes(text)) {
    userInput.value += `\n\n[Context from ${fileName}]:\n${text}`
  }
}

onMounted(() => {
  window.addEventListener('start-new-chat', startNewChat)

  // Register selection change handler
  if (typeof Office !== 'undefined' && Office.context && Office.context.document) {
    Office.context.document.addHandlerAsync(Office.EventType.DocumentSelectionChanged, handleSelectionChange)
  }
})

onUnmounted(() => {
  window.removeEventListener('start-new-chat', startNewChat)

  // Unregister selection change handler
  if (typeof Office !== 'undefined' && Office.context && Office.context.document) {
    Office.context.document.removeHandlerAsync(Office.EventType.DocumentSelectionChanged, {
      handler: handleSelectionChange,
    })
  }
})

function stopGeneration() {
  if (abortController.value) {
    abortController.value.abort()
    abortController.value = null
  }
  loading.value = false
}

function adjustTextareaHeight() {
  if (inputTextarea.value) {
    inputTextarea.value.style.height = 'auto'
    inputTextarea.value.style.height = Math.min(inputTextarea.value.scrollHeight, 120) + 'px'
  }
}

async function scrollToBottom() {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

async function sendMessage() {
  if (!userInput.value.trim() || loading.value) return
  if (!checkApiKey()) return

  const userMessage = userInput.value.trim()
  userInput.value = ''
  adjustTextareaHeight()

  // Get selected text from Word
  let selectedText = ''
  if (useSelectedText.value) {
    selectedText = await Word.run(async ctx => {
      const range = ctx.document.getSelection()
      range.load('text')
      await ctx.sync()
      return range.text
    })
  }

  // Add user message
  const displayContext = selectedTextContext.value ? `\n\n[Selected Context]:\n${selectedTextContext.value}` : ''
  const wordContext = selectedText ? `\n\n[Selected text from Word: "${selectedText}"]` : ''

  const fullMessage = new HumanMessage(userMessage + displayContext + wordContext)

  // Clear context after sending
  selectedTextContext.value = ''

  scrollToBottom()

  loading.value = true
  abortController.value = new AbortController()

  try {
    await processChat(fullMessage, undefined)
  } catch (error: any) {
    if (error.name === 'AbortError') {
      messageUtil.info(t('generationStop'))
    } else {
      console.error(error)
      messageUtil.error(t('failedToResponse'))
      history.value.pop()
    }
  } finally {
    loading.value = false
    abortController.value = null
    await saveCurrentChat()
  }
}

async function applyQuickAction(actionKey: keyof typeof buildInPrompt, replaceInDoc = false) {
  if (!checkApiKey()) return

  // Get selected text
  const selectedText = await Word.run(async ctx => {
    const range = ctx.document.getSelection()
    range.load('text')
    await ctx.sync()
    return range.text
  })

  if (!selectedText) {
    messageUtil.error(t('selectTextPrompt'))
    return
  }

  const builtInPrompts = getBuiltInPrompt()
  const action = builtInPrompts[actionKey]
  const settings = settingForm.value
  const { replyLanguage: lang } = settings

  const systemMessage = action.system(lang)
  const userMessage = new HumanMessage(action.user(selectedText, lang))

  scrollToBottom()

  loading.value = true
  abortController.value = new AbortController()

  try {
    const result = await processChatWithReturn(userMessage, systemMessage)
    if (replaceInDoc && result) {
      await insertToDocument(result, 'replace')
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      messageUtil.info(t('generationStop'))
    } else {
      console.error(error)
      messageUtil.error(t('failedToProcessAction'))
      // Remove failed message
      history.value.pop()
    }
  } finally {
    loading.value = false
    abortController.value = null
    await saveCurrentChat()
  }
}

/**
 * Version of processChat that returns the final message content
 */
async function processChatWithReturn(userMessage: HumanMessage, systemMessage?: string): Promise<string> {
  await processChat(userMessage, systemMessage)
  const lastMsg = history.value[history.value.length - 1]
  return lastMsg ? getMessageText(lastMsg) : ''
}

async function handleFloatingMenuAction(actionType: 'chat' | 'translate' | 'polish' | 'summary' | 'grammar') {
  const selectedText = await Word.run(async ctx => {
    const range = ctx.document.getSelection()
    range.load('text')
    await ctx.sync()
    return range.text
  })

  if (!selectedText) return

  if (actionType === 'chat') {
    selectedTextContext.value = selectedText
    const abbr = selectedText.length > 50 ? selectedText.substring(0, 47) + '...' : selectedText
    userInput.value = `[Selected: "${abbr}"] `
    selectionMenuVisible.value = false
  } else if (actionType === 'translate') {
    applyQuickAction('translate', true)
    selectionMenuVisible.value = false
  } else if (actionType === 'polish') {
    applyQuickAction('polish', true)
    selectionMenuVisible.value = false
  } else if (actionType === 'summary') {
    applyQuickAction('summary', true)
    selectionMenuVisible.value = false
  } else if (actionType === 'grammar') {
    applyQuickAction('grammar', true)
    selectionMenuVisible.value = false
  }
}

const agentPrompt = (lang: string) => SYSTEM_PROMPTS.DEFAULT + ` Reply in ${lang}.`
const standardPrompt = (lang: string) => SYSTEM_PROMPTS.DEFAULT + ` Reply in ${lang}.`
const designerPrompt = (lang: string) =>
  `You are a creative designer helper. You can generate images. Reply in ${lang}.`

async function processChat(userMessage: HumanMessage, systemMessage?: string) {
  const settings = settingForm.value
  const { replyLanguage: lang, api: provider } = settings

  const currentMode = mode.value
  const isAgentMode = currentMode === 'agent'
  // const isDesignerMode = currentMode === 'designer' // Will use this later

  let finalSystemMessage = customSystemPrompt.value || systemMessage

  if (!finalSystemMessage) {
    if (currentMode === 'agent') {
      finalSystemMessage = agentPrompt(lang)
    } else if (currentMode === 'designer') {
      finalSystemMessage = designerPrompt(lang)
    } else if (currentMode === 'translation') {
      const targetLang = translationControlsRef.value?.targetLanguage || lang
      const style = translationControlsRef.value?.translationStyle || 'professional'
      finalSystemMessage = `You are a professional translator. 
      Task: Translate the following text or prompt into ${targetLang}.
      Tone: ${style}.
      Constraints: 
      1. If the input is a prompt (e.g., "translate this to french"), execute the translation as requested.
      2. If the input is just text and text is selected, translate the selected text.
      3. Maintain the requested tone (${style}).
      4. OUTPUT ONLY the translated text without any meta-talk or explanations.`
    } else {
      finalSystemMessage = standardPrompt(lang)
    }
  }

  const defaultSystemMessage = new SystemMessage(finalSystemMessage)

  // Add user message to history
  history.value.push(userMessage)
  saveCurrentChat() // Fire and forget to save user message immediately

  // Prepare messages for LLM (always include system message first, followed by all history)
  const finalMessages = [defaultSystemMessage, ...history.value]
  // Build provider configuration
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
    groq: {
      provider: 'groq',
      groqAPIKey: settings.groqAPIKey,
      maxTokens: settings.groqMaxTokens,
      temperature: settings.groqTemperature,
      groqModel: settings.groqModelSelect,
    },
    ollama: {
      provider: 'ollama',
      ollamaEndpoint: settings.ollamaEndpoint,
      ollamaModel: settings.ollamaModelSelect,
      temperature: settings.ollamaTemperature,
    },
    azure: {
      provider: 'azure',
      azureAPIKey: settings.azureAPIKey,
      azureAPIEndpoint: settings.azureAPIEndpoint,
      azureDeploymentName: settings.azureDeploymentName,
      azureAPIVersion: settings.azureAPIVersion,
      maxTokens: settings.azureMaxTokens,
      temperature: settings.azureTemperature,
    },
  }

  const currentConfig = providerConfigs[provider]
  if (!currentConfig) {
    messageUtil.error(t('notSupportedProvider'))
    return
  }

  history.value.push(new AIMessage(''))

  const { state: authState } = useAuthStore()
  const nexusProfile = authState.user?.profile?.nexus_profile

  // Use agent mode with tools if enabled or if in specific modes requiring tools
  if (isAgentMode || currentMode === 'designer') {
    const tools = await getActiveTools()

    const { getAgentResponse } = await import('@/api/union')
    await getAgentResponse({
      ...currentConfig,
      recursionLimit: settings.agentMaxIterations,
      messages: finalMessages,
      tools,
      errorIssue,
      loading,
      nexusProfile,
      abortSignal: abortController.value?.signal,
      threadId: threadId.value,
      onStream: (text: string) => {
        const lastIndex = history.value.length - 1
        history.value[lastIndex] = new AIMessage(text)
        scrollToBottom()
      },
      onToolCall: (toolName: string, args: any) => {
        const id = uuidv4()
        addActivity({
          id,
          name: toolName,
          args,
          status: 'pending',
        })
      },
      onToolResult: (toolName: string, result: string) => {
        const pending = [...useAgentActivity().activities.value].find(
          a => a.name === toolName && a.status === 'pending',
        )
        if (pending) {
          updateActivity(pending.id, {
            status: 'success',
            result,
            duration: Date.now() - pending.timestamp,
          })
        }
      },
    })
  } else {
    const { getChatResponse } = await import('@/api/union')
    await getChatResponse({
      ...currentConfig,
      messages: finalMessages,
      errorIssue,
      loading,
      nexusProfile,
      abortSignal: abortController.value?.signal,
      threadId: threadId.value,
      onStream: (text: string) => {
        const lastIndex = history.value.length - 1
        history.value[lastIndex] = new AIMessage(text)
        scrollToBottom()
      },
    })
  }

  if (errorIssue.value) {
    if (typeof errorIssue.value === 'string') {
      messageUtil.error(t(errorIssue.value))
    } else {
      messageUtil.error(t('somethingWentWrong'))
    }
    errorIssue.value = null
    return
  }

  scrollToBottom()
}

/**
 * Executes an interactive action chip
 */
async function executeAction(data: any) {
  if (!data || !data.type) return

  switch (data.type) {
    case 'insertText':
      if (data.text) {
        await insertToDocument(data.text, 'append')
        messageUtil.success(t('insertedToDocument') || 'Text inserted')
      }
      break
    case 'createTable':
      if (data.rows && data.cols) {
        try {
          await Word.run(async context => {
            const range = context.document.getSelection()
            const table = range.insertTable(data.rows, data.cols, Word.InsertLocation.after, data.content || [])
            table.styleBuiltIn = Word.BuiltInStyleName.gridTable4Accent1
            await context.sync()
          })
          messageUtil.success(t('tableCreated') || 'Table created')
        } catch (error) {
          console.error('Failed to create table:', error)
          messageUtil.error(t('failedToCreateTable'))
        }
      }
      break
    case 'summarizeDoc':
      applyQuickAction('summary')
      break
    default:
      console.warn('Unknown action type:', data.type)
  }
}

// ... existing helper functions like insertToDocument, etc. ...
async function insertToDocument(content: string, type: insertTypes) {
  insertType.value = type

  if (useWordFormatting.value) {
    await insertFormattedResult(content, insertType)
  } else {
    insertResult(content, insertType)
  }
}

function checkApiKey() {
  const auth = {
    type: settingForm.value.api as supportedPlatforms,
    apiKey: settingForm.value.officialAPIKey,
    azureAPIKey: settingForm.value.azureAPIKey,
    geminiAPIKey: settingForm.value.geminiAPIKey,
    groqAPIKey: settingForm.value.groqAPIKey,
  }
  if (!checkAuth(auth)) {
    messageUtil.error(t('noAPIKey'))
    return false
  }
  return true
}

// History Handling (Stubbed since it was in original but complex logic might be elsewhere)
// Function prototypes to match template calls

const exportHistoryToDocument = async () => {
  if (history.value.length === 0) return

  try {
    loading.value = true
    messageUtil.info(t('exportingToWord') || 'Exporting chat history to Word...')

    await Word.run(async context => {
      const body = context.document.body

      // Create a section for the chat history
      const section = body.insertParagraph('--- Word AI Chat History ---', Word.InsertLocation.end)
      section.font.bold = true
      section.font.size = 14
      section.font.color = '#0969da'

      const timestamp = body.insertParagraph(`Exported on: ${new Date().toLocaleString()}`, Word.InsertLocation.end)
      timestamp.font.italic = true
      timestamp.font.size = 10

      // Iterate through messages and insert
      for (const msg of history.value) {
        if (msg instanceof SystemMessage) continue

        const role = msg instanceof HumanMessage ? 'User' : 'Assistant'
        const p = body.insertParagraph(`\n[${role}]:`, Word.InsertLocation.end)
        p.font.bold = true

        // Clean text (remove <think> tags for export)
        const text = cleanMessageText(msg)
        body.insertParagraph(text, Word.InsertLocation.end)
      }

      body.insertParagraph('\n--- End of Export ---\n', Word.InsertLocation.end)

      await context.sync()
    })

    messageUtil.success(t('exportSuccess') || 'Chat history exported successfully')
  } catch (err: any) {
    console.error('Export error:', err)
    messageUtil.error(`${t('exportFailed') || 'Failed to export history'}: ${err.message}`)
  } finally {
    loading.value = false
  }
}

// Load Chat History on Mount
onMounted(async () => {
  await loadHistory()
  document.addEventListener('keydown', handleKeyboardShortcuts)
})

onBeforeMount(() => {
  document.removeEventListener('keydown', handleKeyboardShortcuts)
})

// Watch mode changes to manage agent history
watch(mode, (newMode, oldMode) => {
  if (oldMode === 'agent' && newMode !== 'agent') {
    // Clear agent history when leaving agent mode
    agentHistoryManager.clear()
    updateHistoryState()
  }
  if (newMode === 'agent') {
    // Initialize history state when entering agent mode
    updateHistoryState()
  }
})
</script>

<style scoped>
.copilot-chat {
  position: relative;
  display: flex;
  height: 100vh;
  background-color: var(--color-bg-primary);
  flex-direction: column;
}

.copilot-chat.zero-state {
  justify-content: center;
}

/* History Sidebar */
.chat-history-sidebar {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 100;
  display: flex;
  border-right: 1px solid var(--glass-border);
  width: 280px;
  height: 100%;
  background-color: var(--glass-bg);
  box-shadow: var(--glass-shadow);
  transition: transform 0.3s ease;
  backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  transform: translateX(-100%);
  flex-direction: column;
}

.chat-history-sidebar.open {
  transform: translateX(0);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--color-border);
  padding: 16px;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  border-radius: 6px;
  padding: 10px;
  cursor: pointer;
}

.history-item:hover,
.history-item.active {
  background-color: var(--color-bg-hover);
}

.history-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.history-title {
  overflow: hidden;
  font-size: 0.9em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-date {
  font-size: 0.75em;
  color: var(--color-text-secondary);
}

/* Chat Header */
.chat-header {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
}

.chat-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.header-btn {
  border: none;
  border-radius: 4px;
  padding: 8px;
  background: none;
  cursor: pointer;
}

.header-btn:hover {
  background-color: var(--color-bg-secondary);
}
</style>
