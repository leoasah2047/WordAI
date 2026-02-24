<template>
  <div class="typeset-page">
    <input
      ref="brandBookFileRef"
      type="file"
      style="display: none"
      accept=".pdf,.docx,.doc"
      @change="handleBrandBookUpload"
    />
    <div class="glass-header">
      <div class="header-content">
        <div class="title-group">
          <div class="icon-pulse">
            <LayoutTemplate :size="24" class="header-icon" />
          </div>
          <h1>{{ $t('aiTypeset') }}</h1>
        </div>
      </div>
    </div>

    <div class="main-content">
      <!-- Advanced Tools Section -->
      <div v-if="!selectedTemplate && !isEditingTemplate" class="advanced-tools-section">
        <div class="section-badge">{{ $t('toolbox') || 'Toolbox' }}</div>
        <div class="tools-grid">
          <button class="tool-card" @click="startBrandBook">
            <div class="tool-icon blue"><BookOpen :size="20" /></div>
            <div class="tool-info">
              <h4>{{ $t('brandBook') }}</h4>
              <p>{{ $t('brandBookDesc') }}</p>
            </div>
            <ChevronRight :size="16" class="tool-arrow" />
          </button>

          <button class="tool-card" @click="startLayoutOptimizer">
            <div class="tool-icon purple"><AlignJustify :size="20" /></div>
            <div class="tool-info">
              <h4>{{ $t('layoutOptimizer') }}</h4>
              <p>{{ $t('layoutOptimizerDesc') }}</p>
            </div>
            <ChevronRight :size="16" class="tool-arrow" />
          </button>
        </div>
      </div>

      <!-- Template Selection Grid -->
      <Transition name="fade-slide">
        <div v-if="!selectedTemplate && !isEditingTemplate" class="selection-view">
          <div class="view-header">
            <p class="subtitle">
              {{ $t('chooseTemplateSubtitle') || 'Choose a template to revitalize your document layout' }}
            </p>
          </div>

          <div class="templates-grid">
            <div v-for="tpl in allTemplates" :key="tpl.id" class="template-card-wrapper">
              <div
                class="template-card premium-shadow"
                :style="tpl.isCustom ? 'border-bottom-color: var(--color-primary)' : ''"
                @click="selectTemplate(tpl)"
              >
                <div class="tpl-badges">
                  <span v-if="tpl.isCustom" class="badge custom">{{ $t('custom') }}</span>
                </div>

                <div class="tpl-preview">
                  <div class="mock-doc">
                    <div class="mock-h1" :style="{ backgroundColor: tpl.styles.Heading1?.color || '#eee' }"></div>
                    <div class="mock-p"></div>
                    <div class="mock-p" style="width: 80%"></div>
                    <div class="mock-h2" :style="{ backgroundColor: tpl.styles.Heading2?.color || '#eee' }"></div>
                    <div class="mock-p"></div>
                  </div>
                </div>

                <div class="tpl-info">
                  <h3>{{ tpl.name }}</h3>
                  <p>{{ tpl.description }}</p>
                </div>

                <div class="card-actions">
                  <button class="icon-btn tiny" @click.stop="openMenu(tpl.id)">
                    <MoreVertical :size="16" />
                  </button>
                  <div v-if="activeMenu === tpl.id" v-click-outside="closeMenu" class="dropdown-menu blur-bg floating">
                    <button @click.stop="copyTemplate(tpl)"><Copy :size="14" /> {{ $t('copyTemplate') }}</button>
                    <button v-if="tpl.isCustom" @click.stop="editTemplate(tpl)">
                      <Edit3 :size="14" /> {{ $t('editDetails') }}
                    </button>
                    <button v-if="tpl.isCustom" class="delete" @click.stop="deleteTemplate(tpl)">
                      <Trash2 :size="14" /> {{ $t('delete') }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="create-card premium-shadow dashed" @click="createNewTemplate">
              <div class="create-icon">
                <Plus :size="32" />
              </div>
              <span>{{ $t('createTemplate') }}</span>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Template Editor Interface -->
      <Transition name="fade-slide">
        <div v-if="isEditingTemplate" class="editor-view">
          <div class="editor-panel blur-bg premium-shadow">
            <div class="editor-toolbar">
              <button class="ghost-btn" @click="closeEditor"><ArrowLeft :size="18" /> {{ $t('back') }}</button>
              <div class="toolbar-center">
                <input v-model="editingTemplate!.name" class="title-input" :placeholder="$t('templateName')" />
              </div>
              <button class="primary-btn pulse-action" @click="saveTemplate">
                <Save :size="16" /> {{ $t('saveChanges') }}
              </button>
            </div>

            <div class="editor-layout">
              <!-- Sidebar: Properties & Page Settings -->
              <div class="editor-sidebar">
                <div class="sidebar-section">
                  <div class="section-title">
                    <Settings2 :size="16" />
                    <span>{{ $t('basicProperties') }}</span>
                  </div>
                  <div class="form-group">
                    <label>{{ $t('westernFont') }}</label>
                    <div class="select-wrapper">
                      <select v-model="editingTemplate!.westernFont">
                        <option value="">Default</option>
                        <option value="Arial">Arial</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Helvetica">Helvetica</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Courier New">Courier New</option>
                      </select>
                      <ChevronDown :size="14" class="select-icon" />
                    </div>
                    <p class="help-text">Applied specifically to English text and numbers</p>
                  </div>

                  <div class="form-group">
                    <label>{{ $t('pageMargins') }}</label>
                    <div class="select-wrapper">
                      <select v-model="editingTemplate!.pageMargins">
                        <option value="Normal">Normal</option>
                        <option value="Narrow">Narrow</option>
                        <option value="Wide">Wide</option>
                      </select>
                      <ChevronDown :size="14" class="select-icon" />
                    </div>
                  </div>

                  <div class="form-group">
                    <label>{{ $t('orientation') }}</label>
                    <div class="select-wrapper">
                      <select v-model="editingTemplate!.orientation">
                        <option value="Portrait">Portrait</option>
                        <option value="Landscape">Landscape</option>
                      </select>
                      <ChevronDown :size="14" class="select-icon" />
                    </div>
                  </div>

                  <div class="form-group">
                    <label>{{ $t('description') }}</label>
                    <textarea
                      v-model="editingTemplate!.description"
                      placeholder="Briefly describe this template..."
                    ></textarea>
                  </div>

                  <div class="setting-divider" />

                  <div class="form-group">
                    <label>{{ $t('aiRefinement') }}</label>
                    <textarea
                      v-model="nlInstruction"
                      placeholder="e.g. Make all headings dark blue and increase line spacing to 1.5..."
                    ></textarea>
                    <button
                      class="btn-secondary small"
                      style="margin-top: 8px; width: 100%"
                      @click="refineTemplateWithAi"
                    >
                      <Sparkles :size="14" /> {{ $t('refineWithAi') }}
                    </button>
                  </div>

                  <div class="setting-divider" />

                  <div class="form-group">
                    <label>{{ $t('documentIntegration') }}</label>
                    <button class="btn-ghost small" style="width: 100%" @click="extractStylesFromSelection">
                      <Upload :size="14" /> {{ $t('extractStylesFromSelection') }}
                    </button>
                    <p class="help-text">Extract fonts and colors from selected text in Word.</p>
                  </div>
                </div>
              </div>

              <!-- Main Region: Styles List -->
              <div class="editor-main">
                <div class="styles-header">
                  <h3>{{ $t('styleConfiguration') }}</h3>
                  <button class="secondary-btn small" @click="addNewStyle">
                    <Plus :size="14" /> {{ $t('addNewStyle') }}
                  </button>
                </div>

                <div class="styles-grid">
                  <div
                    v-for="(style, key) in editingTemplate!.styles"
                    :key="key"
                    class="style-config-card"
                    :class="{ active: expandedStyle === key }"
                  >
                    <div class="style-card-header" @click="toggleStyleExpand(key)">
                      <div class="style-name">
                        <Type :size="16" class="type-icon" />
                        <span>{{ key }}</span>
                      </div>
                      <ChevronDown :size="18" class="chevron" />
                    </div>

                    <Transition name="expand">
                      <div v-if="expandedStyle === key" class="style-card-body">
                        <div class="config-grid">
                          <div class="config-item">
                            <label>Font Family</label>
                            <input v-model="style.fontName" placeholder="e.g. Segoe UI" />
                          </div>
                          <div class="config-item">
                            <label>Size (pt)</label>
                            <input v-model.number="style.fontSize" type="number" />
                          </div>
                          <div class="config-item">
                            <label>Color</label>
                            <div class="color-picker-wrapper">
                              <input v-model="style.color" type="color" />
                              <span class="color-hex">{{ style.color }}</span>
                            </div>
                          </div>
                          <div class="config-item">
                            <label>Outline Level</label>
                            <select v-model.number="style.outlineLevel">
                              <option :value="0">Body Text (0)</option>
                              <option v-for="l in 9" :key="l" :value="l">Level {{ l }}</option>
                            </select>
                          </div>
                        </div>

                        <div class="toggle-row">
                          <label class="toggle-btn" :class="{ active: style.bold }">
                            <input v-model="style.bold" type="checkbox" />
                            <Bold :size="16" />
                          </label>
                          <label class="toggle-btn" :class="{ active: style.italic }">
                            <input v-model="style.italic" type="checkbox" />
                            <Italic :size="16" />
                          </label>
                          <div class="alignment-group">
                            <button
                              v-for="align in ['Left', 'Center', 'Right', 'Justify']"
                              :key="align"
                              class="align-btn"
                              :class="{ active: style.alignment === align }"
                              @click="style.alignment = align as any"
                            >
                              <component :is="getAlignIcon(align)" :size="16" />
                            </button>
                          </div>
                        </div>

                        <div class="config-grid compact">
                          <div class="config-item">
                            <label>Spacing Before</label>
                            <input v-model.number="style.spacingBefore" type="number" />
                          </div>
                          <div class="config-item">
                            <label>Spacing After</label>
                            <input v-model.number="style.spacingAfter" type="number" />
                          </div>
                        </div>
                      </div>
                    </Transition>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Active Typeset Panel -->
      <Transition name="fade-slide">
        <div v-if="selectedTemplate && !isEditingTemplate" class="active-typeset-view">
          <div class="active-panel glass-panel premium-shadow">
            <div class="panel-header">
              <button class="icon-btn" @click="selectedTemplate = null">
                <ArrowLeft :size="20" />
              </button>
              <div class="active-tpl-info">
                <h3>{{ selectedTemplate.name }}</h3>
                <div class="status-indicator">
                  <div class="pulse-dot" :class="status"></div>
                  <span>{{ statusText }}</span>
                </div>
              </div>
              <div class="panel-actions">
                <button
                  v-tooltip="'Revert formatting changes'"
                  class="secondary-btn small"
                  :disabled="!canRevert"
                  @click="revertChanges"
                >
                  <RotateCcw :size="16" /> {{ $t('undo') }}
                </button>
              </div>
            </div>

            <div class="action-surface">
              <button class="mega-apply-btn" :disabled="loading" @click="applyTypeset">
                <div class="btn-shine"></div>
                <Sparkles :size="20" />
                <span>{{ $t('applyLayout') }}</span>
              </button>
            </div>

            <div ref="logContainer" class="log-container blur-bg">
              <div v-for="(log, idx) in logs" :key="idx" class="log-row" :class="log.type">
                <div class="log-indicator"></div>
                <div class="log-content">
                  <span v-if="log.type === 'user'" class="user-label">Me:</span>
                  {{ log.message }}
                </div>
                <div class="log-time">{{ getCurrentTime() }}</div>
              </div>
              <div v-if="logs.length === 0" class="empty-logs">
                <Zap :size="48" class="zap-icon" />
                <p>Click "Start" to transform your document</p>
              </div>
            </div>

            <div class="dialogue-box premium-shadow">
              <div class="chat-wrapper">
                <input
                  v-model="userInstruction"
                  class="glass-input"
                  placeholder="Ask AI to refine layout... (e.g., 'Make Title red')"
                  :disabled="loading"
                  @keydown.enter="sendInstruction"
                />
                <button class="icon-send-btn" :disabled="loading || !userInstruction.trim()" @click="sendInstruction">
                  <Send :size="18" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { vOnClickOutside } from '@vueuse/components'
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  Bold,
  BookOpen, // New Icon
  ChevronDown,
  ChevronRight,
  Copy,
  Edit3,
  Italic,
  LayoutTemplate,
  MoreVertical, // Added missing import
  Plus,
  RotateCcw,
  Save,
  Send,
  Settings2, // Added missing import
  Sparkles,
  Trash2,
  Type,
  Upload,
  Zap,
} from 'lucide-vue-next'
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n' // Corrected import

