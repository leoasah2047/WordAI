<template>
  <div class="mode-selector-container">
    <div class="mode-selector-header">
      <span class="mode-label">{{ currentModeLabel }}</span>
      <button class="mode-toggle-btn" @click="isOpen = !isOpen">
        <SlidersHorizontal :size="16" />
      </button>
    </div>

    <div v-if="isOpen" class="mode-dropdown">
      <div
        v-for="mode in modes"
        :key="mode.id"
        class="mode-item"
        :class="{ active: currentMode === mode.id }"
        @click="selectMode(mode.id)"
      >
        <component :is="mode.icon" :size="18" class="mode-icon" />
        <div class="mode-info">
          <span class="mode-name">{{ mode.label }}</span>
          <span class="mode-description">{{ mode.description }}</span>
        </div>
        <Check v-if="currentMode === mode.id" :size="16" class="check-icon" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  Bot,
  Briefcase,
  Check,
  FileEdit,
  Globe,
  MessageSquare,
  Palette,
  SlidersHorizontal,
  Type,
} from 'lucide-vue-next'
import { computed, ref } from 'vue'

import { useAuthStore } from '@/stores/AuthStore'

const props = defineProps<{
  initialMode?: string
}>()

const emit = defineEmits<(e: 'update:mode', mode: string) => void>()

const { getUserIdentity } = useAuthStore()
const isOpen = ref(false)
const currentMode = ref(props.initialMode || 'chat')

const modes = computed(() => {
  const identity = getUserIdentity()
  return [
    {
      id: 'chat',
      label: 'Chat Mode',
      description: 'Standard chat interface',
      icon: MessageSquare,
    },
    {
      id: 'translation',
      label: 'Translation Mode',
      description: 'Translate text with style',
      icon: Globe,
    },
    {
      id: 'consultant',
      label: `${identity} Mode`,
      description: 'Get expert advice',
      icon: Briefcase,
    },
    {
      id: 'agent',
      label: 'Agent Mode',
      description: 'Allow direct edits to document',
      icon: Bot,
    },
    {
      id: 'designer',
      label: 'Designer Mode',
      description: 'Generate images from description',
      icon: Palette,
    },
    {
      id: 'edit',
      label: 'Edit Mode',
      description: 'Refine and polish content',
      icon: FileEdit,
    },
    {
      id: 'typeset',
      label: 'Typeset Mode',
      description: 'Format your document',
      icon: Type,
    },
  ]
})

const currentModeLabel = computed(() => {
  const mode = modes.value.find(m => m.id === currentMode.value)
  return mode ? mode.label : 'Select Mode'
})

function selectMode(modeId: string) {
  currentMode.value = modeId
  emit('update:mode', modeId)
  isOpen.value = false
}
</script>

<style scoped>
.mode-selector-container {
  position: relative;
  display: inline-block;
}

.mode-selector-header {
  display: flex;
  align-items: center;
  border-radius: 4px;
  padding: 4px 8px;
  transition: background-color 0.2s;
  gap: 8px;
  cursor: pointer;
}

.mode-selector-header:hover {
  background-color: var(--color-bg-secondary);
}

.mode-label {
  font-size: 0.9em;
  font-weight: 500;
}

.mode-toggle-btn {
  display: flex;
  align-items: center;
  border: none;
  color: var(--color-text-secondary);
  background: none;
  cursor: pointer;
}

.mode-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1000;
  margin-top: 8px;
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  padding: 6px;
  width: 280px;
  background-color: var(--glass-bg);
  box-shadow: var(--glass-shadow);
  backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
}

.mode-item {
  display: flex;
  align-items: flex-start; /* Align top for multi-line description */
  border-radius: 6px;
  padding: 10px;
  transition: background-color 0.2s;
  gap: 12px;
  cursor: pointer;
}

.mode-item:hover {
  background-color: var(--color-bg-secondary);
}

.mode-item.active {
  background-color: var(--color-bg-active); /* Define this variable or use a light primary color */
}

.mode-icon {
  margin-top: 2px;
  color: var(--color-text-secondary);
}

.mode-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.mode-name {
  font-size: 0.95em;
  font-weight: 600;
  color: var(--color-text-primary);
}

.mode-description {
  margin-top: 2px;
  font-size: 0.8em;
  color: var(--color-text-secondary);
}

.check-icon {
  margin-top: 2px;
  color: var(--color-primary);
}
</style>
