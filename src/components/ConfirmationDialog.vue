<script setup lang="ts">
import { AlertCircle } from 'lucide-vue-next'
import { ref } from 'vue'

defineProps<{
  visible: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  showDontAskAgain?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', dontAskAgain: boolean): void
  (e: 'cancel'): void
}>()

const dontAskAgain = ref(false)

function handleConfirm() {
  emit('confirm', dontAskAgain.value)
  close()
}

function handleCancel() {
  emit('cancel')
  close()
}

function close() {
  emit('update:visible', false)
}
</script>

<template>
  <div v-if="visible" class="confirmation-overlay" @click.self="handleCancel">
    <div class="confirmation-modal">
      <div class="modal-header">
        <AlertCircle class="warning-icon" :size="20" />
        <h3>{{ title }}</h3>
      </div>
      <div class="modal-body">
        <p>{{ message }}</p>
      </div>
      <div class="modal-footer">
        <label v-if="showDontAskAgain" class="checkbox-label">
          <input v-model="dontAskAgain" type="checkbox" />
          <span>Don't ask me again</span>
        </label>
        <div class="action-buttons">
          <button class="cancel-btn" @click="handleCancel">
            {{ cancelText || 'Cancel' }}
          </button>
          <button class="confirm-btn" @click="handleConfirm">
            {{ confirmText || 'Confirm' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.confirmation-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgb(0 0 0 / 50%);
  backdrop-filter: blur(2px);
}

.confirmation-modal {
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  background: var(--color-background);
  box-shadow: 0 4px 24px rgb(0 0 0 / 15%);
  animation: slide-in 0.2s ease-out;
}

@keyframes slide-in {
  from {
    transform: translateY(20px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--color-border);
  padding: 16px;
  background: var(--color-bg-secondary);
  gap: 12px;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.warning-icon {
  color: #bf8700;
}

.modal-body {
  padding: 20px 16px;
  font-size: 14px;
  color: var(--color-text-primary);
  line-height: 1.5;
}

.modal-body p {
  margin: 0;
}

.modal-footer {
  display: flex;
  border-top: 1px solid var(--color-border);
  padding: 16px;
  background: var(--color-bg-secondary);
  flex-direction: column;
  gap: 16px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.cancel-btn,
.confirm-btn {
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
  cursor: pointer;
}

.cancel-btn {
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  background: transparent;
}

.cancel-btn:hover {
  background: var(--color-bg-hover);
}

.confirm-btn {
  border: 1px solid #cf222e;
  color: white;
  background: #cf222e;
}

.confirm-btn:hover {
  border-color: #a40e26;
  background: #a40e26;
}
</style>
