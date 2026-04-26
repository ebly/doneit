<script setup>
import { ref, watch, onMounted } from 'vue'
import { useTheme } from '../composables/useTheme.js'
import { useSettings } from '../composables/useSettings.js'
import { Sunny, Moon, UserFilled, ChatLineRound } from '@element-plus/icons-vue'
import { getReminderNotificationSettings, updateReminderNotificationSettings } from '../services/storage'
import Settings from './Settings.vue'
import FeedbackDialog from './FeedbackDialog.vue'
import { useI18n, registerLocale } from '../utils/i18n.js'
import en from '../locales/en.js'
import zh from '../locales/zh.js'

registerLocale('en', en)
registerLocale('zh', zh)

defineProps({
  currentView: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:currentView'])

const { isDarkMode, applyTheme } = useTheme()
const { username, avatar, setUsername, setAvatar, setLanguage, initSettings, language } = useSettings()
const { t, currentLang } = useI18n()

initSettings()

watch(() => language.value, (newVal) => {
  currentLang.value = newVal
}, { immediate: true })

const showSettingsDialog = ref(false)
const tempUsername = ref('')
const fileInput = ref(null)
const showFeedbackDialog = ref(false)
const reminderEnabled = ref(true)

const languageOptions = [
  { label: 'ENGLISH', value: 'en' },
  { label: 'CHINESE', value: 'zh' }
]

const handleLanguageChange = (lang) => {
  setLanguage(lang)
}

watch(() => username.value, (newVal) => {
  if (newVal) {
    tempUsername.value = newVal
  }
}, { immediate: true })

onMounted(async () => {
  const enabled = await getReminderNotificationSettings()
  reminderEnabled.value = enabled
})

const handleAvatarClick = () => {
  fileInput.value?.click()
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

const saveUsername = () => {
  const trimmed = tempUsername.value.trim()
  if (trimmed.length > 10) {
    alert(t.value('settings.usernameExceed'))
    return
  }
  setUsername(trimmed)
  tempUsername.value = trimmed
}

const handleReminderToggle = async (enabled) => {
  await updateReminderNotificationSettings(enabled)
}
</script>

<template>
  <div>
    <header class="header">
      <div class="logo">
        <h1>DoneIt</h1>
        <span class="version">v1.0.4</span>
      </div>
      <div class="logo1">
        <h1>DoneIt</h1>
      </div>
      <div class="header-right">
        <nav class="nav">
          <a href="#" class="nav-link" :class="{ active: currentView === 'dashboard' }" @click.prevent="emit('update:currentView', 'dashboard')">{{ t('nav.dashboard') }}</a>
          <a href="#" class="nav-link" :class="{ active: currentView === 'myhabits' }" @click.prevent="emit('update:currentView', 'myhabits')">{{ t('nav.myHabits') }}</a>
          <a href="#" class="nav-link" :class="{ active: currentView === 'calendar' }" @click.prevent="emit('update:currentView', 'calendar')">{{ t('nav.calendar') }}</a>
          <a href="#" class="nav-link" :class="{ active: currentView === 'stats' }" @click.prevent="emit('update:currentView', 'stats')">{{ t('nav.stats') }}</a>
        </nav>
        <el-popover
          placement="bottom-end"
          :width="380"
          trigger="click"
          popper-class="settings-popover"
        >
          <template #reference>
            <el-avatar :size="32" :icon="!avatar ? UserFilled : undefined" :src="avatar" style="cursor: pointer; background-color: white; color: var(--primary-color);">
            </el-avatar>
          </template>
          <!-- Profile Section in Popover -->
          <div class="popover-profile-section">
            <el-avatar 
              :size="64" 
              :icon="!avatar ? UserFilled : undefined"
              :src="avatar"
              class="profile-avatar popover-avatar"
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
                <span>{{ t('settings.welcome') }}</span> 
                <span class="username">{{ username || t('settings.stranger') }}</span>
              </div>
              <div class="edit-hint">{{ t('settings.clickAvatar') }}</div>
            </div>
          </div>
          
          <!-- Divider -->
          <el-divider class="popover-divider"></el-divider>
          
          <!-- Settings Form Section -->
          <div class="popover-settings-section">
            <div class="form-item">
              <el-input 
                v-model="tempUsername" 
                :placeholder="t('settings.enterName')" 
                maxlength="10" 
                @keyup.enter="saveUsername"
                clearable
                size="small"
              />
            </div>
            
            <div class="form-item switch-item">
              <span class="form-label">{{ t('settings.notification') }}</span>
              <el-switch
                v-model="reminderEnabled"
                @change="handleReminderToggle"
                class="reminder-switch"
              />
            </div>

            <div class="form-item language-item">
              <span class="form-label">{{ t('settings.language') }}</span>
              <el-select
                v-model="currentLang"
                @change="handleLanguageChange"
                class="popover-language-select"
                size="small"
              >
                <el-option
                  v-for="option in languageOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </div>

            <div class="form-item switch-item">
              <span class="form-label">{{ t('settings.theme') }}</span>
              <el-switch
                v-model="isDarkMode"
                @change="applyTheme()"
                inline-prompt
                :active-icon="Sunny"
                :inactive-icon="Moon"
                class="theme-switch"
              />
            </div>
          </div>
          
          <!-- Action Buttons Section -->
          <div class="popover-action-section">
            <el-button 
              type="info" 
              @click="showFeedbackDialog = true" 
              :icon="ChatLineRound" 
              class="feedback-button"
              size="small"
            >
              {{ t('settings.feedback') }}
            </el-button>
            
            <el-button 
              type="primary" 
              @click="saveUsername" 
              class="save-button"
              size="small"
            >
              {{ t('common.saveChanges') }}
            </el-button>
          </div>
        </el-popover>
        
        <!-- Feedback Dialog Component -->
        <FeedbackDialog v-model:visible="showFeedbackDialog" />
        
        <Settings v-model:visible="showSettingsDialog" />
      </div>
    </header>
  </div>
</template>

<style scoped>
/* ==================== PC 基础样式 ==================== */
.header {
  padding: 0 10px;
  height: 60px;
}

.logo {
  display: flex;
  align-items: center;
}

.logo1 {
  display: none;
  align-items: center;
}

.logo1 h1 {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  color: white;
}

.logo h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: white;
}

.logo .version {
  margin-left: 16px;
  font-size: 12px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1;
}

.nav {
  display: flex;
  gap: 10px;
}

.nav-link {
  position: relative;
  text-decoration: none;
  color: white;
  padding: 0;
  transition: all 0.2s;
  font-weight: 500;
}

.nav-link:hover {
  color: white;
}

.nav-link.active {
  color: white;
  font-weight: 600;
}

.nav-link:hover::after,
.nav-link.active::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 2px;
  background-color: white;
}

/* ==================== Popover 样式 ==================== */
.popover-profile-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  width: 100%;
}

.popover-avatar {
  flex-shrink: 0;
  background-color: white;
  color: var(--primary-color);
  cursor: pointer;
  transition: transform 0.2s;
}

.popover-avatar:hover {
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

.welcome-text span:first-child {
  color: gray;
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

.popover-divider {
  margin: 8px 0;
}

.popover-settings-section {
  padding: 8px 0;
  width: 100%;
}

.form-item {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.form-item.switch-item {
  justify-content: space-between;
}

.form-label {
  font-weight: 500;
  font-size: 14px;
  color: var(--text-primary);
  margin-right: 8px;
}

.reminder-switch,
.theme-switch {
  flex-shrink: 0;
}

.popover-action-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 8px;
  width: 100%;
}

.feedback-button,
.save-button {
  width: 100%;
}

.language-item {
  justify-content: space-between;
}

.popover-language-select {
  width: 120px;
}

input[type="file"] {
  display: none;
}

.settings-popover {
  padding: 0 !important;
}

.settings-popover :deep(.el-popover__content) {
  padding: 0;
}

.dark-mode .header {
  background: var(--primary-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

@media (max-width: 500px) {
  .logo {
    display: none;
  }

  .logo1 {
    display: flex;
  }
}
</style>
