<template>
  <Transition name="fade-slide">
    <div v-if="visible" class="selection-floating-menu glass-panel" :style="positionStyle">
      <div class="menu-content">
        <button class="menu-btn" :title="$t('chatWithSelection')" @click="$emit('action', 'chat')">
          <MessageSquare :size="16" />
          <span>{{ $t('chat') }}</span>
        </button>
        <div class="menu-divider"></div>
        <button class="menu-btn" :title="$t('translateSelection')" @click="$emit('action', 'translate')">
          <Globe :size="16" />
          <span>{{ $t('translate') }}</span>
        </button>
        <button class="menu-btn" :title="$t('polishSelection')" @click="$emit('action', 'polish')">
          <Sparkles :size="16" />
          <span>{{ $t('polish') }}</span>
        </button>
        <button class="menu-btn" :title="$t('summarizeSelection')" @click="$emit('action', 'summary')">
          <FileCheck :size="16" />
          <span>{{ $t('summarize') }}</span>
        </button>
        <button class="menu-btn" :title="$t('grammarCheckSelection')" @click="$emit('action', 'grammar')">
          <CheckCircle :size="16" />
          <span>{{ $t('grammar') }}</span>
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { CheckCircle, FileCheck, Globe, MessageSquare, Sparkles } from 'lucide-vue-next'
import { computed } from 'vue'

const props = defineProps<{
  visible: boolean
  x?: number
  y?: number
}>()

defineEmits<(e: 'action', type: 'chat' | 'translate' | 'polish' | 'summary' | 'grammar') => void>()

const positionStyle = computed(() => {
  if (props.x !== undefined && props.y !== undefined) {
    return {
      position: 'fixed' as const,
      left: `${props.x}px`,
      top: `${props.y}px`,
      transform: 'translate(-50%, -120%)',
    }
  }
  return {
    position: 'fixed' as const,
    bottom: '100px',
    left: '50%',
    transform: 'translateX(-50%)',
  }
})
</script>

<style scoped>
.selection-floating-menu {
  z-index: 1000;
  padding: 6px;
  border-radius: 12px;
  box-shadow:
    0 10px 25px -5px rgba(0, 0, 0, 0.1),
    0 8px 10px -6px rgba(0, 0, 0, 0.1);
  pointer-events: auto;
  border: 1px solid var(--glass-border);
}

.glass-panel {
  background: var(--glass-bg);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
}

.menu-content {
  display: flex;
  align-items: center;
  gap: 4px;
}

.menu-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: transparent;
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 64px;
}

.menu-btn:hover {
  background: var(--color-bg-hover);
  transform: translateY(-2px);
}

.menu-btn:active {
  transform: translateY(0);
}

.menu-btn span {
  font-size: 10px;
  font-weight: 500;
  opacity: 0.8;
}

.menu-divider {
  width: 1px;
  height: 24px;
  background: var(--color-border);
  margin: 0 4px;
  opacity: 0.5;
}

/* Animations */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translate(-50%, -100%) scale(0.9);
}

[data-theme='dark'] .selection-floating-menu {
  background: rgba(30, 41, 59, 0.8);
}
</style>
