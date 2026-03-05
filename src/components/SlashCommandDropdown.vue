<template>
  <div v-if="items.length > 0" class="slash-command-dropdown glass-blur" :style="dropdownStyle">
    <div v-if="activeLevel !== 'root'" class="dropdown-header">
      <span class="level-indicator">{{ activeLevel === 'documents' ? 'Documents' : 'Tools' }}</span>
    </div>
    <div
      v-for="(item, index) in items"
      :key="item.id || item.name"
      class="dropdown-item"
      :class="{ active: index === activeIndex }"
      @click="selectItem(item)"
      @mouseenter="activeIndex = index"
    >
      <div class="item-icon">
        <FolderOpen v-if="item.id === 'documents'" :size="16" />
        <Wrench v-else-if="item.id === 'tools' || item.type === 'tool'" :size="16" />
        <AlertCircle v-else-if="item.type === 'error'" :size="16" class="text-error" />
        <FileText v-else :size="16" />
      </div>
      <div class="item-info">
        <span class="item-name">{{ item.name }}</span>
        <span v-if="item.description" class="item-description">{{ item.description }}</span>
        <span v-if="item.provider" class="item-provider">{{ item.provider }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AlertCircle, FileText, FolderOpen, Wrench } from 'lucide-vue-next'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  items: any[]
  position: { top: number; left: number }
  activeLevel: 'root' | 'documents' | 'tools'
}>()

const emit = defineEmits<{
  (e: 'select', item: any): void
  (e: 'close'): void
}>()

const activeIndex = ref(0)
const dropdownStyle = ref({
  top: `${props.position.top}px`,
  left: `${props.position.left}px`,
})

watch(
  () => props.position,
  newPos => {
    dropdownStyle.value = {
      top: `${newPos.top}px`,
      left: `${newPos.left}px`,
    }
  },
)

watch(
  () => props.items,
  () => {
    activeIndex.value = 0
  },
)

function selectItem(item: any) {
  emit('select', item)
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = (activeIndex.value + 1) % props.items.length
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = (activeIndex.value - 1 + props.items.length) % props.items.length
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (props.items[activeIndex.value]) {
      selectItem(props.items[activeIndex.value])
    }
  } else if (e.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown, true)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown, true)
})
</script>

<style scoped>
.slash-command-dropdown {
  position: fixed;
  z-index: 2000;
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  min-width: 280px;
  max-height: 320px;
  background: var(--color-bg-secondary);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  padding: 6px;
}

.dropdown-header {
  padding: 6px 12px;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 4px;
}

.level-indicator {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-primary);
  letter-spacing: 0.5px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 8px;
}

.dropdown-item:hover,
.dropdown-item.active {
  background-color: var(--color-bg-hover);
}

.dropdown-item.active {
  background-color: var(--color-primary-light);
  color: var(--color-primary);
}

.item-icon {
  display: flex;
  align-items: center;
  opacity: 0.8;
}

.item-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.item-name {
  font-size: 0.9rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-description {
  font-size: 0.75rem;
  opacity: 0.7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-provider {
  font-size: 0.65rem;
  opacity: 0.5;
  text-transform: uppercase;
}

.text-error {
  color: var(--color-danger, #ef4444);
}
</style>
