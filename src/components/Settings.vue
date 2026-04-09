<script setup>
import { ref, watch } from 'vue'
import { useSettings } from '../composables/useSettings.js'
import { UserFilled } from '@element-plus/icons-vue'

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
    width="350px"
    :close-on-click-modal="true"
    :close-on-press-escape="true"
    :show-close="true"
    :modal="false"
    class="settings-dialog"
    style="position: fixed; top: 70px; right: 20px; margin: 0;"
  >
    <div style="text-align: center;">
      <el-avatar 
        :size="60" 
        :icon="!avatar ? UserFilled : undefined"
        :src="avatar"
        style="background-color: white; color: var(--primary-color); margin-bottom: 12px; cursor: pointer;"
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
      <div><span style="color: gray;">Welcome</span> <span style="color: var(--primary-color); font-weight: 600;">{{ username || 'Stranger' }}</span></div>
    </div>
    <el-divider />
    <div style="margin-bottom: 16px;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <p style="font-weight: 600; margin: 0; white-space: nowrap;">Username</p>
        <el-input v-model="tempUsername" placeholder="Enter your name" maxlength="10" @keyup.enter="saveUsername" style="flex: 1;" />
      </div>
    </div>
    <template #footer>
      <div style="width: 100%; text-align: center;">
        <el-button type="primary" @click="saveUsername">Save</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.settings-dialog :deep(.el-dialog__footer) {
  padding-top: 0;
  border-top: none;
}
</style>
