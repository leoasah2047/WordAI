import { ref } from 'vue'

import { getDmsConfigFromSettings, searchFiles } from '@/utils/homeFileSearch'
import useSettingForm from '@/utils/settingForm'
import { getWordToolDefinitions } from '@/utils/wordTools'

export function useSlashCommands() {
  const settingForm = useSettingForm()

  const isDropdownVisible = ref(false)
  const dropdownPosition = ref({ top: 0, left: 0 })
  const searchResults = ref<any[]>([])
  const activeLevel = ref<'root' | 'documents' | 'tools'>('root')
  const searchQuery = ref('')
  const loading = ref(false)
  const highlightRange = ref<{ start: number; end: number } | null>(null)

  const rootOptions = [
    { id: 'documents', name: 'Documents', icon: 'FolderOpen', provider: 'System' },
    { id: 'tools', name: 'Tools', icon: 'Wrench', provider: 'System' },
  ]

  async function handleInput(text: string, cursorPosition: number, element: HTMLElement) {
    const beforeCursor = text.slice(0, cursorPosition)
    const match = beforeCursor.match(/@([^@\s]*)$/)

    if (match) {
      const triggerIndex = match.index!
      const query = match[1]

      searchQuery.value = query
      isDropdownVisible.value = true
      highlightRange.value = { start: triggerIndex, end: cursorPosition }

      const rect = element.getBoundingClientRect()
      dropdownPosition.value = {
        top: rect.top - 200,
        left: rect.left + triggerIndex * 8,
      }

      const lowerQuery = query.toLowerCase()
      if (activeLevel.value === 'documents' || lowerQuery.startsWith('doc')) {
        if (lowerQuery.startsWith('doc')) activeLevel.value = 'documents'
        await performSearch('documents', query.replace(/^doc\s*/i, ''))
      } else if (activeLevel.value === 'tools' || lowerQuery.startsWith('tool')) {
        if (lowerQuery.startsWith('tool')) activeLevel.value = 'tools'
        await performSearch('tools', query.replace(/^tool\s*/i, ''))
      } else {
        activeLevel.value = 'root'
        searchResults.value = rootOptions.filter(opt => opt.name.toLowerCase().includes(lowerQuery))
      }
    } else {
      closeDropdown()
    }
  }

  async function performSearch(type: 'documents' | 'tools', query: string) {
    loading.value = true
    try {
      if (type === 'documents') {
        const config = getDmsConfigFromSettings(settingForm.value)

        const hasErpNext = !!(config.erpnext.url && config.erpnext.apiKey && config.erpnext.apiSecret)
        const hasGoogleDrive = !!(config.googledrive.clientId && config.googledrive.apiKey)

        if (!hasErpNext && !hasGoogleDrive) {
          searchResults.value = [
            {
              id: 'no-dms',
              name: 'No DMS Configured',
              description: 'Please configure Google Drive or ERPNext in Settings to search documents.',
              type: 'error',
            },
          ]
          return
        }

        const files = await searchFiles(query, config)
        searchResults.value = files.map(f => ({ ...f, type: 'document' }))
      } else {
        const tools = getWordToolDefinitions()
        searchResults.value = tools
          .filter(
            t =>
              t.name.toLowerCase().includes(query.toLowerCase()) ||
              t.description.toLowerCase().includes(query.toLowerCase()),
          )
          .map(t => ({ id: t.name, name: t.name, description: t.description, type: 'tool' }))
      }
    } finally {
      loading.value = false
    }
  }

  function closeDropdown() {
    isDropdownVisible.value = false
    searchResults.value = []
    activeLevel.value = 'root'
    highlightRange.value = null
  }

  return {
    isDropdownVisible,
    dropdownPosition,
    searchResults,
    activeLevel,
    searchQuery,
    loading,
    highlightRange,
    handleInput,
    closeDropdown,
    performSearch,
  }
}
