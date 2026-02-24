<template>
  <div class="generated-image-card">
    <div class="image-wrapper">
      <img :src="src" :alt="prompt" class="generated-img" />
      <div class="actions-overlay">
        <button class="action-btn" :title="$t('insert')" @click.stop="$emit('insert')">
          <FileInput :size="18" />
          <span>{{ $t('insert') }}</span>
        </button>
        <button class="action-btn secondary" :title="$t('download')" @click.stop="$emit('download')">
          <Download :size="18" />
        </button>
      </div>
    </div>
    <div class="image-details">
      <span class="prompt-label">{{ prompt || 'Generated Image' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Download, FileInput } from 'lucide-vue-next'

defineProps<{
  src: string
  prompt?: string
}>()

defineEmits<{
  (e: 'insert'): void
  (e: 'download'): void
}>()
</script>

<style scoped>
.generated-image-card {
  overflow: hidden;
  margin-top: 10px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  width: 300px;
  max-width: 100%;
  background: var(--color-bg-secondary);
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 10%),
    0 2px 4px -1px rgb(0 0 0 / 6%);
  transition: transform 0.2s;
}

.generated-image-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 10%);
}

.image-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  background: #000000;
  aspect-ratio: 1;
}

.generated-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.actions-overlay {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  justify-content: flex-end;
  padding: 10px;
  background: linear-gradient(to top, rgb(0 0 0 / 80%), transparent);
  opacity: 0;
  transition: opacity 0.2s;
  gap: 8px;
}

.generated-image-card:hover .actions-overlay {
  opacity: 1;
}

.action-btn {
  display: flex;
  align-items: center;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  color: white;
  background: var(--color-primary);
  transition: background 0.2s;
  gap: 6px;
  cursor: pointer;
}

.action-btn:hover {
  background: var(--color-primary-dark);
}

.action-btn.secondary {
  padding: 6px;
  background: rgb(255 255 255 / 20%);
  backdrop-filter: blur(4px);
}

.action-btn.secondary:hover {
  background: rgb(255 255 255 / 30%);
}

.image-details {
  border-top: 1px solid var(--color-border);
  padding: 10px;
}

.prompt-label {
  display: -webkit-box;
  overflow: hidden;
  font-size: 12px;
  color: var(--color-text-secondary);
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>
