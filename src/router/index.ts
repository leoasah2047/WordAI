import { createMemoryHistory, createRouter } from 'vue-router'

import MainLayout from '../layouts/MainLayout.vue'
import { useAuthStore } from '../stores/AuthStore'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../pages/LoginPage.vue'),
      meta: { public: true },
    },
    {
      path: '/auth/callback',
      name: 'AuthCallback',
      component: () => import('../pages/AuthCallback.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: MainLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'Home',
          component: () => import('../pages/HomePage.vue'),
        },
        {
          path: 'consultant',
          name: 'Consultant',
          component: () => import('../pages/ConsultantPage.vue'),
        },
        {
          path: 'edit',
          name: 'Edit',
          component: () => import('../pages/EditPage.vue'),
        },
        {
          path: 'translation',
          name: 'Translation',
          component: () => import('../pages/TranslationPage.vue'),
        },
        {
          path: 'designer',
          name: 'Designer',
          component: () => import('../pages/DesignerPage.vue'),
        },
        {
          path: 'agent',
          name: 'Agent',
          component: () => import('../pages/AgentPage.vue'),
        },
        {
          path: 'typeset',
          name: 'Typeset',
          component: () => import('../pages/TypesetPage.vue'),
        },
        {
          path: 'settings',
          name: 'Settings',
          component: () => import('../pages/SettingsPage.vue'),
        },
        {
          path: 'toolbox',
          name: 'Toolbox',
          component: () => import('../pages/ToolboxPage.vue'),
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  if (!authStore.state.initialized) {
    await authStore.init()
  }

  const isAuthenticated = !!authStore.state.user

  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'Login' })
  } else if (to.name === 'Login' && isAuthenticated) {
    next({ name: 'Home' })
  } else {
    next()
  }
})

export default router
