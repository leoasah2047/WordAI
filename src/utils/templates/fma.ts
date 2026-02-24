import { WritingTemplate } from './types'

export const fmaTemplates: WritingTemplate[] = [
  {
    id: 'fma_strategic',
    name: 'Strategic Plan',
    description: 'Long-term business strategy document.',
    icon: 'Map',
    category: 'FMA',
    inputs: [
      { key: 'company', label: 'Company', placeholder: 'Tech Co', type: 'text' },
      { key: 'goals', label: 'Goals (3-5 years)', placeholder: 'Expand to EU, Launch Product X', type: 'textarea' },
    ],
    promptTemplate: i => `Draft an Executive Summary for a Strategic Plan for ${i.company}.
    Goals: ${i.goals}.
    Sections: Vision, Mission, Strategic Objectives, and Key Performance Indicators.`,
  },
  {
    id: 'fma_valuation',
    name: 'Valuation Report',
    description: 'Business valuation summary.',
    icon: 'DollarSign',
    category: 'FMA',
    inputs: [
      { key: 'entity', label: 'Entity', placeholder: 'Target Startup', type: 'text' },
      { key: 'method', label: 'Methodology', placeholder: 'DCF and Market Multiples', type: 'text' },
      { key: 'value', label: 'Est. Value', placeholder: '$5M - $7M', type: 'text' },
    ],
    promptTemplate: i => `Write a Valuation Summary for ${i.entity}.
    Methodology: ${i.method}.
    Range: ${i.value}.
    Briefly explain the assumptions driving the valuation (growth rate, discount rate placeholder).`,
  },
  {
    id: 'fma_dd',
    name: 'Due Diligence',
    description: 'Checklist or report for finding.',
    icon: 'Search',
    category: 'FMA',
    inputs: [
      { key: 'target', label: 'Target', placeholder: 'Company Z', type: 'text' },
      { key: 'findings', label: 'Key Findings', placeholder: 'Strong IP, but high churn pending', type: 'textarea' },
    ],
    promptTemplate: i => `Draft a Due Diligence Summary Report on ${i.target}.
    Key Findings: ${i.findings}.
    Categorize into Commercial, Financial, and Legal risks.`,
  },
  {
    id: 'fma_memo',
    name: 'Investment Memo',
    description: 'Pitch to investment committee.',
    icon: 'TrendingUp',
    category: 'FMA',
    inputs: [
      { key: 'deal', label: 'Deal/Opportunity', placeholder: 'Series A in AI Startup', type: 'text' },
      {
        key: 'thesis',
        label: 'Investment Thesis',
        placeholder: 'Market leader in niche, strong team',
        type: 'textarea',
      },
    ],
    promptTemplate: i => `Write an Investment Memorandum for ${i.deal}.
    Thesis: ${i.thesis}.
    Sections: Opportunity Overview, Market Analysis, Competitive Advantage, Risks, and Recommendation.`,
  },
  {
    id: 'fma_market',
    name: 'Market Analysis',
    description: 'Research report on industry.',
    icon: 'Globe',
    category: 'FMA',
    inputs: [
      { key: 'industry', label: 'Industry', placeholder: 'EV Batteries', type: 'text' },
      {
        key: 'trends',
        label: 'Key Trends',
        placeholder: 'Cost reduction, supply chain consolidation',
        type: 'textarea',
      },
    ],
    promptTemplate: i => `Draft a Market Analysis section for the ${i.industry} sector.
    Trends: ${i.trends}.
    Include Market Size, Growth Drivers, and Competitive Landscape.`,
  },
  {
    id: 'fma_feasibility',
    name: 'Feasibility Study',
    description: 'Assess viability of a project.',
    icon: 'CheckCircle',
    category: 'FMA',
    inputs: [
      { key: 'project', label: 'Project', placeholder: 'New Manufacturing Plant', type: 'text' },
      { key: 'conclusion', label: 'Conclusion', placeholder: 'Feasible but high initial capEx', type: 'textarea' },
    ],
    promptTemplate: i => `Write a Feasibility Study Executive Summary for ${i.project}.
    Conclusion: ${i.conclusion}.
    Analyze Technical, Economic, and Operational feasibility.`,
  },
  {
    id: 'fma_consult',
    name: 'Consulting Proposal',
    description: 'Pitch consulting services.',
    icon: 'Briefcase',
    category: 'FMA',
    inputs: [
      { key: 'client', label: 'Client', placeholder: 'Retail Chain', type: 'text' },
      { key: 'scope', label: 'Scope', placeholder: 'Operational Efficiency Review', type: 'textarea' },
    ],
    promptTemplate: i => `Write a Consulting Proposal for ${i.client}.
    Scope: ${i.scope}.
    Sections: Understanding of the Situation, Proposed Methodology, Deliverables, Timeline, and Professional Fees.`,
  },
  {
    id: 'fma_plan',
    name: 'Business Plan',
    description: 'Executive summary for business plan.',
    icon: 'FileText',
    category: 'FMA',
    inputs: [
      { key: 'business', label: 'Business Concept', placeholder: 'Sustainable Coffee Subscription', type: 'text' },
      { key: 'ask', label: 'Funding Ask', placeholder: '$500k for inventory', type: 'text' },
    ],
    promptTemplate: i => `Draft an Executive Summary for a Business Plan: ${i.business}.
    Ask: ${i.ask}.
    Hook the reader with the problem, solution, market opportunity, and traction.`,
  },
  {
    id: 'fma_kpi',
    name: 'KPI Dashboard',
    description: 'Spec for performance dashboard.',
    icon: 'Activity',
    category: 'FMA',
    inputs: [
      { key: 'func', label: 'Function', placeholder: 'Sales Dept', type: 'text' },
      { key: 'metrics', label: 'Key Metrics', placeholder: 'CAC, LTV, Churn, ARR', type: 'text' },
    ],
    promptTemplate: i => `Design a specification for a KPI Dashboard for ${i.func}.
    Metrics to Include: ${i.metrics}.
    Describe the visualization type for each (e.g., trend line, bar chart) and the source of data.`,
  },
  {
    id: 'fma_turnaround',
    name: 'Turnaround Strategy',
    description: 'Plan for distressed company.',
    icon: 'Shuffle',
    category: 'FMA',
    inputs: [
      { key: 'issue', label: 'Core Issue', placeholder: 'Declining revenue, high debt', type: 'text' },
      { key: 'actions', label: 'Immediate Actions', placeholder: 'Cost cutting, asset sale', type: 'textarea' },
    ],
    promptTemplate: i => `Draft a Turnaround Strategy Plan.
    Core Issue: ${i.issue}.
    Actions: ${i.actions}.
    Focus on Stabilization, Revitalization, and Growth. Tone: Urgent and decisive.`,
  },
  {
    id: 'fma_merger_integration',
    name: 'Merger Integration',
    description: 'Post-merger integration (PMI) roadmap.',
    icon: 'Combine',
    category: 'FMA',
    inputs: [
      { key: 'target', label: 'Acquired Entity', placeholder: 'Startup X', type: 'text' },
      { key: 'day_100', label: 'Day 100 Goals', placeholder: 'Unified IT, culture workshops', type: 'textarea' },
    ],
    promptTemplate: i =>
      `Draft a Post-Merger Integration (PMI) roadmap for ${i.target}. Focus on the first 100 days. Goals: ${i.day_100}. Cover Cultural Integration, Systems Migration, and Communication.`,
  },
  {
    id: 'fma_capex_proposal',
    name: 'CapEx Proposal',
    description: 'Capital expenditure justification.',
    icon: 'Package',
    category: 'FMA',
    inputs: [
      { key: 'asset', label: 'Asset/Project', placeholder: 'Cloud Infrastructure Upgrade', type: 'text' },
      { key: 'cost', label: 'Estimated Cost', placeholder: '$250,000', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft a Capital Expenditure (CapEx) proposal for ${i.asset}. Cost: ${i.cost}. Justify based on future cost savings, risk mitigation, and scalability.`,
  },
  {
    id: 'fma_competitor_profile',
    name: 'Competitor Profile',
    description: 'In-depth analysis of a key competitor.',
    icon: 'Target',
    category: 'FMA',
    inputs: [
      { key: 'competitor', label: 'Competitor Name', placeholder: 'Global Rival Corp', type: 'text' },
      {
        key: 'strengths',
        label: 'Perceived Strengths',
        placeholder: 'Supply chain efficiency, brand loyalty',
        type: 'textarea',
      },
    ],
    promptTemplate: i =>
      `Draft a Competitor Profile for ${i.competitor}. Analyze their ${i.strengths}, product gap analysis, and potential strategic moves.`,
  },
  {
    id: 'fma_swot_analysis',
    name: 'SWOT Analysis',
    description: 'Strengths, Weaknesses, Opportunities, Threats.',
    icon: 'Layout',
    category: 'FMA',
    inputs: [{ key: 'subject', label: 'Analysis Subject', placeholder: 'New Product Launch', type: 'text' }],
    promptTemplate: i =>
      `Produce a detailed SWOT Analysis for ${i.subject}. For each quarter, provide 3-5 strategic points and summarize the strategic implication.`,
  },
  {
    id: 'fma_risk_register',
    name: 'Risk Register',
    description: 'Identify and track enterprise risks.',
    icon: 'ShieldAlert',
    category: 'FMA',
    inputs: [
      { key: 'area', label: 'Risk Area', placeholder: 'Global Supply Chain', type: 'text' },
      { key: 'mitigation', label: 'Current Mitigation', placeholder: 'Dual sourcing, buffer stock', type: 'textarea' },
    ],
    promptTemplate: i =>
      `Draft an Enterprise Risk Register entry for ${i.area}. Detail potential impact, likelihood, and the sufficiency of the ${i.mitigation}.`,
  },
  {
    id: 'fma_investor_deck_narrative',
    name: 'Investor Narrative',
    description: 'Narrative for fundraising pitch deck.',
    icon: 'Award',
    category: 'FMA',
    inputs: [
      { key: 'stage', label: 'Funding Stage', placeholder: 'Series B', type: 'text' },
      { key: 'traction', label: 'Key Traction', placeholder: '3x revenue growth, 50k users', type: 'text' },
    ],
    promptTemplate: i =>
      `Write a compelling narrative for a ${i.stage} pitch deck. Highlight ${i.traction} and build a story around "The Problem" and "The Future".`,
  },
  {
    id: 'fma_exit_strategy',
    name: 'Exit Strategy',
    description: 'Plan for eventual business sale or IPO.',
    icon: 'LogOut',
    category: 'FMA',
    inputs: [
      { key: 'type', label: 'Exit Type', placeholder: 'Trade Sale to a Strategic', type: 'text' },
      { key: 'timeline', label: 'Target Timeline', placeholder: '18-24 months', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft a high-level Exit Strategy document for an ${i.type} within ${i.timeline}. Address value drivers, grooming activities, and target profiles.`,
  },
  {
    id: 'fma_pricing_strategy',
    name: 'Pricing Strategy',
    description: 'Define pricing model for product/service.',
    icon: 'Tag',
    category: 'FMA',
    inputs: [
      { key: 'product', label: 'Product Name', placeholder: 'AI Assistant Pro', type: 'text' },
      { key: 'model', label: 'Pricing Model', placeholder: 'Tiered Subscription (Freemium)', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft a Pricing Strategy for ${i.product} using a ${i.model} model. Analyze competitor pricing and justify the proposed price points based on value.`,
  },
  {
    id: 'fma_org_redesign',
    name: 'Org Redesign',
    description: 'Proposal for restructuring departments.',
    icon: 'Users',
    category: 'FMA',
    inputs: [
      { key: 'dept', label: 'Affected Dept', placeholder: 'Customer Support', type: 'text' },
      { key: 'goal', label: 'Redesign Goal', placeholder: 'Move to a pod-based structure', type: 'textarea' },
    ],
    promptTemplate: i =>
      `Draft an Organizational Redesign proposal for ${i.dept}. Goal: ${i.goal}. Include current state, future state, and the rationale for the change.`,
  },
  {
    id: 'fma_digital_transformation',
    name: 'Digital Roadmap',
    description: 'Plan for adopting digital technology.',
    icon: 'Zap',
    category: 'FMA',
    inputs: [
      { key: 'focus', label: 'Transformation Focus', placeholder: 'Legacy ERP to Cloud', type: 'text' },
      { key: 'roi', label: 'Expected ROI', placeholder: '25% reduction in OpEx', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft a Digital Transformation Roadmap for ${i.focus}. Explain the ${i.roi} and the phased implementation approach (Phase 1: Pilot... etc.).`,
  },
  {
    id: 'fma_benchmarking_report',
    name: 'Benchmark Report',
    description: 'Compare performance vs industry peers.',
    icon: 'BarChart2',
    category: 'FMA',
    inputs: [
      { key: 'metric', label: 'Primary Metric', placeholder: 'EBITDA Margin', type: 'text' },
      { key: 'peer_avg', label: 'Peer Average', placeholder: '18%', type: 'text' },
    ],
    promptTemplate: i =>
      `Produce a Benchmarking Summary Report for ${i.metric}. Compare company performance against the ${i.peer_avg} and identify key gaps.`,
  },
  {
    id: 'fma_board_pack_narrative',
    name: 'Board Narrative',
    description: 'Executive summary for monthly board pack.',
    icon: 'Briefcase',
    category: 'FMA',
    inputs: [
      { key: 'month', label: 'Month', placeholder: 'October', type: 'text' },
      { key: 'top_risk', label: 'Top Risk/Issue', placeholder: 'Regulatory change in X', type: 'text' },
    ],
    promptTemplate: i =>
      `Write the CEO/CFO narrative for the ${i.month} board pack. Highlight key achievements, financial variance, and the ${i.top_risk}.`,
  },
  {
    id: 'fma_partnership_proposal',
    name: 'Strategic Partnership',
    description: 'Pitch for a strategic alliance.',
    icon: 'Handshake',
    category: 'FMA',
    inputs: [
      { key: 'partner', label: 'Potential Partner', placeholder: 'Big Tech Corp', type: 'text' },
      { key: 'value_prop', label: 'Joint Value Prop', placeholder: 'Combined AI and Distribution', type: 'textarea' },
    ],
    promptTemplate: i =>
      `Draft a Strategic Partnership Proposal to ${i.partner}. Highlight the ${i.value_prop} and propose an initial 6-month pilot program.`,
  },
  {
    id: 'fma_cash_flow_forecast',
    name: 'Cash Forecast',
    description: 'Rolling 13-week cash flow narrative.',
    icon: 'TrendingUp',
    category: 'FMA',
    inputs: [{ key: 'period', label: 'Forecast Period', placeholder: 'Q4 2024', type: 'text' }],
    promptTemplate: i =>
      `Write a narrative for a rolling 13-week cash flow forecast for ${i.period}. Explain major expected swings and the liquidity buffer.`,
  },
  {
    id: 'fma_product_roadmap_narrative',
    name: 'Roadmap Narrative',
    description: 'Executive summary of product development.',
    icon: 'Map',
    category: 'FMA',
    inputs: [
      { key: 'horizon', label: 'Planning Horizon', placeholder: 'Next 12 months', type: 'text' },
      { key: 'priority', label: 'Top Priority', placeholder: 'Mobile App Launch', type: 'text' },
    ],
    promptTemplate: i =>
      `Write the executive narrative for a ${i.horizon} product roadmap. Center the story on ${i.priority} and its impact on the market.`,
  },
  {
    id: 'fma_change_management_plan',
    name: 'Change Plan',
    description: 'Strategy for managing organizational change.',
    icon: 'Briefcase',
    category: 'FMA',
    inputs: [
      { key: 'change', label: 'Change Event', placeholder: 'Shift to Agile', type: 'text' },
      { key: 'stakeholders', label: 'Key Stakeholders', placeholder: 'Engineering and Product teams', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft a Change Management Plan for the ${i.change}. Address concern from ${i.stakeholders} and define the communication and training phases.`,
  },
  {
    id: 'fma_crisis_comm_plan',
    name: 'Crisis Comm',
    description: 'Plan for external comms during crisis.',
    icon: 'Bell',
    category: 'FMA',
    inputs: [
      { key: 'scenario', label: 'Crisis Scenario', placeholder: 'Data Breach', type: 'text' },
      { key: 'spokesperson', label: 'Lead Spokesperson', placeholder: 'Chief Communications Officer', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft a Crisis Communications Plan for a(n) ${i.scenario}. Define the immediate response message, the ${i.spokesperson}, and internal briefing chain.`,
  },
]
