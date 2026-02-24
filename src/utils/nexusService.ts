import { apiClient } from './apiClient'
import { getDocumentBodyText } from './wordApi'

export interface NexusProfile {
  domain?: string
  cognitive_style?: string
  tone?: string
  proficiency?: string
  intent?: string
}

class NexusService {
  private lastAnalysisTime: number = 0
  private activityTimer: any = null
  private readonly IDLE_INTERVAL = 20 * 60 * 1000 // 20 minutes
  private isAnalyzing: boolean = false

  constructor() {
    // We don't setup listeners here anymore, App.vue will call checkActivity
  }

  public async init() {
    console.log('[Nexus] Initializing read-ahead scan...')
    await this.triggerAnalysis()
  }

  public async onActivityDetected() {
    const now = Date.now()
    if (now - this.lastAnalysisTime >= this.IDLE_INTERVAL) {
      await this.triggerAnalysis()
    }
  }

  public async triggerAnalysis() {
    if (this.isAnalyzing) return
    this.isAnalyzing = true

    try {
      const text = await getDocumentBodyText()
      if (!text || text.length < 50) {
        console.log('[Nexus] Insufficient text for analysis.')
        return
      }

      console.log('[Nexus] Starting background persona analysis...')
      await apiClient.post('/api/v1/nexus/analyze', { text })
      this.lastAnalysisTime = Date.now()
      console.log('[Nexus] Profile updated successfully.')
    } catch (error) {
      console.error('[Nexus] Analysis failed:', error)
    } finally {
      this.isAnalyzing = false
    }
  }

  // To be called from Save/Export hooks if possible
  public async onEventTrigger() {
    console.log('[Nexus] Event trigger detected (Save/Export).')
    await this.triggerAnalysis()
  }
}

export const nexusService = new NexusService()