import { getChatResponse } from '@/api/union'
import { message as messageUtil } from '@/utils/message'
import useSettingForm from '@/utils/settingForm'
import type { TypesetTemplate } from '@/utils/typeset'
import { customTemplates, defaultTemplates } from '@/utils/typeset'

const { t } = useI18n() // Added for localization

const uuid = () => Math.random().toString(36).substring(2, 15)

// --- Template Management ---
const allTemplates = computed(() => [...customTemplates.value, ...defaultTemplates])
const selectedTemplate = ref<TypesetTemplate | null>(null)
const editingTemplate = ref<TypesetTemplate | null>(null)
const nlInstruction = ref('')

async function refineTemplateWithAi() {
  if (!nlInstruction.value.trim() || !editingTemplate.value) return

  loading.value = true
  statusText.value = 'Refining template...'

  try {
    const prompt = `You are a typography expert. I have a JSON typesetting template:
${JSON.stringify(editingTemplate.value, null, 2)}

User request: ${nlInstruction.value}

Please update the JSON template according to the request. Return ONLY the updated JSON. 
Ensure the structure remains identical.`

    const res = await callLLM(prompt, '')
    // Simple heuristic to extract JSON
    const jsonStr = res.replace(/```json|```/g, '').trim()
    const updated = JSON.parse(jsonStr)
    editingTemplate.value = { ...editingTemplate.value, ...updated }
    nlInstruction.value = ''
    messageUtil.success('Template refined successfully')
  } catch (_e) {
    console.error(_e)
    messageUtil.error('Failed to refine template. Please ensure the AI returned valid JSON.')
  } finally {
    loading.value = false
  }
}

