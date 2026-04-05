<script setup>
import { ref, onMounted, defineAsyncComponent } from 'vue'
// 使用动态导入实现按需加载
const HabitList = defineAsyncComponent(() => import('./components/HabitList.vue'))
const HabitForm = defineAsyncComponent(() => import('./components/HabitForm.vue'))
const Dashboard = defineAsyncComponent(() => import('./components/Dashboard.vue'))
const ReminderSettings = defineAsyncComponent(() => import('./components/ReminderSettings.vue'))
import { Sunny, Moon, Search } from '@element-plus/icons-vue'
// 导入存储服务
import { getHabits, addHabit as addHabitToStorage, updateHabit, deleteHabit as deleteHabitFromStorage, toggleHabitComplete } from './services/storage.js'

// 暗色模式相关逻辑
const isDarkMode = ref(false)

// 搜索值
const searchValue = ref('')

// 当前视图
const currentView = ref('dashboard')

// 习惯列表
const habits = ref([])

// 检查本地存储中的主题设置和加载习惯
onMounted(async () => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    isDarkMode.value = savedTheme === 'dark'
  } else {
    // 检查系统偏好
    isDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  // 应用主题
  applyTheme()

  // 加载习惯数据
  await loadHabits()
})

// 应用主题并保存到本地存储
const applyTheme = () => {
  if (isDarkMode.value) {
    document.body.classList.add('dark-mode')
  } else {
    document.body.classList.remove('dark-mode')
  }
  // 保存到本地存储
  localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light')
}

// 从本地存储加载习惯
const loadHabits = async () => {
  const loadedHabits = await getHabits()
  habits.value = loadedHabits
}

const showAddForm = ref(false)
const editingHabit = ref(null)

const addHabit = async (habit) => {
  console.log('[DEBUG] addHabit called with:', habit)

  if (editingHabit.value) {
    // 编辑模式
    console.log('[DEBUG] Editing habit:', editingHabit.value.id)
    await updateHabit(editingHabit.value.id, habit)
  } else {
    // 添加模式
    console.log('[DEBUG] Adding new habit')
    await addHabitToStorage(habit)
  }
  await loadHabits() // 重新加载以获取最新数据
  showAddForm.value = false
  editingHabit.value = null
}

const startEditHabit = (habit) => {
  editingHabit.value = habit
  showAddForm.value = true
}

const cancelEditHabit = () => {
  showAddForm.value = false
  editingHabit.value = null
}

const deleteHabit = async (id) => {
  await deleteHabitFromStorage(id)
  await loadHabits() // 重新加载以获取最新数据
}

const toggleHabit = async (id) => {
  const result = await toggleHabitComplete(id, new Date())
  if (result) {
    await loadHabits() // 重新加载以获取最新数据
  }
}
</script>

<template>
  <div class="app-container">
    <!-- PC 端布局 -->
    <div class="pc-layout">
      <header class="header">
        <div class="logo">
          <h1>DoneIt</h1>
        </div>
        <div class="header-right">
          <nav class="nav">
            <a href="#" class="nav-link" :class="{ active: currentView === 'dashboard' }" @click.prevent="currentView = 'dashboard'">Dashboard</a>
            <a href="#" class="nav-link" :class="{ active: currentView === 'myhabits' }" @click.prevent="currentView = 'myhabits'">My Habits</a>
            <a href="#" class="nav-link" :class="{ active: currentView === 'stats' }" @click.prevent="currentView = 'stats'">Stats</a>
            <a href="#" class="nav-link" :class="{ active: currentView === 'settings' }" @click.prevent="currentView = 'settings'">Settings</a>
          </nav>
          <el-switch v-model="isDarkMode" @change="applyTheme()" inline-prompt :active-icon="Sunny"
            :inactive-icon="Moon" />
        </div>
      </header>

      <main class="main-content">
        <!-- Dashboard 视图 -->
        <Dashboard v-if="currentView === 'dashboard'" :habits="habits" @update:habits="newHabits => habits = newHabits" />

        <!-- My Habits 视图 -->
        <template v-else-if="currentView === 'myhabits'">
          <div class="content-header">
            <div class="search-button-container">
              <el-input
                v-model="searchValue"
                placeholder="Search habits..."
                class="search-bar"
                clearable
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              <button class="add-btn" @click="showAddForm = true">+ Add Habit</button>
            </div>
          </div>

          <HabitList :habits="habits" :search-value="searchValue" @edit="startEditHabit" @delete="deleteHabit" />
        </template>

        <!-- Stats 视图 -->
        <template v-else-if="currentView === 'stats'">
          <div style="padding: 20px; text-align: center; color: var(--text-light);">
            <p>Statistics will be available soon...</p>
          </div>
        </template>

        <!-- Settings 视图 -->
        <template v-else-if="currentView === 'settings'">
          <ReminderSettings />
        </template>
      </main>
    </div>

    <!-- 添加/编辑习惯表单 -->
    <HabitForm v-model:visible="showAddForm" :habit="editingHabit" @add="addHabit" @cancel="cancelEditHabit" />
  </div>
</template>

<style scoped>
/* 布局样式保持不变 */
</style>
