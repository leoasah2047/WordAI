import { WritingTemplate } from './types'

export const itTemplates: WritingTemplate[] = [
  {
    id: 'it_incident',
    name: 'Incident Report',
    description: 'Post-incident summary.',
    icon: 'AlertTriangle',
    category: 'IT',
    inputs: [
      { key: 'incident', label: 'Incident', placeholder: 'Database outage', type: 'text' },
      { key: 'root_cause', label: 'Root Cause', placeholder: 'Failed migration script', type: 'textarea' },
      { key: 'fix', label: 'Fix/Prevention', placeholder: 'Rollback, improved testing', type: 'textarea' },
    ],
    promptTemplate: i => `Write an IT Incident Report for: ${i.incident}.
    Root Cause: ${i.root_cause}.
    Resolution & Prevention: ${i.fix}.
    Structure: Summary, Timeline, Root Cause Analysis, Resolution, and Preventive Measures.`,
  },
  {
    id: 'it_system_architecture',
    name: 'Arch Design',
    description: 'High-level system architecture document.',
    icon: 'Layers',
    category: 'IT',
    inputs: [
      { key: 'system', label: 'System Name', placeholder: 'Data Lake 2.0', type: 'text' },
      { key: 'stack', label: 'Tech Stack', placeholder: 'AWS S3, Spark, Snowflake', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft a high-level System Architecture Design for ${i.system}. Tech stack: ${i.stack}. Include Components, Data Flow, and Scalability considerations.`,
  },
  {
    id: 'it_patch_management',
    name: 'Patch Plan',
    description: 'Schedule for OS/Software patching.',
    icon: 'Shield',
    category: 'IT',
    inputs: [
      { key: 'servers', label: 'Affected Servers', placeholder: 'Production Web Cluster', type: 'text' },
      { key: 'window', label: 'Maintenance Window', placeholder: 'Sunday 2 AM - 4 AM', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft a Patch Management Plan for ${i.servers}. Window: ${i.window}. Detail pre-patch backups, deployment steps, and rollback plan.`,
  },
  {
    id: 'it_dr_exercise',
    name: 'DR Exercise',
    description: 'Post-mortem of a disaster recovery drill.',
    icon: 'RefreshCw',
    category: 'IT',
    inputs: [{ key: 'drill', label: 'Drill Name/Type', placeholder: 'Restore from Cold Storage', type: 'text' }],
    promptTemplate: i =>
      `Write an After-Action Report for the ${i.drill} DR Exercise. Highlight successes, RTO/RPO achieved, and areas for improvement.`,
  },
  {
    id: 'it_itil_change',
    name: 'Change Request',
    description: 'Formal ITIL-compliant change request.',
    icon: 'Shuffle',
    category: 'IT',
    inputs: [
      { key: 'change', label: 'Proposed Change', placeholder: 'DB Version Upgrade', type: 'text' },
      { key: 'risk', label: 'Risk Level', placeholder: 'High', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft an ITIL-style Change Request for ${i.change}. Risk: ${i.risk}. Detail the implementation plan, test plan, and back-out strategy.`,
  },
  {
    id: 'it_security_audit_response',
    name: 'Security Response',
    description: 'Response to cybersecurity audit findings.',
    icon: 'ShieldCheck',
    category: 'IT',
    inputs: [
      { key: 'finding', label: 'Audit Observation', placeholder: 'Insecure S3 bucket permissions', type: 'textarea' },
    ],
    promptTemplate: i =>
      `Draft a formal Response to Security Audit regarding "${i.finding}". Detail the remediation steps taken and the updated policy.`,
  },
  {
    id: 'it_api_spec_narrative',
    name: 'API Narrative',
    description: 'Executive summary for API documentation.',
    icon: 'Code',
    category: 'IT',
    inputs: [
      { key: 'api', label: 'API Name', placeholder: 'Payments Gateway v2', type: 'text' },
      { key: 'auth', label: 'Auth Method', placeholder: 'OAuth2 / JWT', type: 'text' },
    ],
    promptTemplate: i =>
      `Write an executive overview for the ${i.api} documentation. Highlight the business value, use cases, and ${i.auth} mechanism.`,
  },
  {
    id: 'it_vendor_evaluation',
    name: 'Vendor Eval',
    description: 'Comparison of IT vendors/tools.',
    icon: 'Search',
    category: 'IT',
    inputs: [
      { key: 'vendors', label: 'Shortlisted Vendors', placeholder: 'Datadog vs New Relic', type: 'text' },
      { key: 'criteria', label: 'Top Criteria', placeholder: 'Cost, Ease of use, Integration', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft an IT Vendor Evaluation summary comparing ${i.vendors}. Score each against ${i.criteria} and provide a final recommendation.`,
  },
  {
    id: 'it_onboarding_guide',
    name: 'Dev Onboarding',
    description: 'Technical guide for new engineers.',
    icon: 'UserPlus',
    category: 'IT',
    inputs: [{ key: 'team', label: 'Engineering Team', placeholder: 'Platform / Frontend', type: 'text' }],
    promptTemplate: i =>
      `Draft a Technical Onboarding Guide for the ${i.team} team. Include local dev setup, coding standards, and PR review process.`,
  },
  {
    id: 'it_cloud_cost_optimization',
    name: 'Cloud Savings',
    description: 'Proposal for reducing cloud bills.',
    icon: 'DollarSign',
    category: 'IT',
    inputs: [
      { key: 'provider', label: 'Cloud Provider', placeholder: 'AWS / GCP / Azure', type: 'text' },
      { key: 'target', label: 'Target Savings', placeholder: '15%', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft a Cloud Cost Optimization plan for ${i.provider}. Goal: ${i.target} reduction. Suggest Reserved Instances, Spot instances, and zombie resource removal.`,
  },
  {
    id: 'it_soc2_narrative',
    name: 'SOC2 Narrative',
    description: 'Self-assessment narrative for SOC2 Type II.',
    icon: 'Award',
    category: 'IT',
    inputs: [
      { key: 'control', label: 'Control Family', placeholder: 'Logical Access / Change Management', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft the management narrative for SOC2 compliance regarding ${i.control}. Describe the systems and procedures in place during the audit period.`,
  },
  {
    id: 'it_hardware_policy',
    name: 'Laptop Policy',
    description: 'Company equipment usage policy.',
    icon: 'Laptop',
    category: 'IT',
    inputs: [
      { key: 'replacement', label: 'Replacement Cycle', placeholder: 'Every 3 years', type: 'text' },
      { key: 'repair', label: 'Repair Lead', placeholder: 'IT Support Desk', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft a Corporate Hardware Policy. Define the ${i.replacement} cycle, usage rules, and the ${i.repair} process for broken equipment.`,
  },
  {
    id: 'it_pentest_summary',
    name: 'Pentest Summary',
    description: 'Executive summary of penetration test.',
    icon: 'Zap',
    category: 'IT',
    inputs: [{ key: 'criticals', label: 'Critical Vulns Found', placeholder: '1 (SQL Injection)', type: 'text' }],
    promptTemplate: i =>
      `Write an Executive Summary of a Penetration Test. Highlight that ${i.criticals} critical vulnerabilities were found and summarize the remediation roadmap.`,
  },
  {
    id: 'it_data_retention',
    name: 'Data Retention',
    description: 'Policy for data storage and deletion.',
    icon: 'Database',
    category: 'IT',
    inputs: [
      { key: 'type', label: 'Data Type', placeholder: 'Customer logs', type: 'text' },
      { key: 'period', label: 'Retention Period', placeholder: '7 years', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft a Data Retention and Disposal Policy for ${i.type}. Set the period to ${i.period}. Define storage location and destruction methods.`,
  },
  {
    id: 'it_sla_report',
    name: 'SLA Report',
    description: 'Monthly uptime and performance summary.',
    icon: 'Activity',
    category: 'IT',
    inputs: [
      { key: 'uptime', label: 'Achieved Uptime', placeholder: '99.98%', type: 'text' },
      { key: 'breaches', label: 'Breaches', placeholder: 'None', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft a Monthly SLA Performance Report. Achieved Uptime: ${i.uptime}. Breaches: ${i.breaches}. Summarize performance against key latency targets.`,
  },
  {
    id: 'it_capacity_plan',
    name: 'Capacity Plan',
    description: 'Forecasting server/storage needs.',
    icon: 'BarChart',
    category: 'IT',
    inputs: [
      { key: 'growth', label: 'Expected Growth %', placeholder: '20% MoM', type: 'text' },
      { key: 'constraint', label: 'Key Constraint', placeholder: 'Database IOPS', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft an IT Capacity Plan based on ${i.growth} growth. Address the ${i.constraint} and propose a vertical/horizontal scaling strategy.`,
  },
  {
    id: 'it_mdm_policy',
    name: 'Mobile Device Policy',
    description: 'Rules for BYOD and company phones.',
    icon: 'Smartphone',
    category: 'IT',
    inputs: [{ key: 'solution', label: 'MDM Solution', placeholder: 'Jamf / Intune', type: 'text' }],
    promptTemplate: i =>
      `Draft a Mobile Device Management (MDM) Policy using ${i.solution}. Define security requirements (encryption, passcode) and remote wipe authority.`,
  },
  {
    id: 'it_software_inventory',
    name: 'Software Audit',
    description: 'Audit of licensed software usage.',
    icon: 'List',
    category: 'IT',
    inputs: [{ key: 'compliance_gap', label: 'License Gap', placeholder: '10 missing Adobe licenses', type: 'text' }],
    promptTemplate: i =>
      `Draft a Software License Audit summary. Identify the ${i.compliance_gap} and propose a true-up purchase or removal of software.`,
  },
  {
    id: 'it_user_access_review',
    name: 'Access Review',
    description: 'Periodic review of user permissions.',
    icon: 'UserCheck',
    category: 'IT',
    inputs: [{ key: 'system', label: 'System Audited', placeholder: 'Finance ERP', type: 'text' }],
    promptTemplate: i =>
      `Draft a User Access Review summary for ${i.system}. List revoked accounts, updated roles, and confirm all access is currently justified.`,
  },
  {
    id: 'it_helpdesk_metrics',
    name: 'Helpdesk Report',
    description: 'Weekly support ticket summary.',
    icon: 'HelpCircle',
    category: 'IT',
    inputs: [
      { key: 'total', label: 'Total Tickets', placeholder: '150', type: 'text' },
      { key: 'mttr', label: 'Mean Time to Resolve', placeholder: '4.2 hours', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft a Weekly Helpdesk Performance Report. Total Tickets: ${i.total}. MTTR: ${i.mttr}. Highlight top 3 recurring issues and planned fixes.`,
  },
  {
    id: 'it_srs',
    name: 'SRS Document',
    description: 'Software Requirement Spec.',
    icon: 'Code',
    category: 'IT',
    inputs: [
      { key: 'system', label: 'System', placeholder: 'Employee Portal', type: 'text' },
      {
        key: 'features',
        label: 'Key Features',
        placeholder: 'SSO Login, Leave Request, Payslip View',
        type: 'textarea',
      },
    ],
    promptTemplate: i => `Draft a Software Requirement Specification (SRS) summary for ${i.system}.
    Features: ${i.features}.
    Include Functional Requirements and Non-Functional Requirements (Scalability, Security).`,
  },
  {
    id: 'it_security',
    name: 'Security Policy',
    description: 'InfoSec policy document.',
    icon: 'Lock',
    category: 'IT',
    inputs: [
      { key: 'domain', label: 'Domain', placeholder: 'Password Management', type: 'text' },
      { key: 'rules', label: 'Rules', placeholder: 'Min 12 chars, MFA required, Rotate 90 days', type: 'textarea' },
    ],
    promptTemplate: i => `Write an IT Security Policy section on ${i.domain}.
    Rules: ${i.rules}.
    Use formal standard language (NIST/ISO style).`,
  },
  {
    id: 'it_manual',
    name: 'User Manual',
    description: 'Guide for end users.',
    icon: 'BookOpen',
    category: 'IT',
    inputs: [
      { key: 'tool', label: 'Tool/Software', placeholder: 'CRM Dashboard', type: 'text' },
      { key: 'task', label: 'Task to Explain', placeholder: 'How to add a new lead', type: 'text' },
    ],
    promptTemplate: i => `Draft a section of a User Manual for ${i.tool}.
    Task: ${i.task}.
    Use clear, step-by-step instructions (1., 2., 3.) and friendly language.`,
  },
  {
    id: 'it_api',
    name: 'API Docs',
    description: 'Documentation for an API endpoint.',
    icon: 'Database',
    category: 'IT',
    inputs: [
      { key: 'endpoint', label: 'Endpoint', placeholder: 'POST /users', type: 'text' },
      { key: 'desc', label: 'Description', placeholder: 'Creates a new user profile', type: 'text' },
    ],
    promptTemplate: i => `Write API Documentation for ${i.endpoint}.
    Description: ${i.desc}.
    Include: Purpose, Request Parameters, Response Format (JSON example), and Error Codes.`,
  },
  {
    id: 'it_change',
    name: 'Change Request',
    description: 'Request for infrastructure/code change.',
    icon: 'GitPullRequest',
    category: 'IT',
    inputs: [
      { key: 'change', label: 'Change Description', placeholder: 'Upgrade firewall firmware', type: 'text' },
      { key: 'risk', label: 'Risk Level', placeholder: 'Medium (Potential downtime)', type: 'text' },
    ],
    promptTemplate: i => `Draft a Change Request Form (RFC) for: ${i.change}.
    Risk: ${i.risk}.
    Include Justification, Implementation Plan, Rollback Plan, and Impact Analysis.`,
  },
  {
    id: 'it_drp',
    name: 'Disaster Recovery',
    description: 'Plan for system failure.',
    icon: 'Server',
    category: 'IT',
    inputs: [
      { key: 'system', label: 'Critical System', placeholder: 'ERP Database', type: 'text' },
      { key: 'rto', label: 'RTO/RPO', placeholder: '4 hours / 1 hour', type: 'text' },
    ],
    promptTemplate: i => `Draft a Disaster Recovery Plan summary for ${i.system}.
    Targets: ${i.rto}.
    Outline the activation triggers, recovery team roles, and restoration procedures.`,
  },
  {
    id: 'it_sla',
    name: 'SLA Definition',
    description: 'Service Level Agreement.',
    icon: 'CheckSquare',
    category: 'IT',
    inputs: [
      { key: 'service', label: 'Service', placeholder: 'Helpdesk Support', type: 'text' },
      { key: 'metrics', label: 'SLAs', placeholder: 'Response < 1hr, Resolution < 24hr', type: 'text' },
    ],
    promptTemplate: i => `Define a Service Level Agreement (SLA) for ${i.service}.
    Metrics: ${i.metrics}.
    Define severity levels (P1, P2, P3) and corresponding response times.`,
  },
  {
    id: 'it_stack',
    name: 'Tech Stack Rec',
    description: 'Proposal for technology choices.',
    icon: 'Layers',
    category: 'IT',
    inputs: [
      { key: 'project', label: 'Project', placeholder: 'E-commerce App', type: 'text' },
      { key: 'stack', label: 'Recommended Stack', placeholder: 'React, Node.js, PostgreSQL', type: 'text' },
    ],
    promptTemplate: i => `Write a Technology Stack Recommendation for ${i.project}.
    Recommendation: ${i.stack}.
    Justify the choices based on scalability, developer experience, and cost.`,
  },
  {
    id: 'it_postmortem',
    name: 'Post-Mortem',
    description: 'Analysis of completed project.',
    icon: 'Clipboard',
    category: 'IT',
    inputs: [
      { key: 'project', label: 'Project', placeholder: 'Migration to Cloud', type: 'text' },
      { key: 'outcome', label: 'Outcome', placeholder: 'Success, but 2 weeks late', type: 'textarea' },
    ],
    promptTemplate: i => `Write a Project Post-Mortem Analysis for ${i.project}.
    Outcome: ${i.outcome}.
    Include: What went well, What went wrong, and Lessons Learned for future projects.`,
  },
]