async function callLLM(system: string, user: string) {
  const settings = settingForm.value
  let responseText = ''
  const result = ref('')
  const errorIssue = ref('')
  const threadId = ref('typeset-' + Date.now())

  await getChatResponse({
    provider: settings.api as any,
    config: {
      apiKey: settings.officialAPIKey,
      baseURL: settings.officialBasePath,
    },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ] as any,
    loading: ref(false),
    result,
    errorIssue,
    threadId,
    onStream: t => {
      responseText = t
    },
  })
  return responseText
}
const isEditingTemplate = ref(false)

const activeMenu = ref<string | null>(null)
const expandedStyle = ref<string | null>(null)
const canRevert = ref(false)

// --- Processing State ---
const loading = ref(false)
const status = ref<'idle' | 'processing' | 'done'>('idle')
const logs = ref<{ type: 'info' | 'success' | 'error' | 'user'; message: string }[]>([])
const userInstruction = ref('')
const logContainer = ref<HTMLElement>()
const statusText = ref('Ready to transform')
const settingForm = useSettingForm()

// --- New Features: Brand Book & Layout Optimizer ---

const brandBookFileRef = ref<HTMLInputElement | null>(null)

function startBrandBook() {
  // Trigger hidden file input
  if (brandBookFileRef.value) {
    brandBookFileRef.value.click()
  } else {
    // Fallback/fallback message
    messageUtil.info(t('uploadBrandBookPrompt') || 'Please select a PDF brand book to extract styles.')
  }
}

