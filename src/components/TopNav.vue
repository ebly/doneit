<script setup>
import { ref } from 'vue'
import { useTheme } from '../composables/useTheme.js'
import { useSettings } from '../composables/useSettings.js'
import { Sunny, Moon, UserFilled } from '@element-plus/icons-vue'
import Settings from './Settings.vue'

defineProps({
  currentView: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:currentView'])

const { isDarkMode, applyTheme } = useTheme()
const { username, avatar, initSettings } = useSettings()

initSettings()

const showSettingsDialog = ref(false)

const handleAvatarClick = () => {
  showSettingsDialog.value = true
}
</script>

<template>
  <div>
    <header class="header">
      <div class="logo">
        <h1>DoneIt</h1>
      </div>
      <div class="header-right">
        <nav class="nav">
          <a href="#" class="nav-link" :class="{ active: currentView === 'dashboard' }" @click.prevent="emit('update:currentView', 'dashboard')">Dashboard</a>
          <a href="#" class="nav-link" :class="{ active: currentView === 'myhabits' }" @click.prevent="emit('update:currentView', 'myhabits')">My Habits</a>
          <a href="#" class="nav-link" :class="{ active: currentView === 'calendar' }" @click.prevent="emit('update:currentView', 'calendar')">Calendar</a>
          <a href="#" class="nav-link" :class="{ active: currentView === 'stats' }" @click.prevent="emit('update:currentView', 'stats')">Stats</a>
        </nav>
        <el-switch v-model="isDarkMode" @change="applyTheme()" inline-prompt :active-icon="Sunny"
          :inactive-icon="Moon" />
        <el-popover
          placement="bottom-end"
          :width="200"
          trigger="hover"
        >
          <template #reference>
            <el-avatar :size="32" :icon="!avatar ? UserFilled : undefined" :src="avatar" style="cursor: pointer; margin-left: 12px; background-color: white; color: var(--primary-color);" @click="handleAvatarClick">
            </el-avatar>
          </template>
          <div><span style="color: gray;">Welcome</span> <span style="color: var(--primary-color); font-weight: 600;">{{ username || 'Stranger' }}</span></div>
        </el-popover>
      </div>
    </header>

    <Settings v-model:visible="showSettingsDialog" />
  </div>
</template>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  background: var(--primary-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  height: 60px;
}

.dark-mode .header {
  background: var(--primary-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.logo h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: white;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.nav {
  display: flex;
  gap: 8px;
}

.nav-link {
  text-decoration: none;
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
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
</style>
