<template>
  <div v-if="visible" class="onboarding-overlay">
    <div class="onboarding-card glass-modal animate-fade-in">
      <!-- Progress Bar -->
      <div class="progress-container">
        <div class="progress-bar" :style="{ width: `${(step / 3) * 100}%` }"></div>
      </div>

      <div class="onboarding-header">
        <Sparkles class="sparkle-icon" :size="32" />
        <h2 v-if="step === 1">{{ $t('onboardingTitle') || 'Welcome to Word AI' }}</h2>
        <h2 v-else-if="step === 2">Document Management</h2>
        <h2 v-else>AI Configuration</h2>

        <p v-if="step === 1">{{ $t('onboardingSubtitle') || 'Tell us who you are to personalize your experience.' }}</p>
        <p v-else-if="step === 2">Connect your documents for context-aware assistance.</p>
        <p v-else>Add your Gemini API Key to power the AI.</p>
      </div>

      <div class="onboarding-body">
        <!-- Step 1: Identity -->
        <div v-if="step === 1" class="step-content animate-slide-in">
          <div class="form-group">
            <label for="identity">{{ $t('onboardingLabel') || 'Who are you?' }}</label>
            <div class="select-wrapper">
              <select id="identity" v-model="form.identity" class="premium-select">
                <option value="" disabled>{{ $t('selectIdentity') || 'Select your identity...' }}</option>
                <option v-for="option in identityOptions" :key="option" :value="option">
                  {{ option }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- Step 2: DMS -->
        <div v-if="step === 2" class="step-content animate-slide-in">
          <div class="dms-options">
            <button
              class="dms-card"
              :class="{ active: form.dms_provider === 'google_drive' }"
              @click="form.dms_provider = 'google_drive'"
            >
              <div class="dms-icon google"></div>
              <span>Google Drive</span>
            </button>
            <button
              class="dms-card"
              :class="{ active: form.dms_provider === 'erpnext' }"
              @click="form.dms_provider = 'erpnext'"
            >
              <div class="dms-icon erp"></div>
              <span>ERPNext</span>
            </button>
          </div>

          <div v-if="form.dms_provider === 'google_drive'" class="dms-details">
            <p class="info-text">We'll connect to your Google Drive to read relevant documents.</p>
            <!-- In future, trigger OAuth here or on submit -->
            <button class="connect-btn" disabled>Authentication happens on save</button>
          </div>

          <div v-if="form.dms_provider === 'erpnext'" class="dms-details">
            <div class="form-group">
              <label>ERPNext API Key</label>
              <input v-model="form.dms_api_key" type="password" class="premium-input" placeholder="Enter API Key" />
            </div>
            <p class="info-text">Enter your ERPNext credentials to access generic documents.</p>
          </div>
        </div>

        <!-- Step 3: Gemini -->
        <div v-if="step === 3" class="step-content animate-slide-in">
          <div class="form-group">
            <label>Google Gemini API Key</label>
            <input
              v-model="form.gemini_api_key"
              type="password"
              class="premium-input"
              placeholder="Enter Gemini API Key"
            />
          </div>
          <p class="info-text">
            Don't have a key?
            <a href="https://aistudio.google.com/app/apikey" target="_blank" class="link"
              >Get one from Google AI Studio</a
            >
          </p>
        </div>
      </div>

      <div class="onboarding-footer">
        <button v-if="step > 1" class="secondary-btn" :disabled="loading" @click="step--">Back</button>

        <button class="premium-btn" :disabled="!canProceed || loading" @click="handleNext">
          <span v-if="loading" class="loader"></span>
          <span v-else>{{ step === 3 ? 'Get Started' : 'Continue' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Sparkles } from 'lucide-vue-next'
import { computed, reactive, ref } from 'vue'

import { updateProfile } from '@/api/auth'
import { useAuthStore } from '@/stores/AuthStore'

defineProps<{
  visible: boolean
}>()

const emit = defineEmits(['completed'])

const { setUserProfile } = useAuthStore()
const step = ref(1)
const loading = ref(false)

const form = reactive({
  identity: '',
  dms_provider: '', // 'google_drive' | 'erpnext'
  dms_api_key: '',
  gemini_api_key: '',
})

const canProceed = computed(() => {
  if (step.value === 1) return !!form.identity
  if (step.value === 2) {
    if (!form.dms_provider) return false // Must select one
    if (form.dms_provider === 'erpnext' && !form.dms_api_key) return false
    return true
  }
  if (step.value === 3) return !!form.gemini_api_key
  return false
})

const identityOptions = [
  'Professional Writer',
  'Student',
  'Academic Researcher',
  'Business Executive',
  'Legal Professional',
  'General Creative',
  'Grant Writer',
  'Technical Illustrator',
  'Bylaw Auditor',
  'Corporate Controller',
  'HR Generalist',
  'IT Support Specialist',
  'Medical Researcher',
  'Financial Analyst',
  'Marketing Strategist',
  'Social Media Manager',
  'UX Designer',
  'Software Engineer',
  'Data Scientist',
  'Project Manager',
  'Risk Consultant',
  'Compliance Officer',
  'Tax Accountant',
  'External Auditor',
  'Internal Auditor',
  'Public Relations Specialist',
  'Content Strategist',
  'Brand Ambassador',
  'Operations Manager',
  'Supply Chain Planner',
  'Logistics Coordinator',
  'Procurement Officer',
  'Sales Executive',
  'Account Manager',
  'Customer Success Lead',
  'Technical Writer',
  'Copywriter',
  'Editor',
  'Proofreader',
  'Ghostwriter',
  'Scriptwriter',
  'Journalist',
  'Blogger',
  'SEO Specialist',
  'E-commerce Manager',
  'Digital Nomad',
  'Entrepreneur',
  'Small Business Owner',
  'Startup Founder',
  'VC Partner',
  'Investment Banker',
  'Hedge Fund Manager',
  'Private Equity Analyst',
  'Actuary',
  'Insurance Broker',
  'Real Estate Agent',
  'Property Manager',
  'Architect',
  'Civil Engineer',
  'Mechanical Engineer',
  'Electrical Engineer',
  'Environmental Scientist',
  'Sustainability Consultant',
  'Policy Analyst',
  'Government Officer',
  'Diplomat',
  'Non-Profit Director',
  'Fundraising Coordinator',
  'Volunteer Manager',
  'Teacher',
  'Professor',
  'Education Administrator',
  'Librarian',
  'Curator',
  'Museum Educator',
  'Artist',
  'Musician',
  'Photographer',
  'Videographer',
  'Animator',
  'Game Designer',
  'Interior Designer',
  'Fashion Designer',
  'Chef',
  'Restaurant Manager',
  'Event Planner',
  'Travel Agent',
  'Pilot',
  'Air Traffic Controller',
  'Doctor',
  'Nurse',
  'Pharmacist',
  'Physical Therapist',
  'Psychologist',
  'Social Worker',
  'Legal Secretary',
  'Paralegal',
  'Judge',
  'Clerk of Court',
  'Detective',
  'Police Officer',
  'Security Consultant',
  'Cybersecurity Analyst',
]

async function handleNext() {
  if (step.value < 3) {
    step.value++
  } else {
    await handleSubmit()
  }
}

async function handleSubmit() {
  loading.value = true
  try {
    await updateProfile({
      identity: form.identity,
      dms_provider: form.dms_provider,
      dms_api_key: form.dms_api_key,
      gemini_api_key: form.gemini_api_key,
    })

    // Update local store
    setUserProfile({
      identity: form.identity,
      dms_provider: form.dms_provider,
      dms_api_key: form.dms_api_key,
      gemini_api_key: form.gemini_api_key,
    })

    emit('completed')
  } catch (error) {
    console.error('Onboarding failed:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.onboarding-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.glass-modal {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border-radius: 24px;
  width: 100%;
  max-width: 480px;
  padding: 40px;
  text-align: center;
  overflow: hidden;
  position: relative;
}

.progress-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: #f3f4f6;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #4f46e5);
  transition: width 0.3s ease;
}

.onboarding-header {
  margin-bottom: 32px;
}

.sparkle-icon {
  color: #6366f1;
  margin-bottom: 16px;
  animation: pulse 2s infinite;
}

h2 {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
}

p {
  color: #6b7280;
  font-size: 15px;
}

.onboarding-body {
  margin-bottom: 32px;
  text-align: left;
  min-height: 200px; /* Prevent layout jump */
}

.form-group {
  margin-bottom: 16px;
}

label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.select-wrapper {
  position: relative;
}

.premium-select,
.premium-input {
  width: 100%;
  padding: 12px 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-size: 16px;
  color: #1f2937;
  transition: all 0.2s;
}

.premium-input:focus,
.premium-select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.dms-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.dms-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.dms-card:hover {
  border-color: #a5b4fc;
}

.dms-card.active {
  border-color: #6366f1;
  background: #eef2ff;
}

.dms-icon {
  width: 40px;
  height: 40px;
  margin-bottom: 12px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.dms-icon.google {
  background-image: url('https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg');
}

.dms-icon.erp {
  background-color: #3b82f6; /* Placeholder for ERP Icon */
  border-radius: 8px;
}

.info-text {
  font-size: 13px;
  color: #6b7280;
  margin-top: 8px;
}

.link {
  color: #6366f1;
  text-decoration: underline;
}

.onboarding-footer {
  display: flex;
  gap: 12px;
}

.premium-btn {
  flex: 1;
  padding: 14px;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.premium-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.4);
}

.premium-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.secondary-btn {
  padding: 14px 24px;
  background: white;
  color: #4b5563;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.secondary-btn:hover {
  background: #f9fafb;
}

.loader {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

.animate-fade-in {
  animation: fade-in 0.4s ease-out;
}

.animate-slide-in {
  animation: slide-in 0.3s ease-out;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateX(10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
