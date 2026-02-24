<template>
  <div class="dms-file-picker">
    <div class="picker-header">
      <h4>{{ $t('selectDmsFiles') || 'Select Files' }}</h4>
    </div>

    <div class="provider-tabs">
      <button class="tab-btn" :class="{ active: currentProvider === 'erpnext' }" @click="currentProvider = 'erpnext'">
        ERPNext
      </button>
      <button
        class="tab-btn"
        :class="{ active: currentProvider === 'googledrive' }"
        @click="currentProvider = 'googledrive'"
      >
        Google Drive
      </button>
    </div>

    <!-- ERPNext Search & Filter -->
    <div v-if="currentProvider === 'erpnext'" class="search-section">
      <div class="search-input-wrapper">
        <Search :size="16" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          :placeholder="$t('searchFiles') || 'Search files...'"
          @input="debouncedSearch"
        />
      </div>
      <div class="file-type-filter">
        <label v-for="ext in fileExtensions" :key="ext" class="filter-checkbox">
          <input v-model="selectedExtensions" type="checkbox" :value="ext" />
          {{ ext.toUpperCase() }}
        </label>
      </div>
      <div class="search-actions">
        <button v-if="canSelectAllErpNext" class="btn-ghost small" @click="selectAllErpNext">
          <CheckSquare :size="14" />
          {{ $t('selectAll') || 'Select All' }}
        </button>
      </div>
    </div>

    <!-- Content Area -->
    <div class="picker-content">
      <AppLoading v-if="loading" :text="$t('loading')" />
      <div v-else-if="error" class="error-state">
        <AlertCircle :size="20" />
        <span>{{ error }}</span>
      </div>
      <div v-else-if="currentProvider === 'erpnext'">
        <div v-if="files.length === 0" class="empty-state">
          <FileQuestion :size="32" />
          <span>{{ $t('noFilesFound') || 'No files found' }}</span>
        </div>
        <div v-else class="files-list">
          <div
            v-for="file in files"
            :key="file.name"
            class="file-item"
            :class="{ selected: isSelected(file) }"
            @click="toggleSelection(file)"
          >
            <div class="file-icon">
              <FileText v-if="isPdfOrDoc(file.file_name)" :size="20" />
              <Image v-else-if="isImage(file.file_name)" :size="20" />
              <File v-else :size="20" />
            </div>
            <div class="file-info">
              <span class="file-name">{{ file.file_name }}</span>
              <span class="file-size">{{ formatFileSize(file.file_size) }}</span>
            </div>
            <div class="file-check">
              <Check v-if="isSelected(file)" :size="16" class="check-icon" />
            </div>
          </div>
        </div>
      </div>
      <div v-else-if="currentProvider === 'googledrive'" class="google-drive-section">
        <div v-if="!googleConfigured" class="error-state">
          <AlertCircle :size="20" />
          <span>Google Drive not configured. Please check Settings.</span>
        </div>
        <div v-else class="google-actions">
          <button class="btn-google" @click="openGooglePicker">
            <HardDrive :size="18" />
            {{ $t('openGooglePicker') || 'Open Google Picker' }}
          </button>

          <div v-if="selectedFiles.some(f => f.provider === 'googledrive')" class="files-list mini">
            <div
              v-for="file in selectedFiles.filter(f => f.provider === 'googledrive')"
              :key="file.id"
              class="file-item selected"
              @click="toggleSelectionById(file.id)"
            >
              <div class="file-icon"><FileText :size="20" /></div>
              <div class="file-info">
                <span class="file-name">{{ file.name }}</span>
                <span class="file-size">{{ formatFileSize(file.size) }}</span>
              </div>
              <div class="file-check"><Check :size="16" class="check-icon" /></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedFiles.length > 0" class="selection-footer">
      <span class="selection-count"> {{ selectedFiles.length }} {{ $t('filesSelected') || 'file(s) selected' }} </span>
      <button class="btn-confirm" @click="confirmSelection">
        {{ $t('confirm') || 'Confirm' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  AlertCircle,
  Check,
  CheckSquare,
  File,
  FileQuestion,
  FileText,
  HardDrive,
  Image,
  Search,
} from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'

import AppLoading from '@/components/AppLoading.vue'
import {
  type DmsFile,
  type ErpNextConfig,
  type ErpNextFile,
  initTokenClient,
  loadGoogleApi,
  requestAccessToken,
  searchErpNextFiles,
} from '@/utils/fileProcessing'
import useSettingForm from '@/utils/settingForm'

const props = defineProps<{
  initialSelectedFiles?: DmsFile[]
}>()

const emit = defineEmits<(e: 'selected-files', files: DmsFile[]) => void>()

const settingForm = useSettingForm()

const currentProvider = ref<'erpnext' | 'googledrive'>('erpnext')
const searchQuery = ref('')
const files = ref<ErpNextFile[]>([])
const selectedFiles = ref<DmsFile[]>(props.initialSelectedFiles ? [...props.initialSelectedFiles] : [])
const loading = ref(false)
const error = ref('')
const fileExtensions = ['pdf', 'docx', 'doc', 'txt', 'png', 'jpg', 'jpeg', 'gif', 'webp']
const selectedExtensions = ref(['pdf', 'docx', 'doc', 'png', 'jpg', 'jpeg'])

const googleConfigured = computed(() => !!settingForm.value.googleClientId && !!settingForm.value.googleApiKey)

const canSelectAllErpNext = computed(() => {
  return currentProvider.value === 'erpnext' && files.value.length > 0
})

function selectAllErpNext() {
  files.value.forEach(file => {
    if (!isSelected(file)) {
      toggleSelection(file)
    }
  })
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null

function getConfig(): ErpNextConfig {
  return {
    url: settingForm.value.erpnextUrl || '',
    apiKey: settingForm.value.erpnextApiKey || '',
    apiSecret: settingForm.value.erpnextApiSecret || '',
  }
}

async function searchFiles() {
  const config = getConfig()
  if (!config.url || !config.apiKey || !config.apiSecret) {
    error.value = 'ERPNext not configured. Please check Settings.'
    return
  }

  loading.value = true
  error.value = ''

  try {
    files.value = await searchErpNextFiles(config, searchQuery.value, selectedExtensions.value)
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch files'
  } finally {
    loading.value = false
  }
}

function debouncedSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    searchFiles()
  }, 300)
}

