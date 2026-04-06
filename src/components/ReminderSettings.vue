<script setup>
import { ref, onMounted } from 'vue'
import { Switch, Bell } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getReminderSettings, updateReminderSettings } from '../services/storage.js'
import NotificationPermission from './NotificationPermission.vue'
import { isNotificationSupported, requestNotificationPermission, showNotification } from '../services/notification.js'

// 提醒设置
const settings = ref({
  enabled: true,
  soundEnabled: true,
  vibrationEnabled: true
})

// 加载数据
const loadData = async () => {
  const loadedSettings = await getReminderSettings()
  settings.value = loadedSettings
}

// 更新提醒设置
const handleUpdateSettings = async () => {
  await updateReminderSettings(settings.value)
  console.log('[DEBUG] 提醒设置已保存:', settings.value)
}

// 测试通知
const handleTestNotification = async () => {
  if (!isNotificationSupported()) {
    ElMessage({
      message: 'Your browser does not support notifications',
      type: 'warning',
    })
    return
  }

  const granted = await requestNotificationPermission()
  if (granted) {
    showNotification('Test Notification from DoneIt', {
      body: 'This is a test notification. You will receive reminders like this!',
      icon: '/favicon.svg',
    })
    ElMessage({
      message: 'Notification sent successfully!',
      type: 'success',
    })
  } else {
    ElMessage({
      message: 'Notification permission denied',
      type: 'error',
    })
  }
}

// 初始化
onMounted(async () => {
  await loadData()
})
</script>

<template>
  <div class="reminder-settings">
    <div class="settings-container">
      <h2>
        <el-icon><Bell /></el-icon>
        Notification Settings
      </h2>

      <!-- 权限管理 -->
      <div class="permission-section">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3>Notification Permission</h3>
          <el-button type="primary" @click="handleTestNotification" :icon="Bell" size="small">
            Test Notification
          </el-button>
        </div>
        <NotificationPermission />
      </div>

      <!-- 全局设置 -->
      <div class="global-settings">
        <h3 class="section-title">Global Settings</h3>

        <el-card shadow="hover" class="settings-card">
          <el-form label-width="120px">
            <el-form-item label="Enable Notifications">
              <el-switch
                v-model="settings.enabled"
                @change="handleUpdateSettings"
                inline-prompt
                :active-text="'ON'"
                :inactive-text="'OFF'"
              />
            </el-form-item>

            <el-form-item label="Sound">
              <el-switch
                v-model="settings.soundEnabled"
                @change="handleUpdateSettings"
                inline-prompt
                :active-text="'ON'"
                :inactive-text="'OFF'"
                :disabled="!settings.enabled"
              />
            </el-form-item>

            <el-form-item label="Vibration">
              <el-switch
                v-model="settings.vibrationEnabled"
                @change="handleUpdateSettings"
                inline-prompt
                :active-text="'ON'"
                :inactive-text="'OFF'"
                :disabled="!settings.enabled"
              />
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reminder-settings {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.settings-container {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.permission-section h3 {
  font-size: 20px;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0 0 16px 0;
}

.permission-section {
  margin-bottom: 20px;
}

.global-settings {
  margin-bottom: 20px;
}

.settings-card {
  margin-bottom: 20px;
}
</style>