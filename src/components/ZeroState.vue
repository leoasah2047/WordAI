<template>
  <div class="zero-state-content">
    <h1 class="zero-state-title">
      {{ title }}
    </h1>

    <!-- Quick Actions (Chips) -->
    <div v-if="mode === 'chat'" class="quick-actions-chips">
      <button
        v-for="action in quickActions"
        :key="action.key"
        class="chip-btn"
        @click="$emit('apply-action', action.key)"
      >
        <component :is="action.icon" :size="14" />
        {{ action.label }}
      </button>
    </div>
    <div v-else-if="mode === 'designer'" class="quick-actions-chips">
      <button
        class="chip-btn"
        @click="
          $emit('update:userInput', t('exampleFuturisticCity') || 'A futuristic cityscape at sunset, vaporwave style')
        "
      >
        <Sparkles :size="14" /> {{ t('exampleFuturisticCity') || 'Futuristic City' }}
      </button>
      <button
        class="chip-btn"
        @click="
          $emit('update:userInput', t('exampleLogo') || 'Professional corporate logo for a tech startup, minimal')
        "
      >
        <Sparkles :size="14" /> {{ t('exampleLogo') || 'Corporate Logo' }}
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Sparkles } from 'lucide-vue-next'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  mode: string
  userInput: string
  quickActions: {
    key: string
    label: string
    icon: any
  }[]
}>()

const emit = defineEmits(['update:userInput', 'apply-action'])

const { t } = useI18n()

const title = computed(() => {
  switch (props.mode) {
    case 'designer':
      return t('createWithImagination') || 'Create with Imagination'
    case 'agent':
      return t('commandAgent') || 'Command the Agent'
    default:
      return t('letsOrganizeThoughts') || "Let's organize your thoughts"
  }
})
</script>

<style scoped>
.zero-state-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  text-align: center;
}

.zero-state-title {
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: var(--spacing-xl);
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.quick-actions-chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--spacing-md);
  max-width: 600px;
}

.chip-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-pill);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow-sm);
}

.chip-btn:hover {
  background-color: var(--color-bg-hover);
  border-color: var(--color-primary-light);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
</style>
