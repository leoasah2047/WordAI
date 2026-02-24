<template>
  <div class="callback-page">
    <div class="loader-container">
      <div class="loader"></div>
      <p>Authenticating with Word AI...</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { handleAuthCallback } from '@/api/auth'
import { useAuthStore } from '@/stores/AuthStore'

const route = useRoute()
const router = useRouter()
const { login } = useAuthStore()

onMounted(async () => {
  const code = route.query.code as string
  const state = route.query.state as string

  if (!code || !state) {
    router.push('/login')
    return
  }

  try {
    const userData = await handleAuthCallback(code, state)
    login(userData)

    if (userData.requires_onboarding) {
      router.push('/') // The modal will show on Home
    } else {
      router.push('/')
    }
  } catch (error) {
    console.error('Authentication failed:', error)
    router.push('/login?error=auth_failed')
  }
})
</script>

<style scoped>
.callback-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
}

.loader-container {
  text-align: center;
}

.loader {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

p {
  color: #6b7280;
  font-size: 16px;
}
</style>
