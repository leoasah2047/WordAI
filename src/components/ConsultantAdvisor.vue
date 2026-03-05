<template>
  <div class="advisor-workspace">
    <div class="workspace-header">
      <h2>{{ $t('advisorWorkflows') || 'Advisor Workflows' }}</h2>
    </div>
    <div class="advisor-content">
      <div v-if="!activeWorkflow" class="workflow-selection">
        <p class="section-desc">{{ $t('workflowDesc') || 'Select a structured expert process to follow.' }}</p>
        <div class="workflow-list">
          <div v-for="wf in advisorWorkflows" :key="wf.id" class="workflow-card" @click="emit('start-workflow', wf)">
            <div class="wf-icon-bg">
              <component :is="getIcon(wf.icon)" :size="20" />
            </div>
            <div class="wf-info">
              <h4>{{ wf.name }}</h4>
              <p>{{ wf.description }}</p>
            </div>
            <ArrowRight :size="16" class="wf-arrow" />
          </div>
        </div>
      </div>
      <div v-else class="active-workflow">
        <div class="workflow-header-sticky">
          <button class="back-link" @click="emit('update:activeWorkflow', null)">
            <ArrowLeft :size="16" /> {{ $t('allWorkflows') || 'All' }}
          </button>
          <h3>{{ activeWorkflow.name }}</h3>
        </div>

        <div class="vertical-roadmap">
          <div class="roadmap-track"></div>
          <div class="steps-container scroll-custom">
            <div
              v-for="(step, idx) in activeWorkflow.steps"
              :key="step.id || idx"
              class="roadmap-step"
              :class="{
                active: currentStep === idx,
                loading: step.status === 'loading',
                completed: step.status === 'completed',
                'secondary-step': step.isSecondary,
              }"
            >
              <div class="step-marker" @click="emit('update:currentStep', idx)">
                <div v-if="step.status === 'loading'" class="spinner"></div>
                <Check v-else-if="step.status === 'completed'" :size="14" />
                <span v-else>{{ idx + 1 }}</span>
              </div>

              <div class="step-content-card">
                <div class="step-main-info" @click="emit('update:currentStep', idx)">
                  <div class="step-title-row">
                    <div v-if="editingStepIndex !== idx" class="step-title">{{ step.title }}</div>
                    <input
                      v-else
                      :value="editFormData.title"
                      class="step-edit-input"
                      @input="
                        emit('update:editFormData', {
                          ...editFormData,
                          title: ($event.target as HTMLInputElement).value,
                        })
                      "
                      @click.stop
                      @keyup.enter="emit('save-step-edit')"
                      @blur="emit('save-step-edit')"
                    />
                    <div class="step-actions-mini">
                      <button
                        title="Execute Step"
                        class="btn-execute"
                        :disabled="loading"
                        @click.stop="emit('execute-step', idx)"
                      >
                        <Sparkles :size="14" />
                        {{ $t('execute') || 'Execute' }}
                      </button>
                      <button
                        v-if="!step.isSecondary"
                        class="btn-icon-xs"
                        title="Add Sub-step"
                        @click.stop="emit('add-sub-step', idx)"
                      >
                        <PlusSquare :size="12" />
                      </button>
                      <button class="btn-icon-xs" @click.stop="emit('edit-step', idx)">
                        <Edit3 :size="12" />
                      </button>
                      <button class="btn-icon-xs delete-btn" @click.stop="emit('delete-step', idx)">
                        <Trash2 :size="12" />
                      </button>
                    </div>
                  </div>
                </div>

                <div v-if="currentStep === idx" class="step-expanded-zone">
                  <div class="instruction-edit">
                    <label>{{ $t('expertInstructions') || 'Expert Instructions' }}</label>
                    <div class="textarea-container">
                      <div v-if="highlightRange" class="input-highlight-overlay">
                        <span class="text-pre">{{ editFormData.instruction.slice(0, highlightRange.start) }}</span>
                        <span class="ash-tint">{{
                          editFormData.instruction.slice(highlightRange.start, highlightRange.end)
                        }}</span>
                        <span class="text-post">{{ editFormData.instruction.slice(highlightRange.end) }}</span>
                      </div>
                      <textarea
                        ref="stepTextarea"
                        :value="editFormData.instruction"
                        class="step-textarea"
                        placeholder="Add @Tool or @Document reference..."
                        @input="handleTextAreaInput"
                        @blur="emit('save-step-edit')"
                        @click="updateDropdownPosition"
                        @keyup="updateDropdownPosition"
                      ></textarea>
                      <SlashCommandDropdown
                        v-if="isDropdownVisible"
                        :items="searchResults"
                        :position="dropdownPosition"
                        :active-level="activeLevel"
                        @select="handleCommandSelect"
                        @close="closeDropdown"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Add Step Button -->
            <button class="btn-add-step" @click="emit('add-custom-step')">
              <Plus :size="16" />
              {{ $t('addWorkflowStep') || 'Add Step' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, ArrowRight, Check, Edit3, Plus, PlusSquare, Sparkles, Trash2 } from 'lucide-vue-next'
import { ref } from 'vue'

import SlashCommandDropdown from '@/components/SlashCommandDropdown.vue'
import { useSlashCommands } from '@/composables/useSlashCommands'
import { getIcon } from '@/utils/icons'

const props = defineProps<{
  activeWorkflow: any | null
  currentStep: number
  advisorWorkflows: any[]
  editingStepIndex: number | null
  editFormData: { title: string; instruction: string }
  loading: boolean
  draftResult: boolean
  advisorState: 'input' | 'result'
  generatedContent: string
}>()

const emit = defineEmits([
  'update:activeWorkflow',
  'update:currentStep',
  'update:editFormData',
  'start-workflow',
  'add-custom-step',
  'add-sub-step',
  'delete-step',
  'move-step',
  'edit-step',
  'save-step-edit',
  'execute-step',
  'clear-report',
  'insert-report',
])

const {
  isDropdownVisible,
  dropdownPosition,
  searchResults,
  activeLevel,
  highlightRange,
  handleInput: handleSlashInput,
  closeDropdown,
} = useSlashCommands()

const stepTextarea = ref<HTMLTextAreaElement | null>(null)

function handleTextAreaInput(e: Event) {
  const target = e.target as HTMLTextAreaElement
  emit('update:editFormData', {
    ...props.editFormData,
    instruction: target.value,
  })
  handleSlashInput(target.value, target.selectionStart, target)
}

function updateDropdownPosition(e: Event) {
  const target = e.target as HTMLTextAreaElement
  handleSlashInput(target.value, target.selectionStart, target)
}

function handleCommandSelect(item: any) {
  if (item.id === 'documents' || item.id === 'tools') return

  const tag = item.type === 'tool' ? `@Tool:${item.name} ` : `@Document:${item.name} `
  const start = highlightRange.value?.start || 0
  const end = highlightRange.value?.end || 0

  const newInstruction =
    props.editFormData.instruction.slice(0, start) + tag + props.editFormData.instruction.slice(end)

  emit('update:editFormData', {
    ...props.editFormData,
    instruction: newInstruction,
  })
  closeDropdown()
}
</script>

<style scoped>
.advisor-workspace {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: var(--color-text-primary);
}

.workspace-header {
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 16px;
}

.advisor-content {
  flex: 1;
  overflow-y: hidden; /* Controlled by inner scroll */
  display: flex;
  flex-direction: column;
}

/* Workflow Selection list */
.workflow-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px;
}

