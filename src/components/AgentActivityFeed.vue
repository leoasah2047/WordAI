<template>
  <Transition name="slide">
    <div v-if="isVisible" class="activity-feed">
      <div class="feed-header">
        <h3 class="feed-title">Agent Activity</h3>
        <button class="close-btn" @click="toggleVisibility">
          <X :size="18" />
        </button>
      </div>

      <div class="feed-content">
        <div v-if="activities.length === 0" class="empty-feed">
          <div class="empty-icon">
            <Activity :size="48" />
          </div>
          <p>No recent activity</p>
          <span class="empty-desc">Agent actions will appear here in real-time.</span>
        </div>

        <div v-else class="activity-list">
          <div v-for="activity in activities" :key="activity.id" class="activity-item" :class="activity.status">
            <div class="activity-icon-container">
              <div class="activity-line"></div>
              <div class="activity-icon">
                <Loader2 v-if="activity.status === 'pending'" class="spinning" :size="14" />
                <CheckCircle v-else-if="activity.status === 'success'" :size="14" />
                <AlertCircle v-else :size="14" />
              </div>
            </div>

            <div class="activity-details">
              <div class="activity-top">
                <div class="activity-name-group">
                  <span v-if="activity.agent" class="activity-agent">{{ activity.agent }}</span>
                  <span class="activity-name">{{ formatToolName(activity.name) }}</span>
                </div>
                <span class="activity-time">{{ formatTime(activity.timestamp) }}</span>
              </div>

              <div v-if="activity.args && Object.keys(activity.args).length > 0" class="activity-args">
                <pre>{{ formatArgs(activity.args) }}</pre>
              </div>

              <div v-if="activity.result" class="activity-result">
                <div class="result-label">Output:</div>
                <div class="result-text">{{ activity.result }}</div>
              </div>

              <div class="activity-status-text">
                <span v-if="activity.status === 'pending'">
                  <div class="pending-group">
                    <Loader2 class="spinning" :size="12" />
                    <span>{{ activity.agent ? `${activity.agent} working...` : 'Agent working...' }}</span>
                  </div>
                </span>
                <span v-else-if="activity.status === 'success'" class="success-text">
                  Completed in {{ activity.duration || 0 }}ms
                </span>
                <span v-else class="error-text">Failed: {{ activity.error }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="feed-footer">
        <button class="clear-btn" :disabled="activities.length === 0" @click="clearActivities">Clear History</button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { Activity, AlertCircle, CheckCircle, Loader2, X } from 'lucide-vue-next'

import { useAgentActivity } from '@/composables/useAgentActivity'

const { activities, isVisible, toggleVisibility, clearActivities } = useAgentActivity()

function formatToolName(name: string) {
  return name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
}

function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat('default', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(timestamp))
}

function formatArgs(args: any) {
  if (typeof args === 'string') return args
  try {
    return JSON.stringify(args, null, 2)
  } catch (_e) {
    return String(args)
  }
}
</script>

<style scoped>
.activity-feed {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  border-left: 1px solid var(--color-border);
  width: 320px;
  height: 100vh;
  background: var(--color-bg-secondary);
  background: rgb(255 255 255 / 85%);
  box-shadow: -4px 0 20px rgb(0 0 0 / 10%);
  flex-direction: column;
  backdrop-filter: blur(12px);
}

.dark .activity-feed {
  background: rgb(30 30 30 / 85%);
}

.feed-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--color-border);
  padding: 16px;
}

.feed-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.close-btn {
  display: flex;
  border: none;
  border-radius: 4px;
  padding: 4px;
  color: var(--color-text-secondary);
  background: none;
  transition: background 0.2s;
  cursor: pointer;
}

.close-btn:hover {
  background: var(--color-bg-hover);
}

.feed-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.empty-feed {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  text-align: center;
  color: var(--color-text-secondary);
  flex-direction: column;
}

.empty-icon {
  margin-bottom: 16px;
  opacity: 0.3;
}

.empty-desc {
  margin-top: 8px;
  font-size: 12px;
}

.activity-list {
  display: flex;
  flex-direction: column;
}

.activity-item {
  position: relative;
  display: flex;
  margin-bottom: 20px;
  gap: 12px;
}

.activity-icon-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.activity-line {
  position: absolute;
  top: 24px;
  bottom: -20px;
  left: 7px;
  width: 1px;
  background: var(--color-border);
}

.activity-item:last-child .activity-line {
  display: none;
}

.activity-icon {
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  color: var(--color-text-secondary);
  background: var(--color-bg-secondary);
}

.activity-item.pending .activity-icon {
  color: var(--color-primary);
  animation: pulse 2s infinite;
}

.activity-item.success .activity-icon {
  color: #10b981;
  animation: success-pop 0.5s ease-out;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }

  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }

  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes success-pop {
  0% {
    transform: scale(0.6);
    opacity: 0;
  }

  50% {
    transform: scale(1.2);
  }

  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.activity-item.error .activity-icon {
  color: #ef4444;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.activity-details {
  flex: 1;
  min-width: 0;
}

.activity-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.activity-name-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.activity-agent {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-primary);
  letter-spacing: 0.5px;
}

.activity-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.activity-time {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.activity-args {
  overflow-y: auto;
  margin-bottom: 6px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 8px;
  max-height: 100px;
  font-size: 11px;
  font-family: monospace;
  background: var(--color-bg-primary);
}

.activity-args pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.activity-status-text {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.pending-group {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--color-primary);
}

.activity-result {
  margin-bottom: 8px;
  border-left: 2px solid var(--color-primary);
  padding: 8px;
  font-size: 12px;
  line-height: 1.5;
  background: rgba(var(--color-primary-rgb), 0.05);
}

.result-label {
  margin-bottom: 4px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-primary);
  opacity: 0.8;
}

.result-text {
  color: var(--color-text-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

.success-text {
  color: #059669;
}

.error-text {
  color: #dc2626;
}

.feed-footer {
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid var(--color-border);
  padding: 12px 16px;
}

.clear-btn {
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 12px;
  color: var(--color-text-secondary);
  background: none;
  cursor: pointer;
}

.clear-btn:hover:not(:disabled) {
  color: var(--color-text-primary);
  background: var(--color-bg-hover);
}

.clear-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
