import { ref } from 'vue'

import { getChatResponse } from '@/api/union'
import { extractFileContent } from '@/utils/fileProcessing'
import { message as messageUtil } from '@/utils/message'
import useSettingForm from '@/utils/settingForm'

export interface WorkflowStep {
  id: string
  title: string
  instruction: string
  status?: 'idle' | 'loading' | 'completed' | 'error'
  isSecondary?: boolean
  parentId?: string
  result?: string
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
        id: Math.random().toString(36).substr(2, 9),
        title: 'New Step',
        instruction: 'Enter expert instructions here...',
        status: 'idle',
      })
      currentStep.value = activeWorkflow.value.steps.length - 1
    }
  }

  function addSubStep(parentIndex: number) {
    if (activeWorkflow.value) {
      const parent = activeWorkflow.value.steps[parentIndex]
      const newStep: WorkflowStep = {
        id: Math.random().toString(36).substr(2, 9),
        title: `Sub-step for ${parent.title}`,
        instruction: `Perform this sub-task based on: ${parent.instruction}`,
        status: 'idle',
        isSecondary: true,
        parentId: parent.id,
      }
      activeWorkflow.value.steps.splice(parentIndex + 1, 0, newStep)
      currentStep.value = parentIndex + 1
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
        let hierarchicalContext = ''
        if (step.isSecondary && step.parentId) {
          const parent = activeWorkflow.value.steps.find(s => s.id === step.parentId)
          if (parent) {
            hierarchicalContext = `\nParent Step Context: ${parent.title}\nParent Instruction: ${parent.instruction}\nParent Result: ${parent.result || 'Pending'}`
          }
        }

        // Get results of preceding steps
        const precedingContext = activeWorkflow.value.steps
          .slice(0, index)
          .filter(s => s.status === 'completed')
          .map(s => `Step: ${s.title}\nResult: ${s.result}`)
          .join('\n---\n')

        const taskPrompt = `Execute this step of the expert workflow:
Title: ${step.title}
Instructions: ${step.instruction}
${hierarchicalContext}

Preceding Steps Results:
${precedingContext}

Context:
- Output Language: ${outputLanguage.value}
- User Identity: ${userIdentity.value}
- Base Documents: ${extractedText.value ? extractedText.value.substring(0, 2000) : 'None'}
- Source of Truth Context: ${sourceOfTruth.value.substring(0, 5000)}
- Brand Guidelines: ${brandConfig.value.substring(0, 3000)}

Please generate the content for this step and insert it into the document if appropriate.`

        const { getAgentResponse } = await import('@/api/union')
        const { AdvisorActionSchema } = await import('@/schemas/agentSchemas')
        const { getActiveAgentTools } = await import('@/utils/agentTools')
        const { useAgentActivity } = await import('@/composables/useAgentActivity')
        const { v4: uuidv4 } = await import('uuid')
        const { addActivity, updateActivity } = useAgentActivity()

        const tools = await getActiveAgentTools()

        await getAgentResponse({
          provider: settingForm.value.api as any,
          config: {
            apiKey: settingForm.value.officialAPIKey,
            baseURL: settingForm.value.officialBasePath,
            dangerouslyAllowBrowser: true,
          },
          geminiAPIKey: settingForm.value.geminiAPIKey,
          groqAPIKey: settingForm.value.groqAPIKey,
          model: settingForm.value.officialModelSelect,
          geminiModel: settingForm.value.geminiModelSelect,
          groqModel: settingForm.value.groqModelSelect,
          ollamaModel: settingForm.value.ollamaModelSelect,
          azureAPIKey: settingForm.value.azureAPIKey,
          azureAPIEndpoint: settingForm.value.azureAPIEndpoint,
          azureDeploymentName: settingForm.value.azureDeploymentName,

          actionSchema: AdvisorActionSchema,
          tools,
          errorIssue: ref(null),
          loading: ref(true),
          messages: [{ role: 'user', content: taskPrompt }],
          onStream: (text: string) => {
            try {
              const action = JSON.parse(text)
              if (action.type === 'proceed_to_next_step') {
                stepResponse.value = action.step_summary
                generatedContent.value += `\n\n### [Processed: ${step.title}]\n${action.step_summary}\n*Reasoning: ${action.agent_reasoning}*`
              } else if (action.type === 'propose_document_edit') {
                stepResponse.value = action.explanation
                generatedContent.value += `\n\n### [Edit Proposed: ${step.title}]\n**Original**: ${action.original_text}\n**Proposed**: ${action.proposed_text}\n*Reasoning: ${action.agent_reasoning}*`
              } else if (action.type === 'request_approval') {
                stepResponse.value = action.summary
                generatedContent.value += `\n\n### [Approval Needed]\n${action.summary}`
              } else if (action.type === 'highlight_critical_range') {
                stepResponse.value = action.reason
                generatedContent.value += `\n\n### [Highlight Needed]\n${action.text_to_highlight} (Severity: ${action.severity})\n*Reason: ${action.reason}*`
              } else if (action.type === 'execute_tool') {
                stepResponse.value = `Executing tool: ${action.tool_name}`
              }
              step.result = stepResponse.value
            } catch (_e) {
              stepResponse.value = text
              step.result = text
            }
          },
          onToolCall: (toolName, args) => {
            const id = uuidv4()
            addActivity({ id, name: toolName, args, status: 'pending', agent: 'Advisor' })
          },
          onToolResult: (toolName, result) => {
            const pending = [...useAgentActivity().activities.value].find(
              a => a.name === toolName && a.status === 'pending' && a.agent === 'Advisor',
            )
            if (pending) {
              updateActivity(pending.id, {
                status: 'success',
                result,
                duration: Date.now() - pending.timestamp,
              })
            }
          },
        })
        step.status = 'completed'
      } else {
        const prompt = `Step: ${step.title}
Instructions: ${step.instruction}
Language: ${outputLanguage.value}
Identity: ${userIdentity.value}
Context: ${sourceOfTruth.value.substring(0, 4000)}`

        await getChatResponse({
          provider: settingForm.value.api as any,
          config: {
            apiKey: settingForm.value.officialAPIKey,
            baseURL: settingForm.value.officialBasePath,
            dangerouslyAllowBrowser: true,
          },
          geminiAPIKey: settingForm.value.geminiAPIKey,
          groqAPIKey: settingForm.value.groqAPIKey,
          model: settingForm.value.officialModelSelect,
          geminiModel: settingForm.value.geminiModelSelect,
          groqModel: settingForm.value.groqModelSelect,
          ollamaModel: settingForm.value.ollamaModelSelect,
          azureAPIKey: settingForm.value.azureAPIKey,
          azureAPIEndpoint: settingForm.value.azureAPIEndpoint,
          azureDeploymentName: settingForm.value.azureDeploymentName,

          messages: [{ role: 'user', content: prompt }],
          loading: ref(true),
          errorIssue: ref(null),
          onStream: text => {
            stepResponse.value = text
          },
        })
        generatedContent.value += `\n\n### ${step.title}\n${stepResponse.value}`
        step.status = 'completed'
        step.result = stepResponse.value
        await insertToDoc(stepResponse.value)
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
    } catch (_e) {
      console.error('Error inserting text', _e)
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
    addSubStep,
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
