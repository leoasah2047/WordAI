import { ref } from 'vue'

import { getChatResponse } from '@/api/union'
import { extractFileContent } from '@/utils/fileProcessing'
import { message as messageUtil } from '@/utils/message'
import useSettingForm from '@/utils/settingForm'

export interface WorkflowStep {
  title: string
  instruction: string
  status?: 'idle' | 'loading' | 'completed' | 'error'
}

export interface AdvisorWorkflow {
  id: string
  name: string
  description: string
  icon: string
  steps: WorkflowStep[]
  benchmarks?: string
  isCustom?: boolean
}

export function useAdvisor(
  extractedText: any,
  outputLanguage: any,
  userIdentity: any,
  useAgentMode: any,
  loading: any,
) {
  const settingForm = useSettingForm()

  // Internal Advisor State
  const activeWorkflow = ref<AdvisorWorkflow | null>(null)
  const currentStep = ref(0)
  const editingStepIndex = ref<number | null>(null)
  const editFormData = ref({ title: '', instruction: '' })
  const extractedStepList = ref<WorkflowStep[]>([])
  const sourceOfTruth = ref('')
  const brandConfig = ref('')
  const advisorWorkflows = ref<AdvisorWorkflow[]>([])

  const advisorState = ref<'input' | 'result'>('input')
  const generatedContent = ref('')
  const stepResponse = ref('')

  // File Refs for uploads
  const primaryTruthFileRef = ref<HTMLInputElement | null>(null)
  const brandBookFileRef = ref<HTMLInputElement | null>(null)

  // --- Workflow Actions ---
  function startWorkflow(workflow: AdvisorWorkflow) {
    activeWorkflow.value = JSON.parse(JSON.stringify(workflow))
    currentStep.value = 0
    advisorState.value = 'input'
    generatedContent.value = ''
    stepResponse.value = ''
  }

  function addCustomStep() {
    if (activeWorkflow.value) {
      activeWorkflow.value.steps.push({
        title: 'New Step',
        instruction: 'Enter expert instructions here...',
        status: 'idle',
      })
      currentStep.value = activeWorkflow.value.steps.length - 1
    }
  }

  function deleteStep(index: number) {
    if (activeWorkflow.value) {
      activeWorkflow.value.steps.splice(index, 1)
      if (currentStep.value >= activeWorkflow.value.steps.length) {
        currentStep.value = Math.max(0, activeWorkflow.value.steps.length - 1)
      }
    }
  }

  function moveStep(index: number, direction: 'up' | 'down') {
    if (!activeWorkflow.value) return
    const steps = activeWorkflow.value.steps
    const newIdx = direction === 'up' ? index - 1 : index + 1
    if (newIdx < 0 || newIdx >= steps.length) return
    const [moved] = steps.splice(index, 1)
    steps.splice(newIdx, 0, moved)
    currentStep.value = newIdx
  }

  function editStep(index: number) {
    if (activeWorkflow.value) {
      editingStepIndex.value = index
      editFormData.value = {
        title: activeWorkflow.value.steps[index].title,
        instruction: activeWorkflow.value.steps[index].instruction,
      }
    }
  }

  function saveStepEdit() {
    if (activeWorkflow.value && editingStepIndex.value !== null) {
      activeWorkflow.value.steps[editingStepIndex.value].title = editFormData.value.title
      activeWorkflow.value.steps[editingStepIndex.value].instruction = editFormData.value.instruction
      editingStepIndex.value = null
    }
  }

  // --- External Context Loaders ---
  function startPrimaryTruth() {
    primaryTruthFileRef.value?.click()
  }

  async function handlePrimaryTruthUpload(event: Event) {
    const input = event.target as HTMLInputElement
    if (!input.files?.length) return
    loading.value = true
    try {
      const file = input.files[0]
      const arrayBuffer = await file.arrayBuffer()
      const content = await extractFileContent(arrayBuffer, file.name)
      sourceOfTruth.value = content.text
      messageUtil.success('Primary truth document loaded.')
    } catch (err) {
      console.error(err)
      messageUtil.error('Failed to load primary truth document.')
    } finally {
      loading.value = false
    }
  }

  function startBrandBook() {
    brandBookFileRef.value?.click()
  }

  async function handleBrandBookUpload(event: Event) {
    const input = event.target as HTMLInputElement
    if (!input.files?.length) return
    loading.value = true
    try {
      const file = input.files[0]
      const arrayBuffer = await file.arrayBuffer()
      const content = await extractFileContent(arrayBuffer, file.name)
      brandConfig.value = content.text
      messageUtil.success('Brand guidelines loaded.')
    } catch (err) {
      console.error(err)
      messageUtil.error('Failed to load brand guidelines.')
    } finally {
      loading.value = false
    }
  }

  // --- Execution Logic ---
  async function executeStep(index: number) {
    if (!activeWorkflow.value || loading.value) return
    const step = activeWorkflow.value.steps[index]
    loading.value = true
    step.status = 'loading'

    try {
      if (useAgentMode.value) {
        const taskPrompt = `Execute this step of the expert workflow:
Title: ${step.title}
Instructions: ${step.instruction}

Context:
- Output Language: ${outputLanguage.value}
- User Identity: ${userIdentity.value}
- Source of Truth Context: ${sourceOfTruth.value.substring(0, 5000)}
- Brand Guidelines: ${brandConfig.value.substring(0, 3000)}

Please generate the content for this step and insert it into the document if appropriate.`

        const { orchestrator } = await import('@/utils/agentOrchestrator')
        await orchestrator.execute(taskPrompt, [], {
          extractedText: extractedText.value,
          outputLanguage: outputLanguage.value,
        })
        step.status = 'completed'
      } else {
        const prompt = `Step: ${step.title}
Instructions: ${step.instruction}
Language: ${outputLanguage.value}
Identity: ${userIdentity.value}
Context: ${sourceOfTruth.value.substring(0, 4000)}`

        const response = await getChatResponse(prompt, {
          apiKey: settingForm.value.geminiAPIKey || '',
        })
        stepResponse.value = response
        generatedContent.value += `\n\n### ${step.title}\n${response}`
        step.status = 'completed'
        await insertToDoc(response)
      }
    } catch (error) {
      console.error('Step execution failed:', error)
      step.status = 'error'
      messageUtil.error(`Failed to execute step: ${step.title}`)
    } finally {
      loading.value = false
    }
  }

  async function insertToDoc(text: string) {
    try {
      await Word.run(async (context: any) => {
        const selection = context.document.getSelection()
        selection.insertText(text, Word.InsertLocation.replace)
        await context.sync()
      })
    } catch (e) {
      console.error('Error inserting text', e)
    }
  }

  function clearReport() {
    generatedContent.value = ''
    if (activeWorkflow.value) {
      activeWorkflow.value.steps.forEach(s => (s.status = 'idle'))
    }
  }

  return {
    activeWorkflow,
    currentStep,
    editingStepIndex,
    editFormData,
    extractedStepList,
    sourceOfTruth,
    brandConfig,
    advisorWorkflows,
    advisorState,
    generatedContent,
    primaryTruthFileRef,
    brandBookFileRef,
    startWorkflow,
    addCustomStep,
    deleteStep,
    moveStep,
    editStep,
    saveStepEdit,
    executeStep,
    clearReport,
    startPrimaryTruth,
    handlePrimaryTruthUpload,
    startBrandBook,
    handleBrandBookUpload,
  }
}
