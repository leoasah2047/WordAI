<template>
  <div v-show="messages.length > 0" ref="container" class="chat-messages">
    <div
      v-for="(msg, index) in messages"
      :key="msg.id || index"
      class="message"
      :class="msg instanceof AIMessage ? 'assistant' : 'user'"
    >
      <div class="message-content">
        <div class="message-text">
          <template v-for="(segment, idx) in renderSegments(msg)" :key="idx">
            <div v-if="segment.type === 'text'" class="markdown-body" v-html="renderMarkdown(segment.text)"></div>
            <div v-else-if="segment.type === 'image'" class="generated-image-container">
              <GeneratedImage
                :src="segment.data?.url"
                :prompt="segment.data?.prompt"
                @insert="$emit('insert', `![Generated Image](${segment.data?.url})`, 'append')"
                @download="downloadImage(segment.data?.url, segment.data?.prompt)"
              />
            </div>
            <details v-else-if="segment.type === 'think'" class="think-block">
              <summary>{{ $t('thoughtProcess') }}</summary>
              <pre>{{ segment.text.trim() }}</pre>
            </details>
            <div v-else-if="segment.type === 'action'" class="action-chip-container">
              <button class="action-chip" @click="$emit('execute-action', segment.data)">
                <Zap :size="12" />
                <span>{{ segment.data.label }}</span>
              </button>
            </div>
          </template>

          <!-- Citation Chips -->
          <div v-if="getCitations(msg).length > 0" class="citation-chips">
            <a
              v-for="(url, idx) in getCitations(msg)"
              :key="idx"
              :href="url"
              target="_blank"
              class="citation-chip"
              :title="url"
            >
              <Globe :size="10" />
              <span>Source {{ idx + 1 }}</span>
            </a>
          </div>
        </div>
        <div v-if="msg instanceof AIMessage" class="message-actions">
          <button
            class="action-icon"
            :title="$t('replaceSelectedText')"
            @click="$emit('insert', cleanMessageText(msg), 'replace')"
          >
            <FileText :size="12" />
          </button>
          <button
            class="action-icon"
            :title="$t('appendToSelection')"
            @click="$emit('insert', cleanMessageText(msg), 'append')"
          >
            <Plus :size="12" />
          </button>
          <button class="action-icon" :title="$t('copyToClipboard')" @click="copyToClipboard(cleanMessageText(msg))">
            <Copy :size="12" />
          </button>
        </div>
      </div>
    </div>
    <AppLoading v-if="loading" />
  </div>
</template>

<script lang="ts" setup>
import { AIMessage, Message } from '@langchain/core/messages'
import { Copy, FileText, Globe, Plus, Zap } from 'lucide-vue-next'
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import AppLoading from '@/components/AppLoading.vue'
import GeneratedImage from '@/components/GeneratedImage.vue'
import { message as messageUtil } from '@/utils/message'
import { cleanMessageText, getCitations, renderMarkdown, renderSegments } from '@/utils/messageParsing'

const props = defineProps<{
  messages: Message[]
  loading: boolean
}>()

defineEmits<{
  (e: 'insert', content: string, type: 'replace' | 'append'): void
  (e: 'execute-action', data: any): void
}>()

const { t } = useI18n()
const container = ref<HTMLElement>()

const scrollToBottom = () => {
  if (container.value) {
    container.value.scrollTop = container.value.scrollHeight
  }
}

watch(
  () => props.messages.length,
  () => {
    setTimeout(scrollToBottom, 50)
  },
  { deep: true },
)

onMounted(() => {
  scrollToBottom()
})

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
  messageUtil.success(t('copied'))
}

function downloadImage(url: string, filenamePrefix?: string) {
  const link = document.createElement('a')
  link.href = url
  link.download = `${filenamePrefix || 'generated-image'}-${Date.now()}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<style scoped>
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.message {
  display: flex;
  max-width: 90%;
}

.message.user {
  align-self: flex-end;
}

.message.assistant {
  align-self: flex-start;
}

.message-content {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-lg);
  position: relative;
}

.message.user .message-content {
  background-color: var(--color-primary-light);
  color: var(--color-text-inverse);
}

.message.assistant .message-content {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
}

.message-actions {
  display: flex;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-xs);
  opacity: 0;
  transition: opacity 0.2s;
}

.message:hover .message-actions {
  opacity: 1;
}

.action-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: var(--color-text-secondary);
}

.action-icon:hover {
  background-color: var(--color-bg-hover);
  color: var(--color-primary);
}

.citation-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-sm);
}

.citation-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background-color: var(--color-bg-tertiary);
  border-radius: 12px;
  font-size: 10px;
  color: var(--color-text-secondary);
  text-decoration: none;
  border: 1px solid var(--color-border-primary);
}

.citation-chip:hover {
  background-color: var(--color-bg-hover);
  border-color: var(--color-primary-light);
}

.think-block {
  margin: var(--spacing-sm) 0;
  padding: var(--spacing-xs) var(--spacing-sm);
  background-color: var(--color-bg-tertiary);
  border-left: 3px solid var(--color-primary-light);
  font-size: 0.9em;
}

.think-block summary {
  cursor: pointer;
  font-weight: bold;
  font-size: 0.8em;
  color: var(--color-text-secondary);
}

.think-block pre {
  margin-top: var(--spacing-xs);
  white-space: pre-wrap;
  font-family: var(--font-mono);
  font-size: 0.85em;
}

.action-chip-container {
  margin: var(--spacing-sm) 0;
}

.action-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-pill);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition:
    transform 0.1s,
    background-color 0.2s;
}

.action-chip:hover {
  background-color: var(--color-primary-dark);
  transform: translateY(-1px);
}

.generated-image-container {
  margin: var(--spacing-sm) 0;
}
</style>
