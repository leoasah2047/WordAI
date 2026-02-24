<template>
  <div class="translation-controls">
    <div class="control-group">
      <label class="control-label">{{ $t('targetLanguage') || 'Target Language' }}</label>
      <select v-model="targetLanguage" class="control-select">
        <option v-for="(name, code) in languageMap" :key="code" :value="code">
          {{ name }}
        </option>
      </select>
    </div>

    <div class="control-group">
      <label class="control-label">{{ $t('translationStyle') || 'Translation Style' }}</label>
      <select v-model="translationStyle" class="control-select">
        <option v-for="style in TRANSLATION_STYLES" :key="style.id" :value="style.id">
          {{ style.label }}
        </option>
      </select>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useStorage } from '@vueuse/core'

import { languageMap, TRANSLATION_STYLES } from '@/utils/constant'
import { localStorageKey } from '@/utils/enum'

const targetLanguage = useStorage(localStorageKey.replyLanguage || 'replyLanguage', 'en')
const translationStyle = useStorage('translationStyle', 'professional')

defineExpose({
  targetLanguage,
  translationStyle,
})
</script>

<style scoped>
.translation-controls {
  display: flex;
  margin-bottom: 8px;
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  padding: 12px;
  background-color: var(--glass-bg);
  box-shadow: var(--glass-shadow);
  gap: 16px;
  backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
}

.control-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.control-label {
  font-size: 0.75em;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.control-select {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 6px 8px;
  width: 100%;
  font-size: 0.9em;
  color: var(--color-text-primary);
  background-color: var(--color-bg-secondary);
  outline: none;
  transition: border-color 0.2s;
}

.control-select:focus {
  border-color: var(--color-primary);
}
</style>