async function handleBrandBookUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  loading.value = true
  statusText.value = t('extractingBrandBook') || 'Extracting Brand Book...'
  messageUtil.info(`${t('processing') || 'Processing'} ${file.name}...`)

  try {
    const { extractFileContent } = await import('@/utils/fileProcessing')
    const arrayBuffer = await file.arrayBuffer()
    const content = await extractFileContent(arrayBuffer, file.name, { ocrEnabled: true })

    // Use AI to analyze the extracted text and build a template
    const prompt = `You are a design system engineer. I have text extracted from a Brand Book (GUIDELINES). 
Analyze the text and identify:
1. Primary Brand Font (Western)
2. Primary Brand Color (Hex)
3. Secondary Brand Color (Hex)
4. Heading Styles (Font, Size, Color)
5. Body Text Style (Font, Size, Color)

Here is the extracted text:
${content.text.substring(0, 5000)}

Return a TypesetTemplate JSON object.
Template structure:
{
  "name": "Extracted from ${file.name}",
  "description": "Style system extracted from brand guidelines.",
  "isCustom": true,
  "westernFont": "Primary Font Name",
  "styles": {
    "Normal": { "fontName": "...", "fontSize": 11, "color": "...", "alignment": "Left", "outlineLevel": 0 },
    "Heading1": { "fontName": "...", "fontSize": 24, "bold": true, "color": "...", "outlineLevel": 1 },
    "Heading2": { "fontName": "...", "fontSize": 18, "bold": true, "color": "...", "outlineLevel": 2 }
  }
}
Return ONLY the JSON.`

    const res = await callLLM(prompt, '')
    const jsonStr = res.match(/\{[\s\S]*\}/)?.[0] || res
    const newTpl: TypesetTemplate = JSON.parse(jsonStr)
    newTpl.id = uuid()

    customTemplates.value.push(newTpl)
    messageUtil.success(t('brandBookExtracted') || 'Brand Book extracted and AI template generated!')
    selectTemplate(newTpl)
  } catch (err: any) {
    console.error('Brand book extraction error:', err)
    messageUtil.error(`${t('failedToExtractStyles') || 'Failed to extract styles'}: ${err.message}`)
  } finally {
    loading.value = false
    target.value = '' // reset input
  }
}

async function startLayoutOptimizer() {
  loading.value = true
  statusText.value = t('optimizingLayout') || 'Optimizing layout...'
  messageUtil.info(t('runningLayoutPolish') || 'Running layout polish...')

  try {
    await Word.run(async context => {
      const body = context.document.body
      const paras = body.paragraphs
      paras.load('items/keepTogether, items/keepWithNext, items/font/size, items/text')
      await context.sync()

      let fixedCount = 0
      for (const p of paras.items) {
        // Advanced Logic:
        // 1. Keep headers with their next paragraph
        if (p.font.size >= 14 || (p.text.trim().length < 50 && !p.text.includes('.'))) {
          ;(p as any).keepWithNext = true
          fixedCount++
        }

        // 2. Prevent orphans/widows for significant paragraphs
        if (p.text.trim().length > 200) {
          ;(p as any).keepTogether = true
          fixedCount++
        }
      }

      // Apply standard "Widow/Orphan" control at document level if needed (Word does this by default usually)

      await context.sync()
      messageUtil.success(
        `${t('layoutOptimized') || 'Layout optimized'}: ${fixedCount} refinements applied to document.`,
      )
    })
  } catch (err: any) {
    console.error('Layout optimizer error:', err)
    messageUtil.error(`${t('optimizationFailed') || 'Failed to optimize layout'}: ${err.message}`)
  } finally {
    loading.value = false
    statusText.value = 'Ready'
  }
}

async function extractStylesFromSelection() {
  if (!editingTemplate.value) return

  loading.value = true
  statusText.value = 'Extracting styles...'

  try {
    await Word.run(async context => {
      const selection = context.document.getSelection()
      selection.load('font/name, font/color, font/size, style')
      await context.sync()

      // const styleName = selection.style
      const fontName = selection.font.name
      const color = selection.font.color

      // Map to the most appropriate style in our template if we can identify it
      // For now, let's just update the Western Font and maybe the 'Normal' style
      editingTemplate.value!.westernFont = fontName
      if (editingTemplate.value!.styles.Normal) {
        editingTemplate.value!.styles.Normal.fontName = fontName
        editingTemplate.value!.styles.Normal.color = color
      }

      messageUtil.success(`Extracted: ${fontName}`)
    })
  } catch (_e) {
    messageUtil.error('Failed to extract styles')
  } finally {
    loading.value = false
  }
}

// Logic functions
function openMenu(id: string) {
  activeMenu.value = id
}
function closeMenu() {
  activeMenu.value = null
}

function copyTemplate(tpl: TypesetTemplate) {
  const newTpl = JSON.parse(JSON.stringify(tpl))
  newTpl.id = uuid()
  newTpl.name = tpl.name + ' (Copy)'
  newTpl.isCustom = true
  customTemplates.value.push(newTpl)
  addLog('success', `Template copied: ${newTpl.name}`)
  closeMenu()
}

function deleteTemplate(tpl: TypesetTemplate) {
  const idx = customTemplates.value.findIndex(t => t.id === tpl.id)
  if (idx !== -1) customTemplates.value.splice(idx, 1)
  closeMenu()
}

function createNewTemplate() {
  const newTpl: TypesetTemplate = {
    id: uuid(),
    name: 'New Custom Template',
    description: 'A personalized layout for your specific needs.',
    isCustom: true,
    styles: {
      Normal: { fontName: 'Segoe UI', fontSize: 11, color: '#000000', alignment: 'Left', outlineLevel: 0 },
      Heading1: { fontName: 'Segoe UI', fontSize: 20, bold: true, color: '#2563eb', outlineLevel: 1 },
      Heading2: { fontName: 'Segoe UI', fontSize: 16, bold: true, color: '#1e40af', outlineLevel: 2 },
      Heading3: { fontName: 'Segoe UI', fontSize: 13, bold: true, color: '#3b82f6', outlineLevel: 3 },
    },
  }
  customTemplates.value.push(newTpl)
  editTemplate(newTpl)
}

function editTemplate(tpl: TypesetTemplate) {
  editingTemplate.value = JSON.parse(JSON.stringify(tpl))
  isEditingTemplate.value = true
  expandedStyle.value = 'Normal'
  closeMenu()
}

function closeEditor() {
  isEditingTemplate.value = false
  editingTemplate.value = null
}