.workflow-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.workflow-card:hover {
  border-color: var(--color-primary);
  background: var(--color-bg-hover);
  transform: translateX(4px);
}

.wf-icon-bg {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--color-primary-light);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.wf-info h4 {
  margin: 0;
  font-size: 0.95rem;
}

.wf-info p {
  margin: 2px 0 0;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

/* Vertical Roadmap Styling */
.active-workflow {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.workflow-header-sticky {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-link {
  background: none;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
  padding: 4px 8px;
  border-radius: 4px;
}

.back-link:hover {
  background: var(--color-primary-light);
}

.vertical-roadmap {
  position: relative;
  flex: 1;
  overflow: hidden;
  display: flex;
  padding-left: 12px;
}

.roadmap-track {
  position: absolute;
  left: 24px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--color-border);
  z-index: 1;
}

.steps-container {
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
  padding-bottom: 40px;
  z-index: 2;
}

.roadmap-step {
  position: relative;
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.step-marker {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--color-bg-primary);
  border: 2px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
  z-index: 3;
  cursor: pointer;
  transition: all 0.2s;
}

.roadmap-step.active .step-marker {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: white;
  box-shadow: 0 0 0 4px var(--color-primary-light);
}

.roadmap-step.completed .step-marker {
  background: var(--color-success);
  border-color: var(--color-success);
  color: white;
}

.step-content-card {
  flex: 1;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
}

.roadmap-step.active .step-content-card {
  border-color: var(--color-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.step-main-info {
  padding: 12px;
  cursor: pointer;
}

.step-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.step-title {
  font-size: 0.9rem;
  font-weight: 600;
}

.step-edit-input {
  flex: 1;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-primary);
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 0.9rem;
}

.step-actions-mini {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-execute {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 10px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-execute:hover:not(:disabled) {
  background: var(--color-primary-dark);
  filter: brightness(1.1);
}

.btn-execute:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon-xs {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-radius: 4px;
}

.btn-icon-xs:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.step-expanded-zone {
  padding: 0 12px 12px;
  background: var(--color-bg-primary);
  border-top: 1px solid var(--color-border);
}

.instruction-edit {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 12px;
}

.instruction-edit label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.step-textarea {
  width: 100%;
  min-height: 80px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 8px;
  font-size: 0.85rem;
  line-height: 1.4;
  resize: vertical;
  color: var(--color-text-primary);
  z-index: 2;
  position: relative;
}

.secondary-step {
  margin-left: 32px;
  transform: scale(0.95);
  transform-origin: left top;
}

.secondary-step .step-content-card {
  background: var(--color-bg-primary);
  border-style: dashed;
}

.roadmap-step.secondary-step::before {
  content: '';
  position: absolute;
  left: -20px;
  top: 13px;
  width: 12px;
  height: 2px;
  background: var(--color-border);
}

.textarea-container {
  position: relative;
  width: 100%;
}

.input-highlight-overlay {
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  bottom: 0;
  pointer-events: none;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: inherit;
  font-size: 0.85rem;
  line-height: 1.4;
  color: transparent;
  z-index: 1;
}

.ash-tint {
  background-color: rgba(128, 128, 128, 0.15);
  border-radius: 3px;
  color: transparent;
}

.btn-add-step {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  background: transparent;
  border: 1px dashed var(--color-border);
  border-radius: 8px;
  color: var(--color-text-secondary);
  font-size: 0.85rem;
  cursor: pointer;
  margin-top: 8px;
}

.btn-add-step:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-light);
}

/* Spinner for loading state */
.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Custom Scrollbar */
.scroll-custom::-webkit-scrollbar {
  width: 6px;
}
.scroll-custom::-webkit-scrollbar-track {
  background: transparent;
}
.scroll-custom::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 10px;
}
.scroll-custom::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-secondary);
}
</style>
