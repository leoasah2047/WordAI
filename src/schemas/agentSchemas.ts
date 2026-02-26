import { z } from 'zod'

// 1. Home Agent Action Schema
// Used in HomePage.vue when useAgentMode is true.
export const HomeAgentActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('insert_text'),
    agent_reasoning: z.string().describe('Explanation for the Activity Feed'),
    content: z.string(),
    location: z.enum(['cursor', 'replace_selection', 'end']),
  }),
  z.object({
    type: z.literal('modify_selection'),
    agent_reasoning: z.string().describe('Explanation for the Activity Feed'),
    instructions: z.string(),
  }),
  z.object({
    type: z.literal('execute_tool'),
    agent_reasoning: z.string().describe('Explanation for the Activity Feed'),
    tool_name: z.string().describe('Must be an enabled WordToolName or GeneralToolName'),
    arguments: z.record(z.any()),
  }),
  z.object({
    type: z.literal('request_user_clarification'),
    agent_reasoning: z.string(),
    question: z.string(),
  }),
  z.object({
    type: z.literal('no_action'),
    agent_reasoning: z.string(),
    reason: z.string(),
  }),
])

export type HomeAgentAction = z.infer<typeof HomeAgentActionSchema>

// 2. Advisor Workflow Action Schema
// Used in ConsultantPage.vue -> Advisor Sub-mode.
export const AdvisorActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('highlight_critical_range'),
    agent_reasoning: z.string().describe('Why this range is critical'),
    text_to_highlight: z.string(),
    reason: z.string().describe('User-facing reason displayed in UI'),
    severity: z.enum(['low', 'medium', 'high']),
  }),
  z.object({
    type: z.literal('propose_document_edit'),
    agent_reasoning: z.string(),
    original_text: z.string(),
    proposed_text: z.string(),
    explanation: z.string().describe('Why the edit is proposed'),
  }),
  z.object({
    type: z.literal('request_approval'),
    agent_reasoning: z.string(),
    summary: z.string(),
    choices: z.array(z.string()).optional().describe("E.g., ['Approve', 'Reject', 'Modify']"),
  }),
  z.object({
    type: z.literal('proceed_to_next_step'),
    agent_reasoning: z.string(),
    current_step_index: z.number(),
    step_summary: z.string(),
  }),
])

export type AdvisorAction = z.infer<typeof AdvisorActionSchema>

// 3. Create Document Setup Schema
// Used in ConsultantPage.vue -> Create Document Sub-mode.
export const CreateDocumentSetupSchema = z.object({
  agent_reasoning: z.string().describe("Agent's thought process behind this document structure"),
  title: z.string().describe('Primary title of the generated document'),
  description: z.string().describe('Short abstract or executive summary'),
  sections: z.array(
    z.object({
      title: z.string(),
      content: z.string(),
      requires_source_verification: z.boolean().default(false),
      source_reference: z.string().optional().describe('Name of the DMS file or source of truth used'),
    }),
  ),
  metadata: z.object({
    industry: z.string(),
    documentType: z.string(),
    targetAudience: z.string().optional(),
    tone: z.enum(['professional', 'academic', 'casual', 'persuasive', 'direct']).optional(),
  }),
})

export type CreateDocumentSetup = z.infer<typeof CreateDocumentSetupSchema>
