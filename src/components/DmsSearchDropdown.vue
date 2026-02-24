<template>
  <div v-if="items.length > 0" class="dms-search-dropdown" :style="dropdownStyle">
    <div
      v-for="(item, index) in items"
      :key="item.id || item.name"
      class="dropdown-item"
      :class="{ active: index === activeIndex }"
      @click="selectItem(item)"
      @mouseenter="activeIndex = index"
    >
      <div class="item-icon">
        <Folder v-if="item.isFolder" :size="16" />
        <FileText v-else-if="isPdfOrDoc(item.name)" :size="16" />
        <Image v-else-if="isImage(item.name)" :size="16" />
        <File v-else :size="16" />
      </div>
      <div class="item-info">
        <span class="item-name">{{ item.name }}</span>
        <span class="item-provider">{{ item.provider }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { File, FileText, Folder, Image } from 'lucide-vue-next'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

import type { DmsFile } from '@/utils/fileProcessing'

const props = defineProps<{
  items: DmsFile[]
  position: { top: number; left: number }
}>()

const emit = defineEmits<{
  (e: 'select', item: DmsFile): void
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

function selectItem(item: DmsFile) {
  emit('select', item)
}

function isPdfOrDoc(fileName: string): boolean {
  const ext = fileName.toLowerCase().split('.').pop()
  return ['pdf', 'docx', 'doc'].includes(ext || '')
}

function isImage(fileName: string): boolean {
  const ext = fileName.toLowerCase().split('.').pop()
  return ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '')
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
.dms-search-dropdown {
  position: fixed;
  z-index: 1000;
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  min-width: 250px;
  max-height: 300px;
  background: var(--color-input-background);
  box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.15s;
}

.dropdown-item:hover,
.dropdown-item.active {
  background-color: var(--color-secondary-background);
}

.dropdown-item.active {
  border-left: 3px solid var(--color-primary);
}

.item-icon {
  display: flex;
  align-items: center;
  color: var(--color-text-secondary);
}

.item-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.item-name {
  overflow: hidden;
  font-size: 0.85rem;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-text-primary);
}

.item-provider {
  font-size: 0.7rem;
  color: var(--color-text-secondary);
  text-transform: uppercase;
}
</style>
