import { describe, expect, it } from 'vitest'

import { AdvisorActionSchema, CreateDocumentSetupSchema, HomeAgentActionSchema } from './agentSchemas'

describe('Agent Schemas', () => {
  describe('HomeAgentActionSchema', () => {
    it('should validate a valid insert_text action', () => {
      const valid = {
        type: 'insert_text',
        agent_reasoning: 'Inserting a summary',
        content: 'This is a summary',
        location: 'cursor',
      }
      expect(HomeAgentActionSchema.parse(valid)).toEqual(valid)
    })

    it('should fail on invalid action type', () => {
      const invalid = {
        type: 'invalid_action',
        agent_reasoning: 'some reason',
      }
      expect(() => HomeAgentActionSchema.parse(invalid)).toThrow()
    })

    it('should fail if missing required fields', () => {
      const invalid = {
        type: 'insert_text',
        content: 'missing reasoning',
      }
      expect(() => HomeAgentActionSchema.parse(invalid)).toThrow()
    })
  })

  describe('AdvisorActionSchema', () => {
    it('should validate a valid proceed_to_next_step action', () => {
      const valid = {
        type: 'proceed_to_next_step',
        agent_reasoning: 'Step finished',
        current_step_index: 1,
        step_summary: 'Summary of step 1',
      }
      expect(AdvisorActionSchema.parse(valid)).toEqual(valid)
    })

    it('should validate a valid highlight action', () => {
      const valid = {
        type: 'highlight_critical_range',
        agent_reasoning: 'Critical text found',
        text_to_highlight: 'Bad Clause',
        reason: 'Violation of policy',
        severity: 'high',
      }
      expect(AdvisorActionSchema.parse(valid)).toEqual(valid)
    })
  })

  describe('CreateDocumentSetupSchema', () => {
    it('should validate a valid document setup', () => {
      const valid = {
        agent_reasoning: 'Creating a contract',
        title: 'Employment Contract',
        description: 'Standard contract for new hires',
        sections: [{ title: 'Definitions', content: '...', requires_source_verification: false }],
        metadata: {
          industry: 'Legal',
          documentType: 'Contract',
          tone: 'professional',
        },
      }
      expect(CreateDocumentSetupSchema.parse(valid)).toMatchObject(valid)
    })
  })
})