function isSelected(file: any): boolean {
  const id = file.id || file.name
  return selectedFiles.value.some(f => f.id === id)
}

function toggleSelection(file: ErpNextFile) {
  if (isSelected(file)) {
    selectedFiles.value = selectedFiles.value.filter(f => f.id !== file.name)
  } else {
    selectedFiles.value.push({
      id: file.name,
      name: file.file_name,
      url: file.file_url,
      size: file.file_size,
      provider: 'erpnext',
      originalData: file,
    })
  }
}

function toggleSelectionById(id: string) {
  selectedFiles.value = selectedFiles.value.filter(f => f.id !== id)
}

async function openGooglePicker() {
  await loadGoogleApi()
  const gapi = (window as any).gapi

  const callback = (data: any) => {
    if (data.action === gapi.picker.Action.PICKED) {
      const docs = data.docs
      docs.forEach((doc: any) => {
        if (!selectedFiles.value.some(f => f.id === doc.id)) {
          selectedFiles.value.push({
            id: doc.id,
            name: doc.name,
            url: doc.url,
            size: doc.sizeBytes || 0,
            provider: 'googledrive',
            originalData: doc,
          })
        }
      })
    }
  }

  const identityCallback = (tokenResponse: any) => {
    const accessToken = tokenResponse.access_token
    const view = new gapi.picker.DocsView(gapi.picker.ViewId.DOCS)
    view.setMimeTypes(
      'application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain',
    )

    const picker = new gapi.picker.PickerBuilder()
      .enableFeature(gapi.picker.Feature.NAV_HIDDEN)
      .enableFeature(gapi.picker.Feature.MULTISELECT_ENABLED)
      .setAppId(settingForm.value.googleClientId.split('-')[0])
      .setOAuthToken(accessToken)
      .addView(view)
      .setDeveloperKey(settingForm.value.googleApiKey)
      .setCallback(callback)
      .build()
    picker.setVisible(true)
  }

  initTokenClient(
    {
      clientId: settingForm.value.googleClientId,
      apiKey: settingForm.value.googleApiKey,
    },
    identityCallback,
  )

  requestAccessToken()
}

