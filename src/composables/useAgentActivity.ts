import { ref } from 'vue'

export interface AgentActivity {
  id: string
  name: string
  agent?: string
  args: any
  status: 'pending' | 'success' | 'error'
  timestamp: number
  duration?: number
  result?: any
  error?: string
}

const activities = ref<AgentActivity[]>([])
const isVisible = ref(false)

export function useAgentActivity() {
  const addActivity = (activity: Omit<AgentActivity, 'timestamp'>) => {
    activities.value.unshift({
      ...activity,
      timestamp: Date.now(),
    })
    // Keep only last 50 activities
    if (activities.value.length > 50) {
      activities.value.pop()
    }
  }

  const updateActivity = (id: string, updates: Partial<AgentActivity>) => {
    const index = activities.value.findIndex(a => a.id === id)
    if (index !== -1) {
      activities.value[index] = { ...activities.value[index], ...updates }
    }
  }

  const clearActivities = () => {
    activities.value = []
  }

  const toggleVisibility = () => {
    isVisible.value = !isVisible.value
  }

  return {
    activities,
    isVisible,
    addActivity,
    updateActivity,
    clearActivities,
    toggleVisibility,
  }
}
