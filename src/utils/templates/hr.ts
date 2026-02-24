import { WritingTemplate } from './types'

export const hrTemplates: WritingTemplate[] = [
  {
    id: 'hr_offer_letter',
    name: 'Offer Letter',
    description: 'Formal employment offer letter.',
    icon: 'Users',
    category: 'HR',
    inputs: [
      { key: 'candidate', label: 'Candidate Name', placeholder: 'Jane Doe', type: 'text' },
      { key: 'position', label: 'Position', placeholder: 'Senior Manager', type: 'text' },
      { key: 'salary', label: 'Salary/Compensation', placeholder: '$120,000/year + bonus', type: 'text' },
      { key: 'start_date', label: 'Start Date', placeholder: 'June 1st', type: 'text' },
    ],
    promptTemplate: i => `Write a formal job offer letter for ${i.candidate} for the position of ${i.position}.
    Compensation: ${i.salary}. Start Date: ${i.start_date}.
    Include standard sections: welcome, role summary, compensation details, benefits overview, and acceptance deadline.`,
  },
  {
    id: 'hr_termination',
    name: 'Termination Letter',
    description: 'Formal notice of termination of employment.',
    icon: 'FileWarning',
    category: 'HR',
    inputs: [
      { key: 'employee', label: 'Employee Name', placeholder: 'John Smith', type: 'text' },
      { key: 'date', label: 'Termination Date', placeholder: 'Immediate', type: 'text' },
      { key: 'reason', label: 'Reason (Optional)', placeholder: 'Performance / Restructuring', type: 'text' },
    ],
    promptTemplate: i => `Write a formal termination letter for ${i.employee} effective ${i.date}.
    Reason: ${i.reason}.
    Include sections on final pay, benefits continuation, and return of company property. Tone should be firm but professional.`,
  },
  {
    id: 'hr_verification',
    name: 'Employment Verification',
    description: 'Confirm employment dates and title.',
    icon: 'FileCheck',
    category: 'HR',
    inputs: [
      { key: 'employee', label: 'Employee Name', placeholder: 'Alice Jones', type: 'text' },
      { key: 'title', label: 'Job Title', placeholder: 'Analyst', type: 'text' },
      { key: 'dates', label: 'Employment Dates', placeholder: 'Jan 2020 - Present', type: 'text' },
    ],
    promptTemplate: i => `Write an employment verification letter for ${i.employee}.
    Title: ${i.title}. Dates: ${i.dates}.
    Keep it brief and factual, addressed to "To Whom It May Concern".`,
  },
  {
    id: 'hr_job_desc',
    name: 'Job Description',
    description: 'Create a detailed job description.',
    icon: 'ClipboardList',
    category: 'HR',
    inputs: [
      { key: 'title', label: 'Job Title', placeholder: 'Product Owner', type: 'text' },
      {
        key: 'responsibilities',
        label: 'Key Responsibilities',
        placeholder: 'Backlog management, stakeholder comms',
        type: 'textarea',
      },
      { key: 'requirements', label: 'Requirements', placeholder: '5+ years Agile, CS degree', type: 'textarea' },
    ],
    promptTemplate: i => `Write a comprehensive job description for a ${i.title}.
    Responsibilities: ${i.responsibilities}
    Requirements: ${i.requirements}
    Include sections: Company Overview, Role Summary, Responsibilities, Qualifications, and Benefits.`,
  },
  {
    id: 'hr_perf_review',
    name: 'Performance Review',
    description: 'Draft a performance evaluation summary.',
    icon: 'TrendingUp',
    category: 'HR',
    inputs: [
      { key: 'employee', label: 'Employee', placeholder: 'Mark', type: 'text' },
      { key: 'strengths', label: 'Strengths', placeholder: 'Technical skill, punctuality', type: 'textarea' },
      { key: 'areas', label: 'Areas for Improvement', placeholder: 'Communication, delegation', type: 'textarea' },
    ],
    promptTemplate: i => `Write a performance review summary for ${i.employee}.
    Strengths: ${i.strengths}.
    Improvements: ${i.areas}.
    Use a constructive, balanced tone suitable for a formal appraisal.`,
  },
  {
    id: 'hr_warning',
    name: 'Warning Letter',
    description: 'Issue a formal disciplinary warning.',
    icon: 'AlertTriangle',
    category: 'HR',
    inputs: [
      { key: 'employee', label: 'Employee', placeholder: 'Sam', type: 'text' },
      { key: 'incident', label: 'Incident/Issue', placeholder: 'Repeated lateness', type: 'textarea' },
      { key: 'action', label: 'Required Action', placeholder: 'Improve attendance immediately', type: 'text' },
    ],
    promptTemplate: i => `Write a formal disciplinary warning letter to ${i.employee} regarding ${i.incident}.
    Required Improvement: ${i.action}.
    State clearly the consequences of non-improvement.`,
  },
  {
    id: 'hr_policy',
    name: 'Policy Memo',
    description: 'Announce a new internal policy.',
    icon: 'Scroll',
    category: 'HR',
    inputs: [
      { key: 'topic', label: 'Policy Topic', placeholder: 'Remote Work', type: 'text' },
      {
        key: 'details',
        label: 'Key Details',
        placeholder: '3 days in office mandatory starting next month',
        type: 'textarea',
      },
    ],
    promptTemplate: i => `Write an internal memo announcing a new ${i.topic} policy.
    Details: ${i.details}.
    Explain the reasoning (briefly), the effective date, and compliance requirements. Tone: Professional and slightly authoritative but communal.`,
  },
  {
    id: 'hr_onboarding',
    name: 'Onboarding Email',
    description: 'Welcome email for new hires.',
    icon: 'Mail',
    category: 'HR',
    inputs: [
      { key: 'employee', label: 'New Hire Name', placeholder: 'Alex', type: 'text' },
      { key: 'day_one', label: 'Day 1 Details', placeholder: '9 AM, bring ID, ask for Sarah', type: 'text' },
    ],
    promptTemplate: i => `Write a welcoming onboarding email to ${i.employee}.
    Day 1 Instructions: ${i.day_one}.
    Express excitement and provide a brief overview of the first week's agenda.`,
  },
  {
    id: 'hr_exit',
    name: 'Exit Interview Qs',
    description: 'Questionnaire for departing employees.',
    icon: 'HelpCircle',
    category: 'HR',
    inputs: [{ key: 'role', label: 'Role Context', placeholder: 'Sales Team', type: 'text' }],
    promptTemplate: i => `Draft a list of 10 exit interview questions for a departing employee in ${i.role}.
    Focus on reasons for leaving, feedback on management, culture, and resources.`,
  },
  {
    id: 'hr_handbook',
    name: 'Handbook Section',
    description: 'Draft a specific section for employee handbook.',
    icon: 'Book',
    category: 'HR',
    inputs: [
      { key: 'topic', label: 'Topic', placeholder: 'Code of Conduct', type: 'text' },
      { key: 'points', label: 'Key Points', placeholder: 'Respect, zero tolerance for harassment', type: 'textarea' },
    ],
    promptTemplate: i => `Write a section for the Employee Handbook on ${i.topic}.
    Key Points to cover: ${i.points}.
    Use clear, legally sound (but accessible) language.`,
  },
  {
    id: 'hr_referral',
    name: 'Employee Referral',
    description: 'Refer a candidate for an open position.',
    icon: 'UserPlus',
    category: 'HR',
    inputs: [
      { key: 'referrer', label: 'Your Name', placeholder: 'Alice', type: 'text' },
      { key: 'candidate', label: 'Candidate Name', placeholder: 'Bob', type: 'text' },
      { key: 'role', label: 'Target Role', placeholder: 'DevOps Engineer', type: 'text' },
    ],
    promptTemplate: i =>
      `Write an employee referral for ${i.candidate} for the ${i.role} role, submitted by ${i.referrer}. Highlight why they are a good fit.`,
  },
  {
    id: 'hr_promotion',
    name: 'Promotion Announcement',
    description: 'Formally announce an employee promotion.',
    icon: 'TrendingUp',
    category: 'HR',
    inputs: [
      { key: 'employee', label: 'Employee Name', placeholder: 'Charlie', type: 'text' },
      { key: 'old_role', label: 'Former Role', placeholder: 'Junior dev', type: 'text' },
      { key: 'new_role', label: 'New Role', placeholder: 'Senior dev', type: 'text' },
    ],
    promptTemplate: i =>
      `Write a company-wide email announcing ${i.employee}'s promotion from ${i.old_role} to ${i.new_role}. Celebrate their achievements.`,
  },
  {
    id: 'hr_welcome_back',
    name: 'Welcome Back Letter',
    description: 'Letter for employee returning from leave.',
    icon: 'RefreshCw',
    category: 'HR',
    inputs: [
      { key: 'employee', label: 'Employee Name', placeholder: 'David', type: 'text' },
      { key: 'date', label: 'Return Date', placeholder: 'March 1st', type: 'text' },
    ],
    promptTemplate: i =>
      `Write a "Welcome Back" letter to ${i.employee} who is returning to work on ${i.date} after a period of leave. Include details about their reintegration plan.`,
  },
  {
    id: 'hr_relocation',
    name: 'Relocation Agreement',
    description: 'Outline terms for employee relocation.',
    icon: 'MapPin',
    category: 'HR',
    inputs: [
      { key: 'employee', label: 'Employee Name', placeholder: 'Eve', type: 'text' },
      { key: 'destination', label: 'Destination City', placeholder: 'New York', type: 'text' },
      { key: 'allowance', label: 'Relocation Allowance', placeholder: '$10,000', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft a relocation agreement for ${i.employee} moving to ${i.destination}. Stipulate the ${i.allowance} allowance and any specific conditions.`,
  },
  {
    id: 'hr_bonus_letter',
    name: 'Bonus Notification',
    description: 'Inform employee of a performance bonus.',
    icon: 'DollarSign',
    category: 'HR',
    inputs: [
      { key: 'employee', label: 'Employee Name', placeholder: 'Frank', type: 'text' },
      { key: 'amount', label: 'Bonus Amount', placeholder: '$5,000', type: 'text' },
      { key: 'reason', label: 'Reason/Project', placeholder: 'Project Phoenix success', type: 'text' },
    ],
    promptTemplate: i =>
      `Write a letter to ${i.employee} informing them of a ${i.amount} bonus due to ${i.reason}. Keep it professional and encouraging.`,
  },
  {
    id: 'hr_loa_approval',
    name: 'LOA Approval',
    description: 'Approve a leave of absence request.',
    icon: 'CheckCircle',
    category: 'HR',
    inputs: [
      { key: 'employee', label: 'Employee Name', placeholder: 'Grace', type: 'text' },
      { key: 'start', label: 'Start Date', placeholder: 'April 1st', type: 'text' },
      { key: 'end', label: 'End Date', placeholder: 'April 15th', type: 'text' },
    ],
    promptTemplate: i =>
      `Formally approve the leave of absence for ${i.employee} from ${i.start} to ${i.end}. Include expectations for return and handovers.`,
  },
  {
    id: 'hr_intern_offer',
    name: 'Internship Offer',
    description: 'Offer letter for an internship position.',
    icon: 'UserCheck',
    category: 'HR',
    inputs: [
      { key: 'intern', label: 'Intern Name', placeholder: 'Heidi', type: 'text' },
      { key: 'term', label: 'Term/Duration', placeholder: '3 months (Summer)', type: 'text' },
      { key: 'stipend', label: 'Stipend (Optional)', placeholder: '$2,000/month', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft an internship offer letter for ${i.intern} for a ${i.term} term. Mention the stipend: ${i.stipend} and core learning objectives.`,
  },
  {
    id: 'hr_reference_request',
    name: 'Reference Request',
    description: 'Request formal references for a candidate.',
    icon: 'HelpCircle',
    category: 'HR',
    inputs: [
      { key: 'candidate', label: 'Candidate Name', placeholder: 'Ivan', type: 'text' },
      { key: 'referee', label: 'Referee Name/Title', placeholder: 'Dr. Smith', type: 'text' },
    ],
    promptTemplate: i =>
      `Write an email to ${i.referee} requesting a professional reference for ${i.candidate} who has applied for a position at our company.`,
  },
  {
    id: 'hr_nps_survey',
    name: 'Employee eNPS',
    description: 'Invitation for Net Promoter Score survey.',
    icon: 'BarChart',
    category: 'HR',
    inputs: [{ key: 'deadline', label: 'Submission Deadline', placeholder: 'Friday at 5 PM', type: 'text' }],
    promptTemplate: i =>
      `Write an email inviting employees to participate in the anonymous Net Promoter Score (eNPS) survey. Deadline for submission: ${i.deadline}.`,
  },
  {
    id: 'hr_benefit_change',
    name: 'Benefits Update',
    description: 'Announce changes to company benefits.',
    icon: 'Shield',
    category: 'HR',
    inputs: [
      { key: 'change', label: 'Change Details', placeholder: 'New health insurance provider', type: 'textarea' },
      { key: 'effective_date', label: 'Effective Date', placeholder: 'Jan 1st next year', type: 'text' },
    ],
    promptTemplate: i =>
      `Write a memo to all staff explaining changes to company benefits: ${i.change}. These changes will take effect on ${i.effective_date}.`,
  },
  {
    id: 'hr_remote_agreement',
    name: 'Remote Work Policy',
    description: 'Formal remote work agreement.',
    icon: 'Home',
    category: 'HR',
    inputs: [
      { key: 'employee', label: 'Employee Name', placeholder: 'Judy', type: 'text' },
      { key: 'days', label: 'Remote Days/Week', placeholder: '3 days (Tue, Wed, Thu)', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft a remote work agreement for ${i.employee} specifying a ${i.days} schedule. Include equipment responsibility and communication expectations.`,
  },
  {
    id: 'hr_grievance_ack',
    name: 'Grievance Ack',
    description: 'Acknowledge receipt of a grievance.',
    icon: 'AlertCircle',
    category: 'HR',
    inputs: [
      { key: 'employee', label: 'Employee Name', placeholder: 'Kevin', type: 'text' },
      { key: 'date', label: 'Receipt Date', placeholder: 'May 10th', type: 'text' },
    ],
    promptTemplate: i =>
      `Write a letter to ${i.employee} acknowledging receipt of their formal grievance on ${i.date}. Outline the steps for investigation.`,
  },
  {
    id: 'hr_rejection_post_interview',
    name: 'Interview Rejection',
    description: 'Reject a candidate after the interview stage.',
    icon: 'UserX',
    category: 'HR',
    inputs: [
      { key: 'candidate', label: 'Candidate Name', placeholder: 'Larry', type: 'text' },
      { key: 'role', label: 'Role Applied For', placeholder: 'Marketing Manager', type: 'text' },
    ],
    promptTemplate: i =>
      `Write a polite and professional rejection email to ${i.candidate} for the ${i.role} role after their recent interview. Offer encouragement.`,
  },
  {
    id: 'hr_internal_transfer',
    name: 'Internal Transfer',
    description: 'Formally approve a department transfer.',
    icon: 'ArrowRightLeft',
    category: 'HR',
    inputs: [
      { key: 'employee', label: 'Employee Name', placeholder: 'Mallory', type: 'text' },
      { key: 'new_dept', label: 'New Department', placeholder: 'R&D', type: 'text' },
      { key: 'manager', label: 'New Manager', placeholder: 'Steve Jobs', type: 'text' },
    ],
    promptTemplate: i =>
      `Draft a letter confirming ${i.employee}'s internal transfer to the ${i.new_dept} department, reporting to ${i.manager}.`,
  },
  {
    id: 'hr_comp_philosophy',
    name: 'Comp Philosophy',
    description: 'Draft the company compensation philosophy.',
    icon: 'Wallet',
    category: 'HR',
    inputs: [
      { key: 'market_pos', label: 'Market Position', placeholder: '75th percentile', type: 'text' },
      { key: 'mix', label: 'Base/Bonus Mix', placeholder: '80/20 split', type: 'text' },
    ],
    promptTemplate: i =>
      `Write a formal Compensation Philosophy statement for a company that aims for the ${i.market_pos} of the market with a ${i.mix} compensation mix.`,
  },
  {
    id: 'hr_training_invite',
    name: 'Training Invitation',
    description: 'Invite employees to a mandatory training session.',
    icon: 'BookOpen',
    category: 'HR',
    inputs: [
      { key: 'topic', label: 'Training Topic', placeholder: 'Diversity & Inclusion', type: 'text' },
      { key: 'dateTime', label: 'Date & Time', placeholder: 'June 15th, 2 PM', type: 'text' },
    ],
    promptTemplate: i =>
      `Write an email invitation for a mandatory training on ${i.topic} scheduled for ${i.dateTime}. Explain why it is important for the team.`,
  },
  {
    id: 'hr_contractor_agreement',
    name: 'Independent Contractor',
    description: 'Agreement for non-employee services.',
    icon: 'FileSignature',
    category: 'HR',
    inputs: [
      { key: 'contractor', label: 'Contractor Name', placeholder: 'Freelance Co.', type: 'text' },
      { key: 'scope', label: 'Scope of Work', placeholder: 'App redesign', type: 'textarea' },
    ],
    promptTemplate: i =>
      `Draft an Independent Contractor Agreement between the Company and ${i.contractor}. Scope: ${i.scope}. Include intellectual property and termination clauses.`,
  },
  {
    id: 'hr_whistleblower',
    name: 'Whistleblower Policy',
    description: 'Draft internal reporting procedures.',
    icon: 'ShieldAlert',
    category: 'HR',
    inputs: [
      { key: 'channel', label: 'Reporting Channel', placeholder: 'Secure portal or ethics hotline', type: 'text' },
    ],
    promptTemplate: i =>
      `Write a Whistleblower Policy section for the employee handbook. Specify the reporting channel as ${i.channel} and guarantee non-retaliation.`,
  },
  {
    id: 'hr_payroll_error',
    name: 'Payroll Correction',
    description: 'Apology and correction for payroll delay.',
    icon: 'AlertTriangle',
    category: 'HR',
    inputs: [
      { key: 'employee', label: 'Employee Name', placeholder: 'Oscar', type: 'text' },
      { key: 'amount', label: 'Correction Amount', placeholder: '$300', type: 'text' },
    ],
    promptTemplate: i =>
      `Write a letter apologizing to ${i.employee} for a payroll error and informing them that a correction of ${i.amount} will be processed immediately.`,
  },
  {
    id: 'hr_commuter_benefits',
    name: 'Commuter Benefits',
    description: 'Announce transportation subsidies.',
    icon: 'Train',
    category: 'HR',
    inputs: [
      { key: 'subsidy', label: 'Max Subsidy', placeholder: '$150/month', type: 'text' },
      { key: 'eligibility', label: 'Eligibility', placeholder: 'Full-time employees', type: 'text' },
    ],
    promptTemplate: i =>
      `Write a memo announcing new commuter benefits with a ${i.subsidy} max subsidy for eligible ${i.eligibility}. Explain how to sign up.`,
  },
]
