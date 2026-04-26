<script setup>
import { ref, watch } from 'vue'
import { ChatLineRound } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { checkTimeTampering } from '@/utils/timeValidator'
import { useI18n, registerLocale } from '../utils/i18n.js'
import { useSettings } from '../composables/useSettings.js'
import en from '../locales/en.js'
import zh from '../locales/zh.js'

registerLocale('en', en)
registerLocale('zh', zh)

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible'])

const { language } = useSettings()
const { t, currentLang } = useI18n()

watch(() => language.value, (newVal) => {
  currentLang.value = newVal
}, { immediate: true })

const RECIPIENT_EMAIL = import.meta.env.VITE_FEEDBACK_EMAIL || 'eblybryan123@gmail.com'

const SUBMISSION_COOLDOWN = 60 * 1000
const DAILY_SUBMISSION_LIMIT = 3
const STORAGE_KEY_SUBMISSIONS = 'feedback_submissions'
const STORAGE_KEY_LAST_SUBMISSION = 'feedback_last_submission'

const feedbackContent = ref('')
const feedbackEmail = ref('')
const isSubmitting = ref(false)

const checkSubmissionLimits = async () => {
  const timeCheck = await checkTimeTampering()
  if (!timeCheck.valid) {
    return {
      allowed: false,
      message: timeCheck.message
    }
  }
  
  const now = Date.now()
  
  const lastSubmission = localStorage.getItem(STORAGE_KEY_LAST_SUBMISSION)
  if (lastSubmission) {
    const timeSinceLastSubmission = now - parseInt(lastSubmission)
    if (timeSinceLastSubmission < SUBMISSION_COOLDOWN) {
      const remainingSeconds = Math.ceil((SUBMISSION_COOLDOWN - timeSinceLastSubmission) / 1000)
      return {
        allowed: false,
        message: t.value('feedback.waitSeconds').replace('{seconds}', remainingSeconds)
      }
    }
  }
  
  const today = new Date().toDateString()
  const submissions = JSON.parse(localStorage.getItem(STORAGE_KEY_SUBMISSIONS) || '[]')
  
  const todaySubmissions = submissions.filter(item => {
    const submissionDate = new Date(item.timestamp).toDateString()
    return submissionDate === today
  })
  
  if (todaySubmissions.length >= DAILY_SUBMISSION_LIMIT) {
    return {
      allowed: false,
      message: t.value('feedback.dailyLimit').replace('{limit}', DAILY_SUBMISSION_LIMIT)
    }
  }
  
  return { allowed: true }
}

const recordSubmission = () => {
  const now = Date.now()
  
  localStorage.setItem(STORAGE_KEY_LAST_SUBMISSION, now.toString())
  
  const submissions = JSON.parse(localStorage.getItem(STORAGE_KEY_SUBMISSIONS) || '[]')
  submissions.push({
    timestamp: now,
    email: feedbackEmail.value
  })
  localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(submissions))
}

const submitFeedback = async () => {
  if (!feedbackContent.value.trim()) {
    ElMessage.warning(t.value('feedback.enterFeedback'))
    return
  }
  
  const limitCheck = await checkSubmissionLimits()
  if (!limitCheck.allowed) {
    ElMessage.warning(limitCheck.message)
    return
  }
  
  const content = feedbackContent.value.trim()
  if (content.length < 10) {
    ElMessage.warning(t.value('feedback.minLength'))
    return
  }
  
  const urlCount = (content.match(/https?:\/\/\S+/g) || []).length
  if (urlCount > 2) {
    ElMessage.warning(t.value('feedback.tooManyUrls'))
    return
  }

  isSubmitting.value = true

  try {
    const formData = {
      subject: '【Feedback】New Message',
      message: content,
      replyto: feedbackEmail.value.trim() || 'no-reply@example.com'
    }

    const response = await fetch(`https://formsubmit.co/ajax/${RECIPIENT_EMAIL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    })

    const result = await response.json()

    if (result.success) {
      ElMessage.success(t.value('feedback.success'))
      emit('update:visible', false)
      feedbackContent.value = ''
      feedbackEmail.value = ''
      recordSubmission()
    } else {
      ElMessage.error(t.value('feedback.failed'))
    }
  } catch (error) {
    console.error('Submission failed:', error)
    ElMessage.error(t.value('feedback.failed'))
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="emit('update:visible', $event)"
    :title="t('feedback.title')"
    width="400px"
    :close-on-click-modal="true"
    :close-on-press-escape="true"
  >
    <el-alert 
      :title="t('feedback.firstTimeTitle')" 
      type="info" 
      :closable="false"
      style="margin-bottom: 16px;"
    >
      <p style="margin: 0; font-size: 13px; margin-bottom: 8px;">
        {{ t('feedback.firstTimeDesc') }}
      </p>
      <p style="margin: 0; font-size: 12px; color: var(--warning-color);">
        <strong>{{ t('feedback.limits') }}</strong>
      </p>
    </el-alert>
    <el-form label-position="top">
      <el-form-item>
        <el-input 
          v-model="feedbackContent" 
          type="textarea" 
          :rows="3" 
          :placeholder="t('feedback.placeholder')" 
          maxlength="100"
          show-word-limit
        />
      </el-form-item>
      <el-form-item :label="t('feedback.emailLabel')">
        <el-input 
          v-model="feedbackEmail" 
          :placeholder="t('feedback.emailPlaceholder')" 
          type="email"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="feedback-footer">
        <el-button @click="emit('update:visible', false)">{{ t('common.cancel') }}</el-button>
        <el-button 
        type="primary" 
        @click="submitFeedback" 
        :loading="isSubmitting"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? t('feedback.sending') : t('feedback.send') }}
      </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.feedback-footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.feedback-footer .el-button {
  flex: 1;
}
</style>