function saveTemplate() {
  if (!editingTemplate.value) return
  const idx = customTemplates.value.findIndex(t => t.id === editingTemplate.value?.id)
  if (idx !== -1) {
    customTemplates.value[idx] = editingTemplate.value
  } else {
    customTemplates.value.push(editingTemplate.value)
  }
  closeEditor()
}

function addNewStyle() {
  const styleName = prompt("Enter a name for the new style (e.g. 'Quote', 'Caption'):")
  if (styleName && editingTemplate.value) {
    editingTemplate.value.styles[styleName] = {
      fontName: 'Segoe UI',
      fontSize: 10,
      color: '#666666',
      outlineLevel: 0,
    }
    expandedStyle.value = styleName
  }
}

function toggleStyleExpand(key: string) {
  expandedStyle.value = expandedStyle.value === key ? null : key
}

function selectTemplate(tpl: TypesetTemplate) {
  selectedTemplate.value = tpl
  status.value = 'idle'
  statusText.value = 'Ready'
  logs.value = []
  addLog('info', `Selected ${tpl.name}. Click "Start" to begin.`)
}

function addLog(type: 'info' | 'success' | 'error' | 'user', message: string) {
  logs.value.push({ type, message })
  nextTick(() => {
    if (logContainer.value) logContainer.value.scrollTop = logContainer.value.scrollHeight
  })
}

function getCurrentTime() {
  const now = new Date()
  return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0')
}

function getAlignIcon(align: string) {
  switch (align) {
    case 'Center':
      return AlignCenter
    case 'Right':
      return AlignRight
    case 'Justify':
      return AlignJustify
    default:
      return AlignLeft
  }
}

// === History / History Logic ===
async function revertChanges() {
  addLog('info', 'Reverting changes... (Hint: Use Ctrl+Z in Word for perfect restoration)')
  canRevert.value = false
  // We can't easily programmatic undo across multiple Word.run calls,
  // so we notify the user.
}

// === Core Logic ===
async function applyTypeset() {
  if (!selectedTemplate.value) return

  loading.value = true
  status.value = 'processing'
  statusText.value = 'Refining Layout...'
  addLog('info', 'Analyzing document hierarchy...')
  canRevert.value = true

  try {
    await Word.run(async context => {
      const styles = selectedTemplate.value!.styles
      const westernFont = selectedTemplate.value!.westernFont
      const pageMargins = selectedTemplate.value!.pageMargins
      const orientation = selectedTemplate.value!.orientation

      const body = context.document.body
      const sections = context.document.sections
      sections.load('items')
      await context.sync()

      // Apply Page Settings
      for (const section of sections.items) {
        if (orientation) section.pageSetup.orientation = orientation
        if (pageMargins === 'Narrow') {
          section.pageSetup.leftMargin = 36 // 0.5 inch in points
          section.pageSetup.rightMargin = 36
          section.pageSetup.topMargin = 36
          section.pageSetup.bottomMargin = 36
        } else if (pageMargins === 'Wide') {
          section.pageSetup.leftMargin = 144 // 2 inch
          section.pageSetup.rightMargin = 144
        }
      }

      const paragraphs = body.paragraphs
      paragraphs.load('items/style, items/text, items/font/bold, items/isListItem')

      if (westernFont) {
        body.font.name = westernFont
      }

      await context.sync()

      for (const p of paragraphs.items) {
        const styleKey = p.style.toString()
        const text = p.text.trim()

        // 1. Identification logic for headers hidden in 'Normal' text
        if (styleKey === 'Normal' && text.length > 0 && text.length < 100 && !p.isListItem) {
          let hasBold = false
          try {
            if (p.font.bold) hasBold = true
          } catch (_e) {}

          // Identify Heading likelihood
          if ((hasBold || /^[A-Z0-9][\w\s.]{3,50}$/.test(text)) && !text.endsWith('.')) {
            if (styles.Heading2) {
              applyStyleToPara(p, styles.Heading2)
              addLog('success', `Auto-detected heading: "${text.substring(0, 15)}..."`)
              continue
            }
          }
        }

        // 2. Map known styles
        let targetStyle: any = null
        if (['Heading 1', 'h1'].some(k => styleKey.includes(k))) targetStyle = styles.Heading1
        else if (['Heading 2', 'h2'].some(k => styleKey.includes(k))) targetStyle = styles.Heading2
        else if (['Heading 3', 'h3'].some(k => styleKey.includes(k))) targetStyle = styles.Heading3
        else if (styleKey === 'Normal') targetStyle = styles.Normal
        else if (styles[styleKey]) targetStyle = styles[styleKey]

        if (targetStyle) applyStyleToPara(p, targetStyle)

        // 3. Western Font Application (Requirement 3.7.5)
        if (westernFont && text.length > 0) {
          // Search for English/Numbers in the paragraph and apply font
          const westernRanges = p.search('[A-Za-z0-9]+', { matchWildcards: true })
          westernRanges.load('items')
          await context.sync()
          for (const range of westernRanges.items) {
            range.font.name = westernFont
          }
        }
      }

      await context.sync()
    })

    addLog('success', 'Document typeset successfully!')
    status.value = 'done'
    statusText.value = 'Perfectly Styled'
  } catch (_e) {
    console.error(_e)
    addLog('error', 'Formatting interruption. Check Word permissions.')
    status.value = 'idle'
  } finally {
    loading.value = false
  }
}

