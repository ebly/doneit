<script setup>
import { ref, watch } from 'vue'
import { useSettings } from '../composables/useSettings.js'
import { UserFilled, ChatLineRound } from '@element-plus/icons-vue'
import FeedbackDialog from './FeedbackDialog.vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible'])

const { username, avatar, setUsername, setAvatar } = useSettings()

const tempUsername = ref('')
const fileInput = ref(null)
const showFeedbackDialog = ref(false)

watch(() => props.visible, (newVal) => {
  if (newVal) {
    tempUsername.value = username.value
  }
})

const handleClose = () => {
  emit('update:visible', false)
}

const saveUsername = () => {
  const trimmed = tempUsername.value.trim()
  if (trimmed.length > 10) {
    alert('Username cannot exceed 10 characters')
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
</script>

<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="emit('update:visible', $event)"
    title="Settings"
    width="380px"
    :close-on-click-modal="true"
    :close-on-press-escape="true"
    :show-close="true"
    :modal="false"
    class="settings-dialog"
    style="position: fixed; top: 70px; right: 20px; margin: 0;"
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
          <span style="color: gray;">Welcome</span> 
          <span class="username">{{ username || 'Stranger' }}</span>
        </div>
        <div class="edit-hint">Click avatar to change</div>
      </div>
    </div>
    
    <el-divider />
    
    <!-- Settings Form Section -->
    <div class="settings-section">
      <div class="form-item">
        <label class="form-label">Username</label>
        <el-input 
          v-model="tempUsername" 
          placeholder="Enter your name" 
          maxlength="10" 
          @keyup.enter="saveUsername"
          clearable
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
        Feedback
      </el-button>
      
      <el-button 
        type="primary" 
        @click="saveUsername" 
        class="save-button"
      >
        Save Changes
      </el-button>
    </div>

    <!-- Feedback Dialog Component -->
    <FeedbackDialog v-model:visible="showFeedbackDialog" />
  </el-dialog>
</template>

<style scoped>
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
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 8px;
  color: var(--text-primary);
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
</style>
