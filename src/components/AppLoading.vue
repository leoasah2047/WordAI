<template>
  <div class="app-loading" :class="{ fullscreen: full }">
    <div class="loading-content">
      <div class="spinner-wrapper">
        <span class="spinner"></span>
        <div class="spinner-ring"></div>
      </div>
      <p v-if="text" class="loading-text">{{ text }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  text?: string
  full?: boolean
}>()
</script>

<style scoped>
.app-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.app-loading.fullscreen {
  position: absolute;
  inset: 0;
  z-index: 1000;
  border-radius: inherit;
  background: rgb(255 255 255 / 40%);
  backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
}

.loading-content {
  display: flex;
  align-items: center;
  border: 1px solid rgb(255 255 255 / 40%);
  border-radius: 16px;
  padding: 24px;
  background: rgb(255 255 255 / 80%);
  box-shadow: 0 8px 32px rgb(0 0 0 / 10%);
  flex-direction: column;
  gap: 16px;
}

.spinner-wrapper {
  position: relative;
  width: 40px;
  height: 40px;
}

.spinner {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  border: 3px solid transparent;
  border-top-color: var(--color-primary);
  border-radius: 50%;
  width: 100%;
  height: 100%;
  animation: spin 1s cubic-bezier(0.5, 0.1, 0.4, 0.9) infinite;
}

.spinner-ring {
  position: absolute;
  top: 0;
  left: 0;
  border: 3px solid var(--color-bg-secondary);
  border-radius: 50%;
  width: 100%;
  height: 100%;
  opacity: 0.5;
}

.loading-text {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--color-text-primary);
  letter-spacing: 0.01em;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