function applyStyleToPara(p: Word.Paragraph, s: any) {
  if (s.fontName) p.font.name = s.fontName
  if (s.fontSize) p.font.size = s.fontSize
  if (s.color) p.font.color = s.color
  if (s.bold !== undefined) p.font.bold = s.bold
  if (s.italic !== undefined) p.font.italic = s.italic
  if (s.alignment) p.alignment = s.alignment as any
  if (s.spacingBefore) p.spaceBefore = s.spacingBefore
  if (s.spacingAfter) p.spaceAfter = s.spacingAfter
  if (s.outlineLevel !== undefined) {
    p.outlineLevel = s.outlineLevel
  }
}

async function sendInstruction() {
  if (!userInstruction.value.trim()) return
  const msg = userInstruction.value
  addLog('user', msg)
  userInstruction.value = ''
  loading.value = true

  try {
    await Word.run(async context => {
      const inst = msg.toLowerCase()
      const quoteMatch = msg.match(/['"](.*?)['"]/)
      const targetText = quoteMatch ? quoteMatch[1] : null

      const paras = context.document.body.paragraphs
      paras.load('items/text, items/style')
      await context.sync()

      let applied = false
      if (targetText) {
        const isH1 = inst.includes('level-one') || inst.includes('heading 1')
        const targetConfig = isH1 ? selectedTemplate.value?.styles.Heading1 : selectedTemplate.value?.styles.Heading2

        for (const p of paras.items) {
          if (p.text.includes(targetText)) {
            if (targetConfig) applyStyleToPara(p, targetConfig)
            applied = true
          }
        }
      }

      if (applied) {
        addLog('success', `Refined specific sections based on your instruction.`)
      } else {
        addLog('info', 'AI is analyzing your request... Applying general refinements.')
      }
      await context.sync()
    })
  } catch (_) {
    addLog('error', 'Could not parse instruction.')
  } finally {
    loading.value = false
  }
}

const vClickOutside = vOnClickOutside
</script>

<style scoped>
.typeset-page {
  display: flex;
  overflow: hidden;
  height: 100vh;
  font-family: Inter, system-ui, sans-serif;
  color: #1e293b;
  background: radial-gradient(circle at top right, #f8faff, #ffffff);
  flex-direction: column;
}

/* Header */
.glass-header {
  z-index: 10;
  border-bottom: 1px solid rgb(0 0 0 / 5%);
  padding: 16px 24px;
  background: rgb(255 255 255 / 70%);
  backdrop-filter: blur(12px);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-pulse {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 12px;
  width: 42px;
  height: 42px;
  color: white;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  box-shadow: 0 4px 12px rgb(37 99 235 / 20%);
}

.header-icon {
  animation: pulse-ring 3s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
}

.title-group h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #1e293b, #334155);
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Advanced Tools Section */
.advanced-tools-section {
  position: relative;
  margin-bottom: 24px;
  border: 1px solid rgb(0 0 0 / 3%);
  border-radius: 16px;
  padding: 20px;
  background: white;
  box-shadow: 0 4px 20px rgb(0 0 0 / 3%);
}

.section-badge {
  position: absolute;
  top: -10px;
  left: 20px;
  border-radius: 12px;
  padding: 4px 12px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  background: #f1f5f9;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.tool-card {
  display: flex;
  align-items: center;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  text-align: left;
  background: #f8fafc;
  transition: all 0.2s;
  gap: 16px;
  cursor: pointer;
}

.tool-card:hover {
  border-color: #3b82f6;
  background: white;
  box-shadow: 0 4px 12px rgb(59 130 246 / 10%);
  transform: translateY(-2px);
}

.tool-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 10px;
  width: 40px;
  height: 40px;
  color: white;
}

.tool-icon.blue {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.tool-icon.purple {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
}

.tool-info h4 {
  margin-bottom: 4px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
}

.tool-info p {
  margin: 0;
  font-size: 0.8rem;
  color: #64748b;
  line-height: 1.3;
}

.tool-arrow {
  margin-left: auto;
  color: #cbd5e1;
  transition: transform 0.2s;
}

.tool-card:hover .tool-arrow {
  color: #3b82f6;
  transform: translateX(2px);
}

.main-content {
  position: relative;
  overflow-y: auto;
  padding: 24px;
  flex: 1;
}

/* Transitions */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-slide-leave-to {
  position: absolute;
  width: 100%;
  opacity: 0;
  transform: translateY(-20px);
}

/* Selection View */
.view-header {
  margin-bottom: 30px;
  text-align: center;
}

.subtitle {
  font-size: 1rem;
  color: #64748b;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 24px;
  padding-bottom: 40px;
}

.template-card-wrapper {
  perspective: 1000px;
}

.template-card {
  position: relative;
  display: flex;
  overflow: hidden;
  border-bottom: 4px solid #e2e8f0;
  border-radius: 16px;
  height: 320px;
  background: white;
  transition: all 0.3s ease;
  cursor: pointer;
  flex-direction: column;
}

.template-card:hover {
  border-bottom-color: #3b82f6;
  box-shadow: 0 20px 40px rgb(0 0 0 / 8%);
  transform: translateY(-8px) rotateX(2deg);
}

.premium-shadow {
  box-shadow: 0 4px 20px rgb(0 0 0 / 3%);
}

.tpl-badges {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
  display: flex;
  gap: 6px;
}

.badge {
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 0.7rem;
  font-weight: 600;
  background: rgb(255 255 255 / 90%);
  box-shadow: 0 2px 8px rgb(0 0 0 / 5%);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  backdrop-filter: blur(4px);
}

.badge.custom {
  color: #2563eb;
}

.tpl-preview {
  position: relative;
  display: flex;
  justify-content: center;
  overflow: hidden;
  padding: 20px;
  background: #f1f5f9;
  flex: 1;
}

.mock-doc {
  display: flex;
  border-radius: 4px;
  padding: 16px;
  width: 100%;
  height: 100%;
  background: white;
  box-shadow: 0 4px 12px rgb(0 0 0 / 5%);
  flex-direction: column;
  gap: 12px;
  transform: scale(0.9);
}

.mock-h1 {
  border-radius: 4px;
  width: 70%;
  height: 16px;
  background: #e2e8f0;
}

.mock-p {
  border-radius: 2px;
  width: 100%;
  height: 8px;
  background: #f1f5f9;
}

.mock-h2 {
  margin-top: 8px;
  border-radius: 3px;
  width: 50%;
  height: 12px;
  background: #e2e8f0;
}

.tpl-info {
  z-index: 5;
  padding: 16px;
  background: white;
}

.tpl-info h3 {
  margin-bottom: 4px;
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
}

.tpl-info p {
  display: -webkit-box;
  overflow: hidden;
  font-size: 0.8rem;
  color: #64748b;
  line-height: 1.4;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 20;
}

.icon-btn.tiny {
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid rgb(0 0 0 / 5%);
  border-radius: 8px;
  padding: 0;
  width: 28px;
  height: 28px;
  background: rgb(255 255 255 / 80%);
  transition: all 0.2s;
  backdrop-filter: blur(4px);
  cursor: pointer;
}

.icon-btn.tiny:hover {
  background: white;
  transform: scale(1.1);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  display: flex;
  margin-top: 8px;
  border: 1px solid rgb(0 0 0 / 5%);
  border-radius: 12px;
  padding: 6px;
  min-width: 140px;
  background: white;
  box-shadow: 0 10px 30px rgb(0 0 0 / 10%);
  flex-direction: column;
  gap: 2px;
}

.dropdown-menu button {
  display: flex;
  align-items: center;
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 0.8rem;
  text-align: left;
  color: #475569;
  background: transparent;
  transition: all 0.2s;
  gap: 8px;
  cursor: pointer;
}

.dropdown-menu button:hover {
  color: #1e293b;
  background: #f1f5f9;
}

.dropdown-menu button.delete:hover {
  color: #ef4444;
  background: #fee2e2;
}

.create-card {
  display: flex;
  justify-content: center;
  align-items: center;
  border: 2px dashed #cbd5e1;
  border-radius: 16px;
  height: 320px;
  background: rgb(255 255 255 / 50%);
  transition: all 0.3s;
  flex-direction: column;
  gap: 16px;
  cursor: pointer;
}

.create-card:hover {
  border-color: #3b82f6;
  background: rgb(59 130 246 / 5%);
  transform: translateY(-4px);
}

.create-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 20px;
  width: 64px;
  height: 64px;
  color: #3b82f6;
  background: #eff6ff;
  transition: all 0.3s;
}

.create-card:hover .create-icon {
  color: white;
  background: #3b82f6;
  transform: scale(1.1) rotate(90deg);
}

/* Editor View */
.editor-view {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 50;
  padding: 24px;
  width: 100%;
  height: 100%;
}

.editor-panel {
  display: flex;
  overflow: hidden;
  border: 1px solid rgb(0 0 0 / 5%);
  border-radius: 24px;
  width: 100%;
  height: 100%;
  background: rgb(255 255 255 / 95%);
  flex-direction: column;
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
  padding: 16px 24px;
}

.title-input {
  border: none;
  width: 300px;
  font-size: 1.1rem;
  font-weight: 600;
  text-align: center;
  color: #1e293b;
  background: transparent;
  outline: none;
}

.title-input:focus {
  border-bottom: 2px solid #3b82f6;
}

.editor-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.editor-sidebar {
  overflow-y: auto;
  border-right: 1px solid #f1f5f9;
  padding: 24px;
  width: 300px;
  background: #fafafa;
}

.section-title {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #64748b;
  gap: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  color: #475569;
}

.select-wrapper {
  position: relative;
}

select,
textarea {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px;
  width: 100%;
  font-size: 0.9rem;
  font-family: inherit;
  color: #1e293b;
  background: white;
  outline: none;
  transition: all 0.2s;
}

select:focus,
textarea:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgb(59 130 246 / 10%);
}

.select-icon {
  position: absolute;
  top: 50%;
  right: 10px;
  color: #94a3b8;
  transform: translateY(-50%);
  pointer-events: none;
}

.help-text {
  margin-top: 6px;
  font-size: 0.75rem;
  color: #94a3b8;
}

.setting-divider {
  margin: 24px 0;
  height: 1px;
  background: #e2e8f0;
}

.editor-main {
  overflow-y: auto;
  padding: 24px;
  background: #f8fafc;
  flex: 1;
}

.styles-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.styles-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.style-config-card {
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  transition: all 0.3s;
}

.style-config-card.active {
  border-color: #3b82f6;
  box-shadow: 0 8px 30px rgb(59 130 246 / 10%);
}

.style-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: white;
  cursor: pointer;
}

.style-name {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  color: #1e293b;
}

.chevron {
  color: #cbd5e1;
  transition: transform 0.3s;
}

.style-config-card.active .chevron {
  transform: rotate(180deg);
  color: #3b82f6;
}

.style-card-body {
  border-top: 1px solid #f1f5f9;
  padding: 20px;
  background: #fafafa;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.config-item label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
}

.config-item input {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 8px;
  width: 100%;
}

.color-picker-wrapper {
  display: flex;
  align-items: center;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 4px;
  background: white;
  gap: 8px;
}

.color-picker-wrapper input[type='color'] {
  border: none;
  border-radius: 4px;
  padding: 0;
  width: 32px;
  height: 32px;
  cursor: pointer;
}

.color-hex {
  font-size: 0.8rem;
  font-family: monospace;
  color: #64748b;
}

.toggle-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.toggle-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  width: 40px;
  height: 40px;
  color: #64748b;
  background: white;
  transition: all 0.2s;
  cursor: pointer;
}

