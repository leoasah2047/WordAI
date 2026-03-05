import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

// Basic mocks to prevent composable initialization errors in test environment
vi.mock('@/utils/message', () => ({
  message: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock('@/utils/settingForm', () => ({
  default: () =>
    ref({
      api: 'google',
      officialAPIKey: 'test',
      officialModelSelect: 'test',
    }),
}))

vi.mock('@/api/union', () => ({
  getChatResponse: vi.fn(),
  getAgentResponse: vi.fn(),
}))

import { useAdvisor } from '../useAdvisor'

describe('useAdvisor Composable', () => {
  let advisor: any

  beforeEach(() => {
    const extractedText = ref('')
    const outputLanguage = ref('English')
    const userIdentity = ref('Professional')
    const useAgentMode = ref(true)
    const loading = ref(false)

    advisor = useAdvisor(extractedText, outputLanguage, userIdentity, useAgentMode, loading)
  })

  it('starts a workflow correctly with idle status on steps', () => {
    const testWorkflow = {
      id: 'wf1',
      name: 'Test Workflow',
      description: 'A test workflow.',
      icon: 'test-icon',
      steps: [{ id: '1', title: 'Step 1', instruction: 'Do 1', status: 'idle' }],
    }

    advisor.startWorkflow(testWorkflow)

    expect(advisor.activeWorkflow.value).not.toBeNull()
    expect(advisor.activeWorkflow.value.steps.length).toBe(1)
    expect(advisor.currentStep.value).toBe(0)
    expect(advisor.advisorState.value).toBe('input')
    expect(advisor.generatedContent.value).toBe('')
  })

  it('supports adding sub-steps (hierarchical steps)', () => {
    const testWorkflow = {
      id: 'wf1',
      name: 'Test',
      description: '',
      icon: '',
      steps: [{ id: 'parent1', title: 'Parent Step', instruction: 'Do Parent', status: 'idle' }],
    }

    advisor.startWorkflow(testWorkflow)
    expect(advisor.activeWorkflow.value.steps.length).toBe(1)

    // Add sub-step to index 0
    advisor.addSubStep(0)

    expect(advisor.activeWorkflow.value.steps.length).toBe(2)

    const parent = advisor.activeWorkflow.value.steps[0]
    const subStep = advisor.activeWorkflow.value.steps[1]

    expect(subStep.isSecondary).toBe(true)
    expect(subStep.parentId).toBe(parent.id)
    expect(subStep.title).toContain(parent.title)
    expect(advisor.currentStep.value).toBe(1) // Focus moves to new step
  })

  it('deletes steps correctly and updates currentStep when necessary', () => {
    const testWorkflow = {
      id: 'wf1',
      name: '',
      description: '',
      icon: '',
      steps: [{ id: 's1', title: 'Step 1', instruction: 'Do 1' }],
    }

    advisor.startWorkflow(testWorkflow)
    advisor.addCustomStep() // adds a 2nd step

    expect(advisor.activeWorkflow.value.steps.length).toBe(2)

    advisor.deleteStep(0)

    expect(advisor.activeWorkflow.value.steps.length).toBe(1)
    expect(advisor.currentStep.value).toBe(0)
  })
})
