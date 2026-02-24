import { WritingTemplate } from './types'

export const lpTemplates: WritingTemplate[] = [
  {
    id: 'lp_nda',
    name: 'NDA',
    description: 'Non-Disclosure Agreement.',
    icon: 'Lock',
    category: 'LP',
    inputs: [
      { key: 'party_b', label: 'Recipient Party', placeholder: 'Consultant Name', type: 'text' },
      { key: 'purpose', label: 'Purpose', placeholder: 'Potential M&A discussion', type: 'text' },
    ],
    promptTemplate: i => `Draft a standard Mutual Non-Disclosure Agreement (NDA) between "the Company" and ${i.party_b}.
    Purpose: ${i.purpose}.
    Include definitions of Confidential Information, Exclusions, Term (e.g., 2 years), and Remedies.`,
  },
  {
    id: 'lp_cease',
    name: 'Cease & Desist',
    description: 'Demand letter to stop activity.',
    icon: 'Hand',
    category: 'LP',
    inputs: [
      { key: 'recipient', label: 'Recipient', placeholder: 'Infringer Ltd', type: 'text' },
      { key: 'activity', label: 'Infringing Activity', placeholder: 'Using our trademark Logo', type: 'textarea' },
    ],
    promptTemplate: i => `Write a formal Cease and Desist letter to ${i.recipient}.
    Activity: ${i.activity}.
    Demand immediate cessation and removal. Set a deadline for compliance before legal action. Tone: Stern and legalistic.`,
  },
  {
    id: 'lp_amend',
    name: 'Contract Amendment',
    description: 'Modify an existing agreement.',
    icon: 'Edit3',
    category: 'LP',
    inputs: [
      { key: 'contract', label: 'Original Contract', placeholder: 'Service Agreement dated 1/1/20', type: 'text' },
      {
        key: 'change',
        label: 'Amendment',
        placeholder: 'Extend term by 1 year, increase rate to $100/hr',
        type: 'textarea',
      },
    ],
    promptTemplate: i => `Draft an Amendment to the ${i.contract}.
    Changes: ${i.change}.
    State that all other terms remain in full force and effect.`,
  },
  {
    id: 'lp_memo',
    name: 'Legal Memo',
    description: 'Internal memo analyzing legal issue.',
    icon: 'FileText',
    category: 'LP',
    inputs: [
      { key: 'issue', label: 'Legal Issue', placeholder: 'Liability for AI generated content', type: 'text' },
      { key: 'conclusion', label: 'Short Conclusion', placeholder: 'Likely protected under term X', type: 'textarea' },
    ],
    promptTemplate: i => `Write a Legal Memorandum on: ${i.issue}.
    Conclusion: ${i.conclusion}.
    Structure: Question Presented, Brief Answer, Facts, Analysis/Discussion, and Conclusion.`,
  },
  {
    id: 'lp_resolution',
    name: 'Board Resolution',
    description: 'Document board decision.',
    icon: 'Users',
    category: 'LP',
    inputs: [
      {
        key: 'action',
        label: 'Action Approved',
        placeholder: 'Authorize opening bank account at Chase',
        type: 'textarea',
      },
    ],
    promptTemplate: i => `Draft a Corporate Board Resolution.
    Resolved that: ${i.action}.
    Include standard preamble "Whereas..." clauses and "Now, therefore, be it resolved" language.`,
  },
  {
    id: 'lp_engage',
    name: 'Client Engagement',
    description: 'Legal representation letter.',
    icon: 'Briefcase',
    category: 'LP',
    inputs: [
      { key: 'client', label: 'Client', placeholder: 'Mr. Smith', type: 'text' },
      { key: 'matter', label: 'Matter', placeholder: 'Estate Planning', type: 'text' },
      { key: 'rates', label: 'Rates', placeholder: '$400/hr + retainer', type: 'text' },
    ],
    promptTemplate: i => `Write a Legal Engagement Letter to ${i.client} for ${i.matter}.
    Rates: ${i.rates}.
    Cover Scope of Representation, Fees, Billing Practices, and Client Responsibilities.`,
  },
  {
    id: 'lp_poa',
    name: 'Power of Attorney',
    description: 'Grant limited or full authority.',
    icon: 'Key',
    category: 'LP',
    inputs: [
      { key: 'agent', label: 'Agent/Attorney-in-Fact', placeholder: 'Jane Doe', type: 'text' },
      { key: 'powers', label: 'Powers Granted', placeholder: 'Sign real estate closing docs', type: 'textarea' },
    ],
    promptTemplate: i => `Draft a Limited Power of Attorney granting ${i.agent} authority to: ${i.powers}.
    Include effective dates and ratification of acts.`,
  },
  {
    id: 'lp_settle',
    name: 'Settlement Agreement',
    description: 'Resolve a dispute.',
    icon: 'CheckSquare',
    category: 'LP',
    inputs: [
      { key: 'parties', label: 'Parties', placeholder: 'Company A and Company B', type: 'text' },
      { key: 'terms', label: 'Terms', placeholder: 'Pay $5k, release all claims', type: 'textarea' },
    ],
    promptTemplate: i => `Draft a Settlement and Release Agreement between ${i.parties}.
    Terms: ${i.terms}.
    Include Mutual Release, Non-Admission of Liability, and Confidentiality clauses.`,
  },
  {
    id: 'lp_privacy',
    name: 'Privacy Policy',
    description: 'Website/App privacy policy.',
    icon: 'Shield',
    category: 'LP',
    inputs: [
      { key: 'company', label: 'Company', placeholder: 'App Inc', type: 'text' },
      { key: 'data', label: 'Data Collected', placeholder: 'Email, IP, Device ID', type: 'textarea' },
    ],
    promptTemplate: i => `Write a Privacy Policy for ${i.company}.
    Data Collected: ${i.data}.
    Include sections: Information Collection, Use of Info, Sharing, Security, and User Rights (GDPR/CCPA compliant phrasing).`,
  },
  {
    id: 'lp_tos',
    name: 'Terms of Service',
    description: 'Standard ToS for service/site.',
    icon: 'FileText',
    category: 'LP',
    inputs: [
      { key: 'service', label: 'Service Name', placeholder: 'SaaS Platform', type: 'text' },
      {
        key: 'restrictions',
        label: 'Key Restrictions',
        placeholder: 'No illegal use, no reverse engineering',
        type: 'textarea',
      },
    ],
    promptTemplate: i => `Draft Terms of Service for ${i.service}.
    Restrictions: ${i.restrictions}.
    Include standard headers: Acceptance of Terms, User Conduct, IP Rights, Termination, and Limitation of Liability.`,
  },
  {
    id: 'lp_service_agreement',
    name: 'Service Agreement',
    description: 'Agreement for professional services.',
    icon: 'Briefcase',
    category: 'LP',
    inputs: [
      { key: 'client', label: 'Client Name', placeholder: 'Client X', type: 'text' },
      { key: 'scope', label: 'Scope of Services', placeholder: 'Consulting on X', type: 'textarea' },
    ],
    promptTemplate: i =>
      `Draft a Professional Service Agreement with ${i.client}. Scope: ${i.scope}. Include Fee Schedule, Term, Termination, and Intellectual Property rights.`,
  },
  {
    id: 'lp_employment_contract',
    name: 'Employment Contract',
    description: 'Formal employment agreement.',
    icon: 'Users',
    category: 'LP',
    inputs: [
      { key: 'employee', label: 'Employee Name', placeholder: 'Jane Doe', type: 'text' },
      { key: 'salary', label: 'Base Salary', placeholder: '$100,000', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft an Employment Contract for ${i.employee} with a ${i.salary} base salary. Include duties, benefits, and non-compete/non-solicit clauses.`,
  },
  {
    id: 'lp_shareholder_agreement',
    name: 'Shareholder Agreement',
    description: 'Agreement between company shareholders.',
    icon: 'Share2',
    category: 'LP',
    inputs: [{ key: 'company', label: 'Company Name', placeholder: 'Startup Inc', type: 'text' }],
    promptTemplate: i =>
      `Draft a Shareholder Agreement for ${i.company}. Cover management of the company, shareholder voting rights, and share transfer restrictions (Right of First Refusal).`,
  },
  {
    id: 'lp_operating_agreement',
    name: 'LLC Operating Agreement',
    description: 'Internal governing document for an LLC.',
    icon: 'FileText',
    category: 'LP',
    inputs: [{ key: 'llc', label: 'LLC Name', placeholder: 'Main Street LLC', type: 'text' }],
    promptTemplate: i =>
      `Draft an Operating Agreement for ${i.llc}. Define membership interests, distribution of profits/losses, and manager responsibilities.`,
  },
  {
    id: 'lp_partnership_agreement',
    name: 'Partnership Agreement',
    description: 'Agreement for a general or limited partnership.',
    icon: 'Users',
    category: 'LP',
    inputs: [{ key: 'partnership', label: 'Partnership Name', placeholder: 'Smith & Jones', type: 'text' }],
    promptTemplate: i =>
      `Draft a Partnership Agreement for ${i.partnership}. Outline capital contributions, profit sharing, and decision-making authority.`,
  },
  {
    id: 'lp_lease_agreement',
    name: 'Commercial Lease',
    description: 'Agreement for commercial property rental.',
    icon: 'Home',
    category: 'LP',
    inputs: [
      { key: 'tenant', label: 'Tenant Name', placeholder: 'Retail Shop LLC', type: 'text' },
      { key: 'rent', label: 'Monthly Rent', placeholder: '$5,000', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft a Commercial Lease Agreement with ${i.tenant}. Rent: ${i.rent}. Include insurance requirements, maintenance responsibilities, and default terms.`,
  },
  {
    id: 'lp_purchase_agreement',
    name: 'Asset Purchase',
    description: 'Agreement for buying company assets.',
    icon: 'ShoppingBag',
    category: 'LP',
    inputs: [
      { key: 'buyer', label: 'Buyer', placeholder: 'Acquirer Corp', type: 'text' },
      { key: 'seller', label: 'Seller', placeholder: 'Target LLC', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft an Asset Purchase Agreement between ${i.buyer} and ${i.seller}. Define Acquired Assets, Excluded Assets, and Purchase Price Allocation.`,
  },
  {
    id: 'lp_loan_agreement',
    name: 'Loan Agreement',
    description: 'Contract for lending/borrowing money.',
    icon: 'DollarSign',
    category: 'LP',
    inputs: [
      { key: 'lender', label: 'Lender', placeholder: 'Bank X', type: 'text' },
      { key: 'principal', label: 'Principal Amount', placeholder: '$500,000', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft a Loan Agreement between ${i.lender} and the Borrower for ${i.principal}. Include Interest Rate, Repayment Schedule, and Default events.`,
  },
  {
    id: 'lp_indemnity_agreement',
    name: 'Indemnity Agreement',
    description: 'Contract for protection against loss/damage.',
    icon: 'Shield',
    category: 'LP',
    inputs: [{ key: 'party', label: 'Indemnified Party', placeholder: 'New Director', type: 'text' }],
    promptTemplate: i =>
      `Draft an Indemnity Agreement for the benefit of ${i.party}. Cover third-party claims, legal fees, and notice requirements.`,
  },
  {
    id: 'lp_licensing_agreement',
    name: 'Software License',
    description: 'Agreement for software use/distribution.',
    icon: 'Code',
    category: 'LP',
    inputs: [
      { key: 'licensee', label: 'Licensee', placeholder: 'User Co', type: 'text' },
      { key: 'fee', label: 'License Fee', placeholder: '$1,000/year', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft a Software License Agreement with ${i.licensee}. Fee: ${i.fee}. Cover Scope of License, Restrictions on Use, and Warranty Disclaimers.`,
  },
  {
    id: 'lp_joint_venture',
    name: 'Joint Venture',
    description: 'Agreement to pool resources for a project.',
    icon: 'Share',
    category: 'LP',
    inputs: [{ key: 'project', label: 'Project Name', placeholder: 'Project Orion', type: 'text' }],
    promptTemplate: i =>
      `Draft a Joint Venture Agreement for ${i.project}. Define contributions from each party, governance, and exit strategy.`,
  },
  {
    id: 'lp_distribution_agreement',
    name: 'Distribution Agreement',
    description: 'Agreement to distribute products.',
    icon: 'Truck',
    category: 'LP',
    inputs: [
      { key: 'distributor', label: 'Distributor', placeholder: 'Global Sales Ltd', type: 'text' },
      { key: 'territory', label: 'Territory', placeholder: 'European Union', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft a Product Distribution Agreement with ${i.distributor} for the ${i.territory} territory. Define Exclusivity, Pricing, and Invoicing terms.`,
  },
  {
    id: 'lp_franchise_agreement',
    name: 'Franchise Agreement',
    description: 'Contract for operating a franchise.',
    icon: 'MapPin',
    category: 'LP',
    inputs: [{ key: 'franchisee', label: 'Franchisee', placeholder: 'Local Owner LLC', type: 'text' }],
    promptTemplate: i =>
      `Draft a Franchise Agreement with ${i.franchisee}. Define use of Intellectual Property, Quality Standards, and Royalty Fees.`,
  },
  {
    id: 'lp_affiliate_agreement',
    name: 'Affiliate Agreement',
    description: 'Agreement for referral-based marketing.',
    icon: 'Link',
    category: 'LP',
    inputs: [{ key: 'affiliate', label: 'Affiliate', placeholder: 'Marketing Pro', type: 'text' }],
    promptTemplate: i =>
      `Draft an Affiliate Marketing Agreement with ${i.affiliate}. Define commission rates, tracking mechanisms, and prohibited practices.`,
  },
  {
    id: 'lp_consulting_contract',
    name: 'Consulting Contract',
    description: 'Independent contractor agreement for consulting.',
    icon: 'User',
    category: 'LP',
    inputs: [
      { key: 'consultant', label: 'Consultant', placeholder: 'Dr. Jones', type: 'text' },
      { key: 'rate', label: 'Daily/Hourly Rate', placeholder: '$2,000/day', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft a Consulting Services Agreement with ${i.consultant}. Rate: ${i.rate}. Cover Deliverables, Professional Standard of Care, and Limitation of Liability.`,
  },
  {
    id: 'lp_bylaws',
    name: 'Corporate Bylaws',
    description: 'Governing rules for a corporation.',
    icon: 'Settings',
    category: 'LP',
    inputs: [{ key: 'corp', label: 'Corporation', placeholder: 'Global Inc', type: 'text' }],
    promptTemplate: i =>
      `Draft Corporate Bylaws for ${i.corp}. Define Board of Directors structure, Officer roles, and Shareholder meeting procedures.`,
  },
  {
    id: 'lp_articles_of_inc',
    name: 'Articles of Inc',
    description: 'Legal document initiating a corporation.',
    icon: 'File',
    category: 'LP',
    inputs: [{ key: 'corp', label: 'Corporation', placeholder: 'Global Inc', type: 'text' }],
    promptTemplate: i =>
      `Draft Articles of Incorporation for ${i.corp}. Specify Purpose, Registered Agent, and Authorized Share Capital.`,
  },
  {
    id: 'lp_merger_agreement',
    name: 'Merger Agreement',
    description: 'Agreement to combine two companies.',
    icon: 'Merge',
    category: 'LP',
    inputs: [
      { key: 'target', label: 'Target Company', placeholder: 'Startup B', type: 'text' },
      { key: 'acquirer', label: 'Acquiring Company', placeholder: 'Corp A', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft a Merger Agreement between ${i.acquirer} and ${i.target}. Define the Plan of Merger, Closing Conditions, and Post-closing covenants.`,
  },
  {
    id: 'lp_legal_opinion',
    name: 'Legal Opinion Letter',
    description: 'Professional legal assessment.',
    icon: 'Award',
    category: 'LP',
    inputs: [{ key: 'issue', label: 'Issue for Opinion', placeholder: 'Compliance with Law X', type: 'textarea' }],
    promptTemplate: i =>
      `Write a Legal Opinion Letter regarding ${i.issue}. State assumptions made, analysis performed, and the final expert legal opinion.`,
  },
  {
    id: 'lp_proxy_statement',
    name: 'Proxy Statement',
    description: 'Document for shareholder voting by proxy.',
    icon: 'UserPlus',
    category: 'LP',
    inputs: [{ key: 'meeting_date', label: 'Meeting Date', placeholder: 'May 20th', type: 'text' }],
    promptTemplate: i =>
      `Draft a Proxy Statement for the annual meeting on ${i.meeting_date}. Include information on board nominees and executive compensation.`,
  },
]
