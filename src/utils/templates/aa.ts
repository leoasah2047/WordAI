import { WritingTemplate } from './types'

export const aaTemplates: WritingTemplate[] = [
  {
    id: 'aa_inventory_count',
    name: 'Inventory Count',
    description: 'Instructions for physical inventory observation.',
    icon: 'Package',
    category: 'AA',
    inputs: [
      { key: 'location', label: 'Warehouse Location', placeholder: 'Dublin Branch', type: 'text' },
      { key: 'date', label: 'Count Date', placeholder: 'Dec 31st', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft an Inventory Count Instruction memo for the ${i.location} warehouse on ${i.date}. Outline tagging, cutoff procedures, and team assignments.`,
  },
  {
    id: 'aa_analytical_review',
    name: 'Analytical Review',
    description: 'Document expectations vs actuals for FS line items.',
    icon: 'Activity',
    category: 'AA',
    inputs: [
      { key: 'area', label: 'FS Area', placeholder: 'Operating Expenses', type: 'text' },
      { key: 'reason', label: 'Variation Reason', placeholder: 'Inflation and expansion', type: 'textarea' },
    ],
    promptTemplate: i =>
      `Conduct an Analytical Review for ${i.area}. Compare current vs prior year, document expectations, and explain significant fluctuations due to ${i.reason}.`,
  },
  {
    id: 'aa_lawyer_letter',
    name: 'Lawyer Inquiry',
    description: 'Request for legal confirmation of litigation.',
    icon: 'Gavel',
    category: 'AA',
    inputs: [
      { key: 'firm', label: 'Law Firm', placeholder: 'Dewey Cheatham & Howe', type: 'text' },
      { key: 'threshold', label: 'Materiality Threshold', placeholder: '$50,000', type: 'text' },
    ],
    promptTemplate: i =>
      `Write a Lawyer Inquiry Letter to ${i.firm} requesting confirmation of all pending litigation with a potential liability over ${i.threshold}.`,
  },
  {
    id: 'aa_subsequent_events',
    name: 'Subsequent Events',
    description: 'Review of events after balance sheet date.',
    icon: 'Calendar',
    category: 'AA',
    inputs: [{ key: 'cutoff', label: 'Review Period Cutoff', placeholder: 'Report Date (Feb 15)', type: 'text' }],
    promptTemplate: i =>
      `Draft a Subsequent Events Review memo covering the period from the balance sheet date to ${i.cutoff}. Include inquiries to management about new debt or lawsuits.`,
  },
  {
    id: 'aa_going_concern',
    name: 'Going Concern',
    description: 'Evaluate ability to continue as a going concern.',
    icon: 'TrendingUp',
    category: 'AA',
    inputs: [
      { key: 'period', label: 'Assessment Period', placeholder: 'Next 12 months', type: 'text' },
      {
        key: 'risk_factors',
        label: 'Risk Factors',
        placeholder: 'Negative cash flow, debt maturity',
        type: 'textarea',
      },
    ],
    promptTemplate: i =>
      `Write a Going Concern Evaluation memo for the ${i.period}. Address identified risk factors: ${i.risk_factors} and management's mitigation plans.`,
  },
  {
    id: 'aa_independence_confirm',
    name: 'Independence Conf',
    description: 'Annual auditor independence confirmation.',
    icon: 'UserCheck',
    category: 'AA',
    inputs: [{ key: 'year', label: 'Audit Year', placeholder: '2024', type: 'text' }],
    promptTemplate: i =>
      `Draft an Independence Confirmation letter for the ${i.year} audit cycle, stating no financial or advisory conflicts with the client.`,
  },
  {
    id: 'aa_sampling_memo',
    name: 'Sampling Memo',
    description: 'Document audit sampling methodology.',
    icon: 'Hash',
    category: 'AA',
    inputs: [
      { key: 'population', label: 'Population Type', placeholder: 'Accounts Receivable', type: 'text' },
      { key: 'confidence', label: 'Confidence Level', placeholder: '95%', type: 'text' },
    ],
    promptTemplate: i =>
      `Write an Audit Sampling memo for ${i.population}. Specify the sampling method (e.g., MUS), confidence level of ${i.confidence}, and tolerable error.`,
  },
  {
    id: 'aa_fraud_risk',
    name: 'Fraud Risk Memo',
    description: 'Document fraud risk brainstorming session.',
    icon: 'Search',
    category: 'AA',
    inputs: [
      {
        key: 'factors',
        label: 'Observed Factors',
        placeholder: 'Override of controls, high pressure',
        type: 'textarea',
      },
    ],
    promptTemplate: i =>
      `Document a Fraud Risk Brainstorming memo. Address management override, revenue recognition pressure, and the ${i.factors} observed.`,
  },
  {
    id: 'aa_related_parties',
    name: 'Related Parties',
    description: 'Review of related party transactions.',
    icon: 'Users',
    category: 'AA',
    inputs: [
      { key: 'transactions', label: 'Observed Transactions', placeholder: 'Loan to director', type: 'textarea' },
    ],
    promptTemplate: i =>
      `Draft a Related Party Transaction Review. Document the ${i.transactions} found and verify if they were conducted at arm's length.`,
  },
  {
    id: 'aa_expert_reliance',
    name: 'Expert Reliance',
    description: 'Document reliance on a third-party expert.',
    icon: 'UserPlus',
    category: 'AA',
    inputs: [
      { key: 'expert', label: 'Specialist/Expert', placeholder: 'Actuary / Appraiser', type: 'text' },
      { key: 'scope', label: 'Focus Area', placeholder: 'Pension liability / Real estate value', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft a memo documenting an Evaluation of the Auditor's Specialist (${i.expert}) regarding ${i.scope}. Verify competence and objectivity.`,
  },
  {
    id: 'aa_materiality_memo',
    name: 'Materiality Memo',
    description: 'Establish audit materiality thresholds.',
    icon: 'BarChart',
    category: 'AA',
    inputs: [
      { key: 'benchmark', label: 'Benchmark', placeholder: '5% of Pre-tax Income', type: 'text' },
      { key: 'value', label: 'Overall Materiality', placeholder: '$1,000,000', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft a Planning Materiality memo. Establish ${i.value} based on ${i.benchmark}, and define Performance Materiality.`,
  },
  {
    id: 'aa_opening_balances',
    name: 'Opening Balances',
    description: 'Verify accuracy of opening balances.',
    icon: 'ArrowRight',
    category: 'AA',
    inputs: [{ key: 'predecessor', label: 'Predecessor Auditor', placeholder: 'Big 4 Firm', type: 'text' }],
    promptTemplate: i =>
      `Draft an Opening Balance Audit memo. Detail procedures to verify beginning balances, including review of ${i.predecessor} workpapers.`,
  },
  {
    id: 'aa_itgc_review',
    name: 'ITGC Review',
    description: 'Audit of IT General Controls.',
    icon: 'Monitor',
    category: 'AA',
    inputs: [{ key: 'system', label: 'Core System', placeholder: 'SAP S/4HANA', type: 'text' }],
    promptTemplate: i =>
      `Draft an ITGC Review summary for ${i.system}. Focus on logical access, change management, and backup operations.`,
  },
  {
    id: 'aa_representation_letter',
    name: 'Rep Letter (Internal)',
    description: 'Internal management representation.',
    icon: 'FileText',
    category: 'AA',
    inputs: [
      { key: 'dept', label: 'Department', placeholder: 'Finance Dept', type: 'text' },
      { key: 'lead', label: 'Department Lead', placeholder: 'Controller', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft an Internal Representation Letter for the ${i.dept} signed by ${i.lead}. Confirm all records were provided to the auditors.`,
  },
  {
    id: 'aa_exit_memo',
    name: 'Audit Exit Memo',
    description: 'Summarize audit findings for the board.',
    icon: 'CheckSquare',
    category: 'AA',
    inputs: [
      { key: 'findings', label: 'Significant Findings', placeholder: 'Revenue cutoff issue', type: 'textarea' },
      { key: 'adj', label: 'Audit Adjustments', placeholder: '$200k accrual', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft an Audit Exit Memorandum for the Audit Committee. Detail ${i.findings} and summarized ${i.adj} proposed during the audit.`,
  },
  {
    id: 'aa_planning_memo',
    name: 'Planning Memo',
    description: 'Overall audit strategy document.',
    icon: 'Map',
    category: 'AA',
    inputs: [
      { key: 'strategy', label: 'Audit Strategy', placeholder: 'Controls-based approach', type: 'text' },
      { key: 'focus', label: 'Critical Areas', placeholder: 'Capitalization of intangibles', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft an Overall Audit Strategy memo. Goal strategy: ${i.strategy}. Primary focus: ${i.focus}. Highlight significant accounts and timings.`,
  },
  {
    id: 'aa_group_audit',
    name: 'Group Instructions',
    description: 'Instructions to component auditors.',
    icon: 'Share2',
    category: 'AA',
    inputs: [
      { key: 'subsidiary', label: 'Subsidiary Name', placeholder: 'Germany GmbH', type: 'text' },
      { key: 'deadline', label: 'Reporting Deadline', placeholder: 'Jan 15th', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft Group Audit Instructions for the ${i.subsidiary} component. Set a ${i.deadline} reporting deadline and specify required deliverables.`,
  },
  {
    id: 'aa_litigation_summary',
    name: 'Litigation Summary',
    description: 'Evaluate impact of legal claims.',
    icon: 'Scale',
    category: 'AA',
    inputs: [
      { key: 'claim', label: 'Description of Claim', placeholder: 'Patent infringement suit', type: 'textarea' },
    ],
    promptTemplate: i =>
      `Draft a Litigation Impact Summary memo. Evaluate the ${i.claim}, management's assessment of loss, and the need for accrual or disclosure.`,
  },
  {
    id: 'aa_qc_review',
    name: 'EQCR Memo',
    description: 'Engagement Quality Control Review.',
    icon: 'ShieldCheck',
    category: 'AA',
    inputs: [{ key: 'reviewer', label: 'EQC Reviewer', placeholder: 'Partner B', type: 'text' }],
    promptTemplate: i =>
      `Draft an EQCR Review memo by ${i.reviewer}. Summarize the review of significant judgments and the concurrence with the audit opinion.`,
  },
  {
    id: 'aa_completion_checklist',
    name: 'Audit Completion',
    description: 'Final sign-off memo.',
    icon: 'CheckCircle',
    category: 'AA',
    inputs: [{ key: 'partner', label: 'Signing Partner', placeholder: 'Jane Smith', type: 'text' }],
    promptTemplate: i =>
      `Draft an Audit Completion and Sign-off memo for ${i.partner}. Confirm all workpapers are reviewed and documentation is finalized.`,
  },
  {
    id: 'aa_audit_plan',
    name: 'Audit Plan',
    description: 'Outline the strategy and scope of an audit.',
    icon: 'ClipboardCheck',
    category: 'AA',
    inputs: [
      { key: 'client', label: 'Client', placeholder: 'Client X', type: 'text' },
      { key: 'scope', label: 'Audit Scope', placeholder: 'FY2023 Financials', type: 'text' },
      { key: 'risks', label: 'Key Risks', placeholder: 'Revenue recognition, Inventory valuation', type: 'textarea' },
    ],
    promptTemplate: i => `Write an Audit Plan for ${i.client}.
    Scope: ${i.scope}.
    Key Risks: ${i.risks}.
    Include sections: Objective, Scope, Risk Assessment, Team, and Timeline.`,
  },
  {
    id: 'aa_engagement',
    name: 'Engagement Letter',
    description: 'Contract outlining audit services.',
    icon: 'FileSignature',
    category: 'AA',
    inputs: [
      { key: 'client', label: 'Client', placeholder: 'Client Y', type: 'text' },
      { key: 'services', label: 'Services', placeholder: 'Statutory Audit', type: 'textarea' },
      { key: 'fee', label: 'Fee Structure', placeholder: '$15k fixed', type: 'text' },
    ],
    promptTemplate: i => `Draft an Engagement Letter for ${i.client} regarding ${i.services}.
    Fee: ${i.fee}.
    Include standard sections: Objective of Audit, Management Responsibilities, Auditor Responsibilities, Fees, and Reporting.`,
  },
  {
    id: 'aa_deficiency',
    name: 'Deficiency Report',
    description: 'Report on internal control weaknesses.',
    icon: 'AlertOctagon',
    category: 'AA',
    inputs: [
      { key: 'area', label: 'Control Area', placeholder: 'Accounts Payable', type: 'text' },
      { key: 'issue', label: 'Observation/Issue', placeholder: 'Lack of segregation of duties', type: 'textarea' },
      { key: 'impact', label: 'Impact', placeholder: 'Potential for fraud', type: 'text' },
    ],
    promptTemplate: i => `Write an Internal Control Deficiency Report regarding ${i.area}.
    Observation: ${i.issue}.
    Impact: ${i.impact}.
    Structure: Observation, Implication, and Recommendation.`,
  },
  {
    id: 'aa_opinion',
    name: 'Audit Opinion',
    description: 'Draft standard audit opinion text.',
    icon: 'Award',
    category: 'AA',
    inputs: [
      { key: 'type', label: 'Opinion Type', placeholder: 'Unqualified / Qualified', type: 'text' },
      { key: 'basis', label: 'Basis (if qualified)', placeholder: 'Inability to verify inventory', type: 'text' },
    ],
    promptTemplate: i => `Draft the "Opinion" and "Basis for Opinion" sections for a(n) ${i.type} audit report.
    If qualified, include basis: ${i.basis}.
    Use standard ISA/GAAS terminology.`,
  },
  {
    id: 'aa_rep_letter',
    name: 'Rep Letter',
    description: 'Management Representation Letter.',
    icon: 'FileText',
    category: 'AA',
    inputs: [
      { key: 'period', label: 'Period Ended', placeholder: 'Dec 31, 2023', type: 'text' },
      { key: 'specifics', label: 'Specific Confirmations', placeholder: 'No unrecorded litigation', type: 'textarea' },
    ],
    promptTemplate: i => `Draft a Management Representation Letter for the period ended ${i.period}.
    Include specific representations: ${i.specifics}.
    Format as a letter from Management to the Auditor.`,
  },
  {
    id: 'aa_risk',
    name: 'Risk Assessment',
    description: 'Document audit risks and responses.',
    icon: 'ShieldAlert',
    category: 'AA',
    inputs: [
      { key: 'process', label: 'Business Process', placeholder: 'Sales Cycle', type: 'text' },
      { key: 'risks', label: 'Identified Risks', placeholder: 'Overstatement of revenue', type: 'textarea' },
    ],
    promptTemplate: i => `Document a Risk Assessment for the ${i.process}.
    Risks: ${i.risks}.
    For each risk, suggest specific audit procedures (Tests of Controls / Substantive Procedures).`,
  },
  {
    id: 'aa_agenda',
    name: 'Audit Agenda',
    description: 'Agenda for audit planning or closing meeting.',
    icon: 'Calendar',
    category: 'AA',
    inputs: [
      { key: 'meeting', label: 'Meeting Type', placeholder: 'Closing Meeting', type: 'text' },
      { key: 'attendees', label: 'Attendees', placeholder: 'Audit Committee, CFO', type: 'text' },
    ],
    promptTemplate: i => `Create an agenda for an Audit ${i.meeting}.
    Attendees: ${i.attendees}.
    Include items: Significant Findings, Uncorrected Misstatements, Control Deficiencies, and Next Steps.`,
  },
  {
    id: 'aa_confirm',
    name: 'Confirmation Letter',
    description: 'Bank/Debtor confirmation request.',
    icon: 'Send',
    category: 'AA',
    inputs: [
      { key: 'party', label: 'Third Party', placeholder: 'Bank of America', type: 'text' },
      { key: 'items', label: 'Items to Confirm', placeholder: 'Cash balance, Loan covenants', type: 'text' },
    ],
    promptTemplate: i => `Write a standard audit confirmation request letter to ${i.party}.
    Request confirmation of: ${i.items}.
    State that the reply should go directly to the auditors.`,
  },
  {
    id: 'aa_walkthrough',
    name: 'Walkthrough Doc',
    description: 'Document a process walkthrough.',
    icon: 'Footprints',
    category: 'AA',
    inputs: [
      { key: 'process', label: 'Process Name', placeholder: 'Procure to Pay', type: 'text' },
      {
        key: 'steps',
        label: 'Key Steps Observed',
        placeholder: 'PO creation, Approval, Goods Receipt',
        type: 'textarea',
      },
    ],
    promptTemplate: i => `Document a Walkthrough for the ${i.process}.
    Steps Observed: ${i.steps}.
    Format: Narrative description of the flow of documents and authorization points.`,
  },
  {
    id: 'aa_minutes',
    name: 'Closing Minutes',
    description: 'Minutes for audit closing meeting.',
    icon: 'File',
    category: 'AA',
    inputs: [
      { key: 'client', label: 'Client', placeholder: 'ABC Ltd', type: 'text' },
      {
        key: 'points',
        label: 'Key Discussion Points',
        placeholder: 'Inventory adjustment agreed, Tax provision open',
        type: 'textarea',
      },
    ],
    promptTemplate: i => `Draft minutes for the Audit Closing Meeting with ${i.client}.
    Points Discussed: ${i.points}.
    Include Action Items and deadlines.`,
  },
]
