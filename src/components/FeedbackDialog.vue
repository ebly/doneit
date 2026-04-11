<script setup lang="ts">
import { ref } from 'vue'
import { ChatLineRound } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { checkTimeTampering } from '@/utils/timeValidator'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible'])

// ⚠️ Please replace with your email address
// First time use requires activation via email from Formsubmit.co
const RECIPIENT_EMAIL = 'eblybryan123@gmail.com'

// 防 spam 配置
const SUBMISSION_COOLDOWN = 60 * 1000 // 两次提交间隔：60 秒
const DAILY_SUBMISSION_LIMIT = 3 // 每天最多提交次数
const STORAGE_KEY_SUBMISSIONS = 'feedback_submissions'
const STORAGE_KEY_LAST_SUBMISSION = 'feedback_last_submission'

const feedbackContent = ref('')
const feedbackEmail = ref('')
const isSubmitting = ref(false)

// 检查提交限制
const checkSubmissionLimits = async () => {
  // 首先检查时间是否被篡改
  const timeCheck = await checkTimeTampering()
  if (!timeCheck.valid) {
    return {
      allowed: false,
      message: timeCheck.message
    }
  }
  
  const now = Date.now()
  
  // 检查冷却时间
  const lastSubmission = localStorage.getItem(STORAGE_KEY_LAST_SUBMISSION)
  if (lastSubmission) {
    const timeSinceLastSubmission = now - parseInt(lastSubmission)
    if (timeSinceLastSubmission < SUBMISSION_COOLDOWN) {
      const remainingSeconds = Math.ceil((SUBMISSION_COOLDOWN - timeSinceLastSubmission) / 1000)
      return {
        allowed: false,
        message: `Please wait ${remainingSeconds} seconds before submitting again`
      }
    }
  }
  
  // 检查每日限制
  const today = new Date().toDateString()
  const submissions = JSON.parse(localStorage.getItem(STORAGE_KEY_SUBMISSIONS) || '[]')
  
  // 清理过期的提交记录（只保留今天的）
  const todaySubmissions = submissions.filter(item => {
    const submissionDate = new Date(item.timestamp).toDateString()
    return submissionDate === today
  })
  
  if (todaySubmissions.length >= DAILY_SUBMISSION_LIMIT) {
    return {
      allowed: false,
      message: `You have reached the daily submission limit (${DAILY_SUBMISSION_LIMIT} submissions per day)`
    }
  }
  
  return { allowed: true }
}

// 记录提交
const recordSubmission = () => {
  const now = Date.now()
  
  // 记录上次提交时间
  localStorage.setItem(STORAGE_KEY_LAST_SUBMISSION, now.toString())
  
  // 记录今日提交
  const submissions = JSON.parse(localStorage.getItem(STORAGE_KEY_SUBMISSIONS) || '[]')
  submissions.push({
    timestamp: now,
    email: feedbackEmail.value
  })
  localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(submissions))
}

const submitFeedback = async () => {
  // 验证必填字段
  if (!feedbackContent.value.trim()) {
    ElMessage.warning('Please enter your feedback')
    return
  }
  
  // 检查提交限制（包括时间篡改检测）
  const limitCheck = await checkSubmissionLimits()
  if (!limitCheck.allowed) {
    ElMessage.warning(limitCheck.message)
    return
  }
  
  // 简单的内容验证，防止明显垃圾内容
  const content = feedbackContent.value.trim()
  if (content.length < 10) {
    ElMessage.warning('Feedback must be at least 10 characters long')
    return
  }
  
  // 检查是否包含过多链接（防 spam）
  const urlCount = (content.match(/https?:\/\/\S+/g) || []).length
  if (urlCount > 2) {
    ElMessage.warning('Feedback cannot contain more than 2 URLs')
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
      ElMessage.success('Feedback sent successfully! Thank you for your input.')
      emit('update:visible', false)
      // Clear form
      feedbackContent.value = ''
      feedbackEmail.value = ''
      // 记录提交
      recordSubmission()
    } else {
      ElMessage.error('Failed to send. Please try again later.')
    }
  } catch (error) {
    console.error('Submission failed:', error)
    ElMessage.error('Failed to send. Please try again later.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="emit('update:visible', $event)"
    title="Feedback"
    width="400px"
    :close-on-click-modal="true"
    :close-on-press-escape="true"
  >
    <el-alert 
      title="First Time Use" 
      type="info" 
      :closable="false"
      style="margin-bottom: 16px;"
    >
      <p style="margin: 0; font-size: 13px; margin-bottom: 8px;">
        On first submission, an activation email will be sent to the admin email. Please confirm activation to enable future submissions.
      </p>
      <p style="margin: 0; font-size: 12px; color: var(--warning-color);">
        <strong>Limits:</strong> Max 3 submissions per day, 60 seconds between submissions
      </p>
    </el-alert>
    <el-form label-position="top">
      <el-form-item>
        <el-input 
          v-model="feedbackContent" 
          type="textarea" 
          :rows="3" 
          placeholder="Please share your feedback with us. We value every input!" 
          maxlength="100"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="Your Email (Optional)">
        <el-input 
          v-model="feedbackEmail" 
          placeholder="So we can contact you regarding your feedback" 
          type="email"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="feedback-footer">
        <el-button @click="emit('update:visible', false)">Cancel</el-button>
        <el-button 
        type="primary" 
        @click="submitFeedback" 
        :loading="isSubmitting"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? 'Sending...' : 'Send' }}
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
