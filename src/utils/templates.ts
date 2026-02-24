import { aaTemplates } from './templates/aa'
import { caTemplates } from './templates/ca'
import { fmaTemplates } from './templates/fma'
import { hrTemplates } from './templates/hr'
import { itTemplates } from './templates/it'
import { lpTemplates } from './templates/lp'
import { WritingTemplate } from './templates/types'

export * from './templates/types'

export const templates: WritingTemplate[] = [
  ...hrTemplates,
  ...aaTemplates,
  ...caTemplates,
  ...lpTemplates,
  ...fmaTemplates,
  ...itTemplates,
]
