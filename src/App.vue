<template>
  <div id="app">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>

    <!-- Global Onboarding Modal -->
    <OnboardingModal v-if="showOnboarding" :visible="showOnboarding" @completed="handleOnboardingCompleted" />
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue'

import OnboardingModal from '@/components/auth/OnboardingModal.vue'
import { useAuthStore } from '@/stores/AuthStore'
import { nexusService } from '@/utils/nexusService'

const { state, init: initAuth } = useAuthStore()

onMounted(async () => {
  await initAuth()

  if (state.user) {
    await nexusService.init()

    // Setup activity tracking
    if (typeof Office !== 'undefined' && Office.context && Office.context.document) {
      Office.context.document.addHandlerAsync(Office.EventType.DocumentSelectionChanged, () =>
        nexusService.onActivityDetected(),
      )
    }
  }
})

const showOnboarding = computed(() => {
  return !!state.user && !state.user.onboarded
})

function handleOnboardingCompleted() {
  console.log('Onboarding complete!')
  nexusService.init() // Trigger first scan after onboarding
}
</script>

<style>
#app {
  font-family: 'Segoe UI', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
