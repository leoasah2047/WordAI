<template>
  <div class="main-layout">
    <aside
      class="sidebar"
      :class="{ expanded: isExpanded }"
      @mouseenter="isExpanded = true"
      @mouseleave="isExpanded = false"
    >
      <div class="sidebar-top">
        <div class="logo">
          <Sparkles :size="20" class="logo-icon" />
          <span v-if="isExpanded" class="logo-text">Word AI</span>
        </div>

        <nav class="nav-links">
          <router-link to="/" class="nav-item" active-class="active" :title="$t('chat')">
            <MessageSquare :size="20" />
            <span v-if="isExpanded">{{ $t('chat') }}</span>
          </router-link>

          <router-link to="/consultant" class="nav-item" active-class="active" :title="$t('consultantMode')">
            <Briefcase :size="20" />
            <span v-if="isExpanded">{{ $t('consultantMode') }}</span>
          </router-link>

          <router-link to="/edit" class="nav-item" active-class="active" :title="$t('editMode')">
            <PenTool :size="20" />
            <span v-if="isExpanded">{{ $t('editMode') }}</span>
          </router-link>

          <router-link to="/translation" class="nav-item" active-class="active" :title="$t('translationMode')">
            <Globe :size="20" />
            <span v-if="isExpanded">{{ $t('translationMode') }}</span>
          </router-link>

          <router-link to="/designer" class="nav-item" active-class="active" :title="$t('designerMode')">
            <Palette :size="20" />
            <span v-if="isExpanded">{{ $t('designerMode') }}</span>
          </router-link>

          <router-link to="/agent" class="nav-item" active-class="active" :title="$t('agentMode')">
            <Bot :size="20" />
            <span v-if="isExpanded">{{ $t('agentMode') }}</span>
          </router-link>

          <router-link to="/typeset" class="nav-item" active-class="active" :title="$t('aiTypeset')">
            <BookOpen :size="20" />
            <span v-if="isExpanded">{{ $t('aiTypeset') }}</span>
          </router-link>

          <router-link to="/toolbox" class="nav-item" active-class="active" :title="$t('toolbox')">
            <Wrench :size="20" />
            <span v-if="isExpanded">{{ $t('toolbox') }}</span>
          </router-link>
        </nav>
      </div>

      <div class="sidebar-bottom">
        <router-link to="/settings" class="nav-item" active-class="active" :title="$t('settings')">
          <Settings :size="20" />
          <span v-if="isExpanded">{{ $t('settings') }}</span>
        </router-link>
      </div>
    </aside>

    <div class="main-wrapper">
      <header class="top-header">
        <div class="header-left">
          <span class="current-page-name">{{ $t(currentPageName) }}</span>
        </div>
        <div class="header-right">
          <button class="global-new-chat-btn" :title="$t('startNewChat')" @click="handleGlobalNewChat">
            <Plus :size="18" />
          </button>
        </div>
      </header>

      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  BookOpen,
  Bot,
  Briefcase,
  Globe,
  MessageSquare,
  Palette,
  PenTool,
  Plus,
  Settings,
  Sparkles,
  Wrench,
} from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const isExpanded = ref(false)
const route = useRoute()
const router = useRouter()

const currentPageName = computed(() => {
  const name = route.name as string
  return name || 'chat'
})

function handleGlobalNewChat() {
  if (route.path !== '/') {
    router.push('/')
  }
  // Dispatch a global event to reset chat state in HomePage.vue
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('start-new-chat'))
  }, 100)
}
</script>

<style scoped>
.main-layout {
  display: flex;
  width: 100vw;
  height: 100vh;
  background-color: var(--color-background);
}

.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.top-header {
  z-index: 900;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--color-border);
  padding: 0 16px;
  height: var(--header-height, 48px);
  background-color: var(--color-bg-primary);
  backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
}

.current-page-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.global-new-chat-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  color: var(--color-primary);
  background: var(--color-primary-light);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.global-new-chat-btn:hover {
  color: white;
  background: var(--color-primary);
  transform: rotate(90deg) scale(1.1);
}

.sidebar {
  z-index: 1000;
  display: flex;
  justify-content: space-between;
  border-right: 1px solid var(--color-border);
  padding: 12px 0;
  width: var(--sidebar-width-collapsed);
  background-color: var(--color-secondary-background);
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar.expanded {
  width: var(--sidebar-width-expanded);
}

.sidebar-top {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.logo {
  display: flex;
  align-items: center;
  overflow: hidden;
  padding: 0 20px;
  height: 40px;
  color: var(--color-secondary);
}

.logo-icon {
  flex-shrink: 0;
}

.logo-text {
  margin-left: 12px;
  font-size: 1.1rem;
  font-weight: 700;
  white-space: nowrap;
  animation: fade-in 0.2s ease;
}

.nav-links {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  overflow: hidden;
  border-radius: 8px;
  padding: 10px 12px;
  text-decoration: none;
  color: var(--color-text-secondary);
  transition: all 0.2s ease;
}

.nav-item span {
  margin-left: 12px;
  font-size: 0.9rem;
  font-weight: 500;
  white-space: nowrap;
  animation: fade-in 0.2s ease;
}

.nav-item:hover {
  color: var(--color-primary);
  background-color: rgb(9 105 218 / 10%);
}

.nav-item.active {
  color: var(--color-primary);
  background-color: var(--color-primary-light);
}

.sidebar-bottom {
  padding: 0 8px;
}

.content {
  position: relative;
  overflow: hidden;
  flex: 1;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
