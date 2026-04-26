<script setup>
import { ref, watch, onMounted } from 'vue'
import { useSettings } from '../composables/useSettings.js'
import { UserFilled, ChatLineRound } from '@element-plus/icons-vue'
import FeedbackDialog from './FeedbackDialog.vue'
import { getReminderNotificationSettings, updateReminderNotificationSettings } from '../services/storage'
import { useI18n, registerLocale } from '../utils/i18n.js'
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

const { username, avatar, setUsername, setAvatar } = useSettings()
const { t } = useI18n()

const tempUsername = ref('')
const fileInput = ref(null)
const showFeedbackDialog = ref(false)
const reminderEnabled = ref(true)

watch(() => props.visible, (newVal) => {
  if (newVal) {
    tempUsername.value = username.value
  }
})

onMounted(async () => {
  const enabled = await getReminderNotificationSettings()
  reminderEnabled.value = enabled
})

const handleClose = () => {
  emit('update:visible', false)
}

const saveUsername = () => {
  const trimmed = tempUsername.value.trim()
  if (trimmed.length > 10) {
    alert(t.value('settings.usernameExceed'))
    return
  }
  setUsername(trimmed)
  emit('update:visible', false)
}

const handleAvatarClick = () => {
  fileInput.value.click()
}

const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      setAvatar(e.target.result)
    }
    reader.readAsDataURL(file)
  }
  event.target.value = ''
}

const handleReminderToggle = async (enabled) => {
  await updateReminderNotificationSettings(enabled)
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="emit('update:visible', $event)"
    :title="t('settings.title')"
    :close-on-click-modal="true"
    :close-on-press-escape="true"
    :show-close="true"
    :modal="false"
    class="settings-dialog"

  >
    <!-- Profile Section -->
    <div class="profile-section">
      <el-avatar 
        :size="64" 
        :icon="!avatar ? UserFilled : undefined"
        :src="avatar"
        class="profile-avatar"
        @click="handleAvatarClick"
      >
      </el-avatar>
      <input 
        ref="fileInput" 
        type="file" 
        accept="image/*" 
        style="display: none;" 
        @change="handleFileChange"
      />
      <div class="profile-info">
        <div class="welcome-text">
          <span style="color: gray;">{{ t('settings.welcome') }}</span> 
          <span class="username">{{ username || t('settings.stranger') }}</span>
        </div>
        <div class="edit-hint">{{ t('settings.clickAvatar') }}</div>
      </div>
    </div>
    
    <!-- Settings Form Section -->
    <div class="settings-section">
      <div class="form-item">
        <el-input 
          v-model="tempUsername" 
          :placeholder="t('settings.enterName')" 
          maxlength="10" 
          @keyup.enter="saveUsername"
          clearable
        />
      </div>
      
      <div class="form-item">
        <div class="form-label">
          <span>{{ t('settings.notification') }}</span>
        </div>
        <el-switch
          v-model="reminderEnabled"
          @change="handleReminderToggle"
          class="reminder-switch"
        />
      </div>
    </div>
    
    <!-- Action Buttons Section -->
    <div class="action-section">
      <el-button 
        type="info" 
        @click="showFeedbackDialog = true" 
        :icon="ChatLineRound" 
        class="feedback-button"
      >
        {{ t('settings.feedback') }}
      </el-button>
      
      <el-button 
        type="primary" 
        @click="saveUsername" 
        class="save-button"
      >
        {{ t('common.saveChanges') }}
      </el-button>
    </div>

    <!-- Feedback Dialog Component -->
    <FeedbackDialog v-model:visible="showFeedbackDialog" />
  </el-dialog>
</template>

<style scoped>
.settings-dialog {
  position: fixed !important;
  top: 65px !important;
  right: 24px !important;
  margin: 0 !important;
  max-width: calc(100vw - 48px) !important;
  width: 280px !important;
}

.settings-dialog :deep(.el-dialog) {
  width: 280px !important;
}

.settings-dialog :deep(.el-dialog__footer) {
  padding-top: 0;
  border-top: none;
}

.settings-dialog :deep(.el-dialog__header) {
  padding-bottom: 0;
}

.settings-dialog :deep(.el-dialog__title) {
  font-weight: 600;
  font-size: 16px;
}

/* Profile Section */
.profile-section {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
}

.no-margin-divider {
  margin: 0 !important;
}

.profile-avatar {
  flex-shrink: 0;
  background-color: white;
  color: var(--primary-color);
  cursor: pointer;
  transition: transform 0.2s;
}

.profile-avatar:hover {
  transform: scale(1.05);
}

.profile-info {
  flex: 1;
  min-width: 0;
}

.welcome-text {
  font-size: 14px;
  margin-bottom: 4px;
}

.username {
  color: var(--primary-color);
  font-weight: 600;
  margin-left: 4px;
}

.edit-hint {
  font-size: 12px;
  color: gray;
  opacity: 0.8;
}

/* Settings Form Section */
.settings-section {
  padding: 8px 0;
}

.form-item {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.form-item:last-child {
  margin-bottom: 0;
}

.form-label {
  display: flex;
  align-items: center;
  font-weight: 500;
  font-size: 14px;
  color: var(--text-primary);
  margin: 0;
}

.reminder-switch {
  flex-shrink: 0;
}

/* Action Buttons Section */
.action-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 8px;
}

.feedback-button {
  width: 100%;
}

.save-button {
  width: 100%;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .settings-dialog {
    right: 5% !important;
    left: 5% !important;
    top: 60px !important;
    max-width: none !important;
    width: 90% !important;
  }

  .profile-section {
    gap: 12px;
  }

  .profile-avatar {
    width: 56px !important;
    height: 56px !important;
  }

  .welcome-text {
    font-size: 13px;
  }

  .edit-hint {
    font-size: 11px;
  }

  .form-item {
    margin-bottom: 12px;
  }

  .form-label {
    font-size: 13px;
  }
}
</style>
