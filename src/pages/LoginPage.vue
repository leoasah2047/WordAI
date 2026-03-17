<template>
  <div class="login-page">
    <div class="login-card glass-modal">
      <div class="login-header">
        <div class="logo-container">
          <MessageSquare :size="48" class="logo-icon" />
        </div>
        <h1>Word AI</h1>
        <p>Unlock the power of intelligent writing</p>
      </div>

      <div class="login-actions">
        <button class="auth-btn microsoft" @click="handleLogin('microsoft')">
          <div class="icon-bg">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23 23" width="20" height="20">
              <path fill="#f3f3f3" d="M0 0h23v23H0z" />
              <path fill="#f35325" d="M1 1h10v10H1z" />
              <path fill="#81bc06" d="M12 1h10v10H12z" />
              <path fill="#05a6f0" d="M1 12h10v10H1z" />
              <path fill="#ffba08" d="M12 12h10v10H12z" />
            </svg>
          </div>
          <span>Continue with Microsoft</span>
        </button>

        <button class="auth-btn google" @click="handleLogin('google')">
          <div class="icon-bg">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20" height="20">
              <path
                fill="#FFC107"
                d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
              />
              <path
                fill="#FF3D00"
                d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
              />
              <path
                fill="#4CAF50"
                d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
              />
              <path
                fill="#1976D2"
                d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
              />
            </svg>
          </div>
          <span>Continue with Google</span>
        </button>
      </div>

      <div class="login-footer">
        <p>Protected by Word AI Secure Identity</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { MessageSquare } from 'lucide-vue-next'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { initiateOAuth } from '@/api/auth'
import { useAuthStore } from '@/stores/AuthStore'

const router = useRouter()
const { login } = useAuthStore()
const isAuthenticating = ref(false)

async function handleLogin(provider: 'google' | 'microsoft') {
  if (isAuthenticating.value) return
  isAuthenticating.value = true

  try {
    const userData = await initiateOAuth(provider)
    if (userData) {
      login(userData)
      if (userData.requires_onboarding) {
        router.push('/')
      } else {
        router.push('/')
      }
    }
  } catch (error) {
    console.error('Login error:', error)
  } finally {
    isAuthenticating.value = false
  }
}
</script>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%);
}

.glass-modal {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
  border-radius: 24px;
  width: 100%;
  max-width: 400px;
  padding: 48px 32px;
}

.login-header {
  margin-bottom: 40px;
  text-align: center;
}

.logo-container {
  width: 80px;
  height: 80px;
  background: white;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
}

.logo-icon {
  color: #4f46e5;
}

h1 {
  font-size: 28px;
  font-weight: 800;
  color: #111827;
  margin-bottom: 8px;
}

p {
  color: #6b7280;
  font-size: 15px;
}

.login-actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.auth-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.auth-btn:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.icon-bg {
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-footer {
  margin-top: 40px;
  text-align: center;
}

.login-footer p {
  font-size: 12px;
  color: #9ca3af;
}
</style>