function confirmSelection() {
  emit('selected-files', selectedFiles.value)
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function isPdfOrDoc(fileName: string): boolean {
  const ext = fileName.toLowerCase().split('.').pop()
  return ['pdf', 'docx', 'doc'].includes(ext || '')
}

function isImage(fileName: string): boolean {
  const ext = fileName.toLowerCase().split('.').pop()
  return ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '')
}

onMounted(() => {
  searchFiles()
})
</script>

<style scoped>
.dms-file-picker {
  display: flex;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 12px;
  max-height: 400px;
  background: var(--color-input-background);
  flex-direction: column;
}

.picker-header h4 {
  margin: 0 0 8px;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.provider-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 8px;
}

.tab-btn {
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  background: none;
  cursor: pointer;
}

.tab-btn.active {
  font-weight: 600;
  color: var(--color-primary);
  background: var(--color-secondary-background);
}

.search-section {
  display: flex;
  margin-bottom: 12px;
  flex-direction: column;
  gap: 8px;
}

.search-actions {
  display: flex;
  justify-content: flex-end;
}

.google-actions {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.btn-google {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 10px 20px;
  font-size: 0.9rem;
  color: var(--color-text-primary);
  background: white;
  transition: background-color 0.2s;
  gap: 8px;
  cursor: pointer;
}

.btn-google:hover {
  background-color: var(--color-secondary-background);
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 10px;
  color: var(--color-text-secondary);
}

.search-input {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 8px 8px 8px 32px;
  width: 100%;
  font-size: 0.85rem;
  color: var(--color-text-primary);
  background: var(--color-background);
}

.file-type-filter {
  display: flex;
  gap: 12px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.filter-checkbox {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.filter-checkbox input {
  cursor: pointer;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  flex-direction: column;
  gap: 8px;
}

.error-state {
  color: var(--color-error, #e74c3c);
}

.spinner {
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.files-list.mini {
  margin-top: 12px;
  border-top: 1px solid var(--color-border);
  padding-top: 12px;
}

.files-list {
  display: flex;
  overflow-y: auto;
  flex: 1;
  flex-direction: column;
  gap: 4px;
}

.file-item {
  display: flex;
  align-items: center;
  border-radius: 6px;
  padding: 8px 10px;
  transition: background-color 0.15s;
  gap: 10px;
  cursor: pointer;
}

.file-item:hover {
  background-color: var(--color-secondary-background);
}

.file-item.selected {
  border: 1px solid var(--color-primary);
  background-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
}

.file-icon {
  color: var(--color-text-secondary);
}

.file-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.file-name {
  overflow: hidden;
  font-size: 0.85rem;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-text-primary);
}

.file-size {
  font-size: 0.7rem;
  color: var(--color-text-secondary);
}

.file-check {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 20px;
}

.check-icon {
  color: var(--color-primary);
}

.selection-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  border-top: 1px solid var(--color-border);
  padding-top: 12px;
}

.selection-count {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.btn-confirm {
  border: none;
  border-radius: 6px;
  padding: 6px 16px;
  font-size: 0.85rem;
  color: white;
  background: var(--color-primary);
  transition: opacity 0.15s;
  cursor: pointer;
}

.btn-confirm:hover {
  opacity: 0.9;
}
</style>
