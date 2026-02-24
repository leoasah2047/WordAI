import { WritingTemplate } from './types'

export const caTemplates: WritingTemplate[] = [
  {
    id: 'ca_variance',
    name: 'Variance Analysis',
    description: 'Explanation of budget vs actuals.',
    icon: 'BarChart2',
    category: 'CA',
    inputs: [
      { key: 'line_item', label: 'GL Line Item', placeholder: 'Travel Expense', type: 'text' },
      {
        key: 'variance',
        label: 'Variance Details',
        placeholder: '$50k over budget due to conference',
        type: 'textarea',
      },
    ],
    promptTemplate: i => `Write a Variance Analysis commentary for ${i.line_item}.
    Details: ${i.variance}.
    Explain the root cause, whether it is permanent or timing difference, and future outlook.`,
  },
  {
    id: 'ca_policy',
    name: 'Expense Policy',
    description: 'Draft standard expense reimbursement policy.',
    icon: 'DollarSign',
    category: 'CA',
    inputs: [
      { key: 'category', label: 'Expense Category', placeholder: 'Meals & Entertainment', type: 'text' },
      { key: 'limits', label: 'Limits/Rules', placeholder: '$50/person limit, receipt required >$25', type: 'text' },
    ],
    promptTemplate: i => `Draft a corporate policy section for ${i.category} expenses.
    Rules: ${i.limits}.
    Include procedures for submission, approval, and exceptions.`,
  },
  {
    id: 'ca_footnote',
    name: 'Financial Footnote',
    description: 'Draft financial statement disclosure.',
    icon: 'BookOpen',
    category: 'CA',
    inputs: [
      { key: 'topic', label: 'Disclosure Topic', placeholder: 'Revenue Recognition (ASC 606)', type: 'text' },
      {
        key: 'details',
        label: 'Specific Policy',
        placeholder: 'Recognize point in time upon delivery',
        type: 'textarea',
      },
    ],
    promptTemplate: i => `Draft a Financial Statement Footnote disclosure for ${i.topic}.
    Policy Details: ${i.details}.
    Use standard GAAP/IFRS disclosure language.`,
  },
  {
    id: 'ca_budget',
    name: 'Budget Proposal',
    description: 'Proposal for department budget.',
    icon: 'PieChart',
    category: 'CA',
    inputs: [
      { key: 'dept', label: 'Department', placeholder: 'IT', type: 'text' },
      { key: 'increase', label: 'Requested Increase', placeholder: '15% for new licenses', type: 'text' },
    ],
    promptTemplate: i => `Write a budget proposal justification for the ${i.dept} department.
    Request: ${i.increase}.
    Justify based on ROI, necessity, and strategic alignment.`,
  },
  {
    id: 'ca_credit',
    name: 'Credit App Response',
    description: 'Reply to a credit application.',
    icon: 'CreditCard',
    category: 'CA',
    inputs: [
      { key: 'customer', label: 'Customer', placeholder: 'New Client Inc', type: 'text' },
      { key: 'decision', label: 'Decision', placeholder: 'Approved, $50k limit', type: 'text' },
    ],
    promptTemplate: i => `Write a letter to ${i.customer} regarding their credit application.
    Decision: ${i.decision}.
    Outline terms of payment (e.g., Net 30) and next steps.`,
  },
  {
    id: 'ca_collection',
    name: 'Debt Collection',
    description: 'Overdue payment reminder.',
    icon: 'Bell',
    category: 'CA',
    inputs: [
      { key: 'customer', label: 'Customer', placeholder: 'Late Payer LLC', type: 'text' },
      { key: 'amount', label: 'Amount Overdue', placeholder: '$12,500 (90 days)', type: 'text' },
    ],
    promptTemplate: i => `Write a firm debt collection letter to ${i.customer}.
    Amount: ${i.amount}.
    Demand immediate payment, reference previous attempts, and mention potential escalation/legal action.`,
  },
  {
    id: 'ca_payroll',
    name: 'Payroll Recon',
    description: 'Memo explaining payroll variances.',
    icon: 'Users',
    category: 'CA',
    inputs: [
      { key: 'period', label: 'Pay Period', placeholder: 'March 2024', type: 'text' },
      { key: 'diff', label: 'Difference', placeholder: 'Higher due to bonuses', type: 'textarea' },
    ],
    promptTemplate: i => `Write a memo reconciling payroll expense for ${i.period}.
    Explanation of variance: ${i.diff}.
    Break down key drivers (headcount, OT, bonus).`,
  },
  {
    id: 'ca_asset',
    name: 'Asset Disposal',
    description: 'Request approval to dispose asset.',
    icon: 'Trash2',
    category: 'CA',
    inputs: [
      { key: 'asset', label: 'Asset', placeholder: 'Old Server Rack', type: 'text' },
      { key: 'reason', label: 'Reason/Value', placeholder: 'Obsolete, $0 salvage', type: 'text' },
    ],
    promptTemplate: i => `Write a Fixed Asset Disposal Request form/memo for ${i.asset}.
    Reason: ${i.reason}.
    Include original cost (placeholder), accumulated depreciation (placeholder), and recommended method of disposal.`,
  },
  {
    id: 'ca_tax',
    name: 'Tax Inquiry Response',
    description: 'Reply to a tax notice/inquiry.',
    icon: 'FileText',
    category: 'CA',
    inputs: [
      { key: 'agency', label: 'Tax Agency', placeholder: 'IRS / HMRC', type: 'text' },
      { key: 'issue', label: 'Issue', placeholder: 'Clarification on 2022 deduction', type: 'textarea' },
    ],
    promptTemplate: i => `Draft a formal response to ${i.agency} regarding ${i.issue}.
    State the facts clearly, reference attached evidence, and provide contact info. Tone: Polite and compliant.`,
  },
  {
    id: 'ca_review',
    name: 'Financial Review',
    description: 'Monthly Management Discussion & Analysis (MD&A).',
    icon: 'TrendingUp',
    category: 'CA',
    inputs: [
      { key: 'month', label: 'Month', placeholder: 'April 2024', type: 'text' },
      { key: 'highlights', label: 'Highlights', placeholder: 'Record sales, high utility costs', type: 'textarea' },
    ],
    promptTemplate: i => `Write a Monthly Financial Review (MD&A) for ${i.month}.
    Highlights: ${i.highlights}.
    Cover P&L, Balance Sheet, and Cash Flow high-level movements.`,
  },
  {
    id: 'ca_gl_recon',
    name: 'GL Reconciliation',
    description: 'Document reconciliation of a GL account.',
    icon: 'RefreshCw',
    category: 'CA',
    inputs: [
      { key: 'account', label: 'Account Name', placeholder: 'Prepaid Expenses', type: 'text' },
      { key: 'balance', label: 'GL Balance', placeholder: '$150,000', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft a General Ledger Reconciliation memo for ${i.account}. GL Balance: ${i.balance}. Detail the reconciling items and aging findings.`,
  },
  {
    id: 'ca_fixed_asset_log',
    name: 'Fixed Asset Log',
    description: 'Manual entry for fixed asset register.',
    icon: 'Package',
    category: 'CA',
    inputs: [
      { key: 'asset', label: 'Asset Name', placeholder: 'MacBook Pro', type: 'text' },
      { key: 'cost', label: 'Purchase Cost', placeholder: '$3,000', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft a Fixed Asset Register entry for ${i.asset}. Cost: ${i.cost}. Specify depreciation method (SL), useful life (3y), and location.`,
  },
  {
    id: 'ca_accrual_memo',
    name: 'Accrual Memo',
    description: 'Justify a month-end accrual entry.',
    icon: 'Clock',
    category: 'CA',
    inputs: [
      { key: 'vendor', label: 'Vendor/Service', placeholder: 'AWS', type: 'text' },
      { key: 'est_amount', label: 'Estimated Amount', placeholder: '$5,000', type: 'text' },
    ],
    promptTemplate: i =>
      `Write an Accrual Justification memo for ${i.vendor}. Amount: ${i.est_amount}. Explain why the invoice is pending and the basis for estimate.`,
  },
  {
    id: 'ca_internal_audit_response',
    name: 'IA Response',
    description: 'Management response to internal audit findings.',
    icon: 'CheckCircle',
    category: 'CA',
    inputs: [{ key: 'finding', label: 'Audit Finding', placeholder: 'Missing signatures on POs', type: 'textarea' }],
    promptTemplate: i =>
      `Draft a Management Response to Internal Audit regarding "${i.finding}". Detail the root cause and the corrective action plan.`,
  },
  {
    id: 'ca_intercompany_billing',
    name: 'Intercompany Bill',
    description: 'Request for intercompany settlement.',
    icon: 'ArrowRightLeft',
    category: 'CA',
    inputs: [
      { key: 'from', label: 'Charge From (Entity)', placeholder: 'HQ', type: 'text' },
      { key: 'to', label: 'Charge To (Entity)', placeholder: 'UK Subsidiary', type: 'text' },
      { key: 'amount', label: 'Amount', placeholder: '$25,000', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft an Intercompany Billing notification from ${i.from} to ${i.to} for ${i.amount}. Specify the nature of shared service charges.`,
  },
  {
    id: 'ca_treasury_report',
    name: 'Treasury Report',
    description: 'Weekly cash position summary.',
    icon: 'Wallet',
    category: 'CA',
    inputs: [{ key: 'cash', label: 'Total Cash on Hand', placeholder: '$1.2M', type: 'text' }],
    promptTemplate: i =>
      `Write a Weekly Treasury Report. Total Cash: ${i.cash}. Summarize major inflows/outflows expected next week and liquidity ratio.`,
  },
  {
    id: 'ca_bad_debt_writeoff',
    name: 'Bad Debt Write-off',
    description: 'Request approval to write off uncollectible debt.',
    icon: 'MinusCircle',
    category: 'CA',
    inputs: [
      { key: 'customer', label: 'Customer', placeholder: 'Defunct Co', type: 'text' },
      { key: 'amount', label: 'Amount', placeholder: '$12,000', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft a Bad Debt Write-off Request for ${i.customer}. Amount: ${i.amount}. Detail collection efforts made and why the debt is now uncollectible.`,
  },
  {
    id: 'ca_rev_rec_memo',
    name: 'RevRec Memo',
    description: 'Analyze revenue recognition for complex deal.',
    icon: 'Search',
    category: 'CA',
    inputs: [
      { key: 'deal', label: 'Deal Description', placeholder: 'Bundled hardware/software', type: 'textarea' },
      { key: 'standard', label: 'Standard (IFRS15/ASC606)', placeholder: 'ASC 606', type: 'text' },
    ],
    promptTemplate: i =>
      `Write a Revenue Recognition Analysis for the ${i.deal} deal under ${i.standard}. Identify performance obligations and allocation of price.`,
  },
  {
    id: 'ca_dividend_announcement',
    name: 'Dividend Notice',
    description: 'Formal announcement of dividend payment.',
    icon: 'Award',
    category: 'CA',
    inputs: [
      { key: 'rate', label: 'Dividend per Share', placeholder: '$0.50', type: 'text' },
      { key: 'record_date', label: 'Record Date', placeholder: 'June 30', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft a Board Resolution and Shareholder Notice for a dividend payment of ${i.rate} per share. Record date: ${i.record_date}.`,
  },
  {
    id: 'ca_audit_fee_negotiation',
    name: 'Audit Fee Neg',
    description: 'Letter regarding audit fee adjustment.',
    icon: 'DollarSign',
    category: 'CA',
    inputs: [
      { key: 'firm', label: 'Auditor Firm', placeholder: 'Firm X', type: 'text' },
      { key: 'proposed', label: 'Proposed Fee', placeholder: '$45,000', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft a letter to ${i.firm} regarding the ${i.proposed} audit fee quote. Request a breakdown and justify a lower fee based on efficiency.`,
  },
  {
    id: 'ca_cap_call',
    name: 'Contribution Request',
    description: 'Capital call notice for partners.',
    icon: 'PlusCircle',
    category: 'CA',
    inputs: [
      { key: 'partner', label: 'Partner Name', placeholder: 'Limited Partner A', type: 'text' },
      { key: 'amount', label: 'Contribution Amount', placeholder: '$100,000', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft a Capital Contribution Request to ${i.partner}. Amount: ${i.amount}. Goal: Fund new market expansion. Include payment instructions.`,
  },
  {
    id: 'ca_foreign_exchange_memo',
    name: 'FX Impact Memo',
    description: 'Explain realized/unrealized FX gains/losses.',
    icon: 'Globe',
    category: 'CA',
    inputs: [{ key: 'impact', label: 'Net Impact', placeholder: '$30k loss (EUR/USD)', type: 'text' }],
    promptTemplate: i =>
      `Write an FX Impact analysis memo. Net Impact: ${i.impact}. Explain the drivers (currency fluctuation vs conversion) and hedging status.`,
  },
  {
    id: 'ca_lease_analysis',
    name: 'Lease Analysis',
    description: 'Evaluate lease vs buy for equipment.',
    icon: 'FileText',
    category: 'CA',
    inputs: [
      { key: 'asset', label: 'Equipment', placeholder: 'Delivery Truck', type: 'text' },
      { key: 'terms', label: 'Lease Terms', placeholder: '60 months at $800/mo', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft a Lease vs. Buy Analysis for the ${i.asset}. Terms: ${i.terms}. Calculate NPV and recommend the most cost-effective option.`,
  },
  {
    id: 'ca_sox_compliance_cert',
    name: 'SOX Certification',
    description: 'Formal internal SOX control certification.',
    icon: 'ShieldCheck',
    category: 'CA',
    inputs: [{ key: 'control', label: 'Control Owner', placeholder: 'AP Manager', type: 'text' }],
    promptTemplate: i =>
      `Draft an Internal Control Certification for SOX compliance by ${i.control}. Attest to the effectiveness of controls over financial reporting.`,
  },
  {
    id: 'ca_prepaid_amortization',
    name: 'Prepaid Amort',
    description: 'Schedule/Memo for prepaid expense recognition.',
    icon: 'Calendar',
    category: 'CA',
    inputs: [
      { key: 'item', label: 'Prepaid Item', placeholder: 'Annual Insurance', type: 'text' },
      { key: 'monthly', label: 'Monthly Amort', placeholder: '$1,200', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft a Prepaid Amortization schedule memo for ${i.item}. Recognition of ${i.monthly} per month. Specify GL coding and review period.`,
  },
  {
    id: 'ca_audit_committee_presentation',
    name: 'Audit Committee Deck',
    description: 'Narrative for audit committee deck.',
    icon: 'BarChart',
    category: 'CA',
    inputs: [
      { key: 'quarter', label: 'Quarter/Year', placeholder: 'Q1 2024', type: 'text' },
      { key: 'concerns', label: 'Key Concerns', placeholder: 'Cybersecurity, Inventory slow-down', type: 'textarea' },
    ],
    promptTemplate: i =>
      `Write the executive narrative for the ${i.quarter} Audit Committee presentation. Highlight financial performance and address ${i.concerns}.`,
  },
  {
    id: 'ca_inventory_obsolescence',
    name: 'Inventory Reserve',
    description: 'Justify inventory obsolescence reserve.',
    icon: 'Package',
    category: 'CA',
    inputs: [
      { key: 'product', label: 'Product Line', placeholder: 'Old Tech Models', type: 'text' },
      { key: 'reserve', label: 'Reserve Amount', placeholder: '$80,000', type: 'text' },
    ],
    promptTemplate: i =>
      `Write an Inventory Obsolescence Reserve memo for ${i.product}. Amount: ${i.reserve}. Detail aging analysis and net realizable value (NRV) basis.`,
  },
  {
    id: 'ca_erp_migration_plan',
    name: 'ERP Migration',
    description: 'Accounting plan for ERP transition.',
    icon: 'Shuffle',
    category: 'CA',
    inputs: [{ key: 'new_erp', label: 'New ERP System', placeholder: 'Oracle NetSuite', type: 'text' }],
    promptTemplate: i =>
      `Draft the Accounting Workstream plan for migration to ${i.new_erp}. Focus on data mapping, trial balance takeoff, and parallel testing.`,
  },
  {
    id: 'ca_petty_cash_policy',
    name: 'Petty Cash Policy',
    description: 'Rules for small cash disbursements.',
    icon: 'DollarSign',
    category: 'CA',
    inputs: [
      { key: 'limit', label: 'Cash Limit', placeholder: '$200', type: 'text' },
      { key: 'custodian', label: 'Custodian', placeholder: 'Office Manager', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft a Petty Cash Policy. Set a ${i.limit} limit and name ${i.custodian} as lead. Detail vouchers, reconciliation, and replenishment.`,
  },
  {
    id: 'ca_statutory_reporting',
    name: 'Statutory Report',
    description: 'Overview for statutory local filing.',
    icon: 'FileText',
    category: 'CA',
    inputs: [{ key: 'jurisdiction', label: 'Legal Jurisdiction', placeholder: 'Hong Kong', type: 'text' }],
    promptTemplate: i =>
      `Draft an overview for statutory financial reporting in ${i.jurisdiction}. Highlight local filing deadlines and GAAP to local conversion (if any).`,
  },
]
