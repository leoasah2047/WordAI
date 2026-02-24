<template>
  <button
    class="voice-input-btn"
    :class="{ listening: isListening }"
    :title="isListening ? t('listening') : t('voiceInput')"
    @click="toggleListening"
  >
    <Mic v-if="!isListening" :size="size" />
    <MicOff v-else :size="size" />
    <span v-if="showLabel && isListening" class="listening-label">{{ t('listening') }}</span>
  </button>
</template>

<script setup lang="ts">
import { Mic, MicOff } from 'lucide-vue-next'
import { onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { message } from '@/utils/message'

defineProps({
  size: {
    type: Number,
    default: 18,
  },
  showLabel: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'send'])

const { t } = useI18n()
const isListening = ref(false)
let recognition: any = null

onMounted(() => {
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US' // Could be dynamic based on UI language

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      emit('update:modelValue', transcript)
      // Optional: Auto-send if it's a short command?
      // emit('send')
      isListening.value = false
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error)
      isListening.value = false
      message.error(t('voiceInputError') || 'Voice input failed')
    }

    recognition.onend = () => {
      isListening.value = false
    }
  }
})

function toggleListening() {
  if (!recognition) {
    message.warning(t('voiceInputNotSupported') || 'Voice input not supported in this browser')
    return
  }

  if (isListening.value) {
    recognition.stop()
    isListening.value = false
  } else {
    recognition.start()
    isListening.value = true
  }
}

onUnmounted(() => {
  if (recognition) {
    recognition.stop()
  }
})
</script>

<style scoped>
.voice-input-btn {
  display: flex;
  align-items: center;
  border: none;
  border-radius: 50%;
  padding: 6px;
  color: var(--color-text-secondary);
  background: transparent;
  transition: all 0.2s;
  gap: 6px;
  cursor: pointer;
}

.voice-input-btn:hover {
  color: var(--color-primary);
  background: rgb(0 0 0 / 5%);
}

.voice-input-btn.listening {
  color: #ef4444; /* Red when recording */
  background: rgb(239 68 68 / 10%);
  animation: pulse 1.5s infinite;
}

.listening-label {
  font-size: 0.8rem;
  font-weight: 500;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgb(239 68 68 / 40%);
  }

  70% {
    transform: scale(1.1);
    box-shadow: 0 0 0 6px rgb(239 68 68 / 0%);
  }

  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgb(239 68 68 / 0%);
  }
}
</style>