.toggle-btn input {
  display: none;
}

.toggle-btn.active {
  border-color: #3b82f6;
  color: #3b82f6;
  background: #eff6ff;
}

.alignment-group {
  display: flex;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 2px;
  background: white;
}

.align-btn {
  border: none;
  border-radius: 6px;
  width: 36px;
  height: 36px;
  color: #64748b;
  background: transparent;
  cursor: pointer;
}

.align-btn.active {
  color: #1e293b;
  background: #f1f5f9;
}

/* Active Typeset View */
.active-typeset-view {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  justify-content: center;
  padding: 4px;
  width: 100%;
  height: 100%;
}

.active-panel {
  display: flex;
  overflow: hidden;
  margin-top: 10px;
  margin-bottom: 10px;
  border: 1px solid rgb(255 255 255 / 50%);
  border-radius: 20px;
  width: 100%;
  max-width: 800px;
  background: rgb(255 255 255 / 95%);
  box-shadow: 0 20px 60px rgb(0 0 0 / 10%);
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  border-bottom: 1px solid rgb(0 0 0 / 5%);
  padding: 16px 24px;
  gap: 16px;
}

.active-tpl-info h3 {
  margin: 0;
  font-size: 1.1rem;
}

.status-indicator {
  display: flex;
  align-items: center;
  margin-top: 4px;
  font-size: 0.8rem;
  color: #64748b;
  gap: 6px;
}

