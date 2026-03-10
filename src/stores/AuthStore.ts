import { reactive, readonly } from 'vue'

import { getMe, logout as logoutApi } from '@/api/auth'
import useSettingForm from '@/utils/settingForm'

interface User {
  email: string
  id: number
  onboarded: boolean
  profile?: {
    identity: string
    default_context: any
    nexus_profile?: any
    dms_provider?: string
    dms_api_key?: string
    gemini_api_key?: string
  }
}

interface AuthState {
  user: User | null
  loading: boolean
  initialized: boolean
}

export const state = reactive<AuthState>({
  user: null,
  loading: false,
  initialized: false,
})

export function useAuthStore() {
  const init = async () => {
    if (state.initialized) return
    state.loading = true
    try {
      state.user = await getMe()
    } catch (error) {
      console.error('Failed to initialize auth:', error)
      state.user = null
    } finally {
      state.loading = false
      state.initialized = true
    }
  }

  const login = (userData: any) => {
    if (userData && userData.user) {
      state.user = userData.user
      state.user!.onboarded = !userData.requires_onboarding
    }
    state.initialized = true
  }

  const logout = async () => {
    await logoutApi()
    state.user = null
  }

  const setUserProfile = (updates: string | Partial<User['profile']>) => {
    if (state.user) {
      state.user.onboarded = true
      const newProfile = typeof updates === 'string' ? { identity: updates } : updates
      const currentProfile = state.user.profile || { identity: 'Consultant', default_context: {} }
      const currentIdentity = currentProfile.identity || 'Consultant'

      const mergedProfile = {
        ...currentProfile,
        ...newProfile,
        default_context: currentProfile.default_context || {},
      }

      // Ensure identity is present
      if (!mergedProfile.identity) {
        mergedProfile.identity = currentIdentity
      }

      state.user.profile = mergedProfile as User['profile']

      const settingForm = useSettingForm()

      // Sync credentials to localStorage for client-side usage
      if (mergedProfile.gemini_api_key) {
        localStorage.setItem('geminiAPIKey', mergedProfile.gemini_api_key)
        settingForm.value.geminiAPIKey = mergedProfile.gemini_api_key
      } else {
        localStorage.removeItem('geminiAPIKey')
        settingForm.value.geminiAPIKey = ''
      }

      if (mergedProfile.dms_provider === 'erpnext' && mergedProfile.dms_api_key) {
        localStorage.setItem('erpnextApiKey', mergedProfile.dms_api_key)
        settingForm.value.erpnextApiKey = mergedProfile.dms_api_key
        // We might want to clear or mock secret if it's a combined token or handled differently
        // For now, mapping dms_api_key -> erpnextApiKey
      } else {
        localStorage.removeItem('erpnextApiKey')
        settingForm.value.erpnextApiKey = ''
      }
    }
  }

  const getUserIdentity = () => {
    return state.user?.profile?.identity || 'Consultant'
  }

  return {
    state: readonly(state),
    init,
    login,
    logout,
    setUserProfile,
    getUserIdentity,
  }
}
