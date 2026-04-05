<script setup>
import { ref, onMounted } from 'vue'
import { Bell, TurnOff } from '@element-plus/icons-vue'
import { 
  isNotificationSupported, 
  getNotificationPermission, 
  requestNotificationPermission 
} from '../services/notification.js'

// 通知权限状态
const permissionStatus = ref('default')
const isSupported = ref(false)

// 获取权限状态文本
const getPermissionText = () => {
  switch (permissionStatus.value) {
    case 'granted':
      return '通知已启用'
    case 'denied':
      return '通知已禁用'
    case 'default':
      return '通知未设置'
    default:
      return '未知状态'
  }
}

// 获取权限状态样式
const getPermissionClass = () => {
  switch (permissionStatus.value) {
    case 'granted':
      return 'permission-granted'
    case 'denied':
      return 'permission-denied'
    default:
      return 'permission-default'
  }
}

// 获取权限图标
const getPermissionIcon = () => {
  return permissionStatus.value === 'granted' ? Bell : TurnOff
}

// 更新权限状态
const updatePermissionStatus = () => {
  permissionStatus.value = getNotificationPermission()
}

// 请求通知权限
const handleRequestPermission = async () => {
  if (!isSupported.value) return
  
  const granted = await requestNotificationPermission()
  if (granted) {
    permissionStatus.value = 'granted'
  }
}

// 初始化
onMounted(() => {
  isSupported.value = isNotificationSupported()
  if (isSupported.value) {
    updatePermissionStatus()
  }
})
</script>

<template>
  <div class="notification-permission">
    <div class="permission-status">
      <el-icon :class="getPermissionClass()">
        <component :is="getPermissionIcon()" />
      </el-icon>
      <span>{{ getPermissionText() }}</span>
    </div>
    
    <el-alert
      v-if="!isSupported"
      title="浏览器不支持通知功能"
      type="info"
      size="small"
      show-icon
      :closable="false"
      class="support-alert"
    />
    
    <el-alert
      v-else-if="permissionStatus === 'default'"
      title="启用通知提醒"
      description="允许DoneIt向您发送习惯提醒通知"
      type="warning"
      size="small"
      show-icon
      :closable="false"
      class="permission-alert"
    >
      <template #default>
        <el-button
          type="primary"
          size="small"
          @click="handleRequestPermission"
        >
          允许通知
        </el-button>
      </template>
    </el-alert>
    
    <el-alert
      v-else-if="permissionStatus === 'denied'"
      title="通知已被禁用"
      description="请在浏览器设置中启用通知权限"
      type="error"
      size="small"
      show-icon
      :closable="false"
      class="permission-alert"
    />
    
    <el-alert
      v-else-if="permissionStatus === 'granted'"
      title="通知已启用"
      description="您将在习惯提醒时间收到通知"
      type="success"
      size="small"
      show-icon
      :closable="false"
      class="permission-alert"
    />
  </div>
</template>

<style scoped>
.notification-permission {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background-color: var(--el-card-bg-color);
  border-radius: var(--el-border-radius-base);
  box-shadow: var(--el-card-box-shadow);
}

.permission-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
}

.permission-status .permission-granted {
  color: var(--el-color-success);
}

.permission-status .permission-denied {
  color: var(--el-color-danger);
}

.permission-status .permission-default {
  color: var(--el-color-warning);
}

.support-alert,
.permission-alert {
  margin: 0;
}
</style>