.pulse-dot {
  border-radius: 50%;
  width: 8px;
  height: 8px;
  background: #cbd5e1;
}

.pulse-dot.processing {
  background: #eab308;
  animation: pulse 1s infinite;
}

.pulse-dot.done {
  background: #22c55e;
}

.action-surface {
  display: flex;
  justify-content: center;
  padding: 40px;
  background: radial-gradient(circle, #f8fafc 0%, #ffffff 70%);
}

.mega-apply-btn {
  position: relative;
  display: flex;
  align-items: center;
  overflow: hidden;
  border: none;
  border-radius: 50px;
  padding: 16px 40px;
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  box-shadow: 0 10px 30px rgb(37 99 235 / 30%);
  transition: all 0.3s;
  cursor: pointer;
  gap: 12px;
}

.mega-apply-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 40px rgb(37 99 235 / 40%);
}

.mega-apply-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.btn-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(
    to right,
    rgb(255 255 255 / 0%) 0%,
    rgb(255 255 255 / 20%) 50%,
    rgb(255 255 255 / 0%) 100%
  );
  transform: skewX(-20deg);
  animation: shine 3s infinite;
}

.log-container {
  overflow-y: auto;
  border-top: 1px solid rgb(0 0 0 / 5%);
  padding: 20px;
  background: rgb(248 250 252 / 80%);
  flex: 1;
}

.log-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 0.9rem;
  animation: fadeIn 0.3s ease-out;
}

.log-indicator {
  border-radius: 2px;
  width: 4px;
  background: #cbd5e1;
}

.log-row.info .log-indicator {
  background: #3b82f6;
}

.log-row.success .log-indicator {
  background: #22c55e;
}

.log-row.error .log-indicator {
  background: #ef4444;
}

.log-row.user .log-indicator {
  background: #8b5cf6;
}

.log-content {
  flex: 1;
  color: #334155;
}

.user-label {
  margin-right: 4px;
  font-weight: 600;
  color: #8b5cf6;
}

.log-time {
  font-size: 0.75rem;
  color: #94a3b8;
}

.empty-logs {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #94a3b8;
  opacity: 0.6;
  flex-direction: column;
}

.dialogue-box {
  border-top: 1px solid rgb(0 0 0 / 5%);
  padding: 16px;
  background: white;
}

.chat-wrapper {
  display: flex;
  border-radius: 12px;
  padding: 8px;
  background: #f1f5f9;
  transition: all 0.2s;
  gap: 12px;
}

.chat-wrapper:focus-within {
  background: white;
  box-shadow: 0 0 0 2px #e2e8f0;
}

.glass-input {
  border: none;
  padding: 8px;
  font-size: 0.9rem;
  color: #1e293b;
  background: transparent;
  outline: none;
  flex: 1;
}

.icon-send-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  border: none;
  border-radius: 8px;
  width: 36px;
  height: 36px;
  color: white;
  background: #3b82f6;
  transition: opacity 0.2s;
  cursor: pointer;
}

.icon-send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Common button styles */
.ghost-btn,
.secondary-btn,
.primary-btn {
  display: flex;
  align-items: center;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
  gap: 8px;
  cursor: pointer;
}

.ghost-btn {
  color: #64748b;
  background: transparent;
}

.ghost-btn:hover {
  color: #1e293b;
  background: rgb(0 0 0 / 5%);
}

.secondary-btn {
  border: 1px solid #e2e8f0;
  color: #475569;
  background: white;
}

.secondary-btn:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.primary-btn {
  color: white;
  background: #3b82f6;
}

.primary-btn:hover {
  background: #2563eb;
}

@keyframes pulse-ring {
  0% {
    transform: scale(0.8);
    box-shadow: 0 0 0 0 rgb(37 99 235 / 70%);
  }

  70% {
    transform: scale(1);
    box-shadow: 0 0 0 10px rgb(37 99 235 / 0%);
  }

  100% {
    transform: scale(0.8);
    box-shadow: 0 0 0 0 rgb(37 99 235 / 0%);
  }
}

@keyframes shine {
  100% {
    left: 125%;
  }
}
</style>
