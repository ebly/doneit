<script setup>
import { ref, onMounted, defineAsyncComponent } from 'vue'
import { useTheme } from './composables/useTheme.js'
import { useHabits } from './composables/useHabits.js'
import { loadMockDataScript } from './composables/useMockData.js'
import { Sunny, Moon, Search } from '@element-plus/icons-vue'

// 异步加载组件
const HabitList = defineAsyncComponent(() => import('./components/HabitList.vue'))
const HabitForm = defineAsyncComponent(() => import('./components/HabitForm.vue'))
const Dashboard = defineAsyncComponent(() => import('./components/Dashboard.vue'))
const ReminderSettings = defineAsyncComponent(() => import('./components/ReminderSettings.vue'))
const Calendar = defineAsyncComponent(() => import('./components/Calendar.vue'))
const Stats = defineAsyncComponent(() => import('./components/Stats.vue'))

// 使用组合式函数
const { isDarkMode, initTheme, applyTheme } = useTheme()
const { habits, showAddForm, editingHabit, loadHabits, handleAddHabit, startEditHabit, cancelEditHabit, handleDeleteHabit } = useHabits()

// 状态
const searchValue = ref('')
const currentView = ref('dashboard')

// 初始化
onMounted(async () => {
  initTheme()
  await loadHabits()
  
  if (import.meta.env.DEV) {
    loadMockDataScript(loadHabits)
  }
})
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
            <a href="#" class="nav-link" :class="{ active: currentView === 'calendar' }" @click.prevent="currentView = 'calendar'">Calendar</a>
            <a href="#" class="nav-link" :class="{ active: currentView === 'stats' }" @click.prevent="currentView = 'stats'">Stats</a>
            <a href="#" class="nav-link" :class="{ active: currentView === 'settings' }" @click.prevent="currentView = 'settings'">Settings</a>
          </nav>
          <el-switch v-model="isDarkMode" @change="applyTheme()" inline-prompt :active-icon="Sunny"
            :inactive-icon="Moon" />
        </div>
      </header>

      <main class="main-content">
        <!-- Dashboard 视图 -->
        <Dashboard v-if="currentView === 'dashboard'" :habits="habits" @update:habits="habits = $event" />

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

          <HabitList :habits="habits" :search-value="searchValue" @edit="startEditHabit" @delete="handleDeleteHabit" />
        </template>

        <!-- Calendar 视图 -->
        <Calendar v-else-if="currentView === 'calendar'" :habits="habits" />

        <!-- Stats 视图 -->
        <Stats v-else-if="currentView === 'stats'" :habits="habits" />

        <!-- Settings 视图 -->
        <template v-else-if="currentView === 'settings'">
          <div class="coming-soon-container">
            <p class="coming-soon-text">Coming Soon</p>
          </div>
        </template>
      </main>
    </div>

    <!-- 添加/编辑习惯表单 -->
    <HabitForm v-model:visible="showAddForm" :habit="editingHabit" @add="handleAddHabit" @cancel="cancelEditHabit" />
  </div>
</template>

<style scoped>
.app-container {
  background-color: #f8f8fc;
  min-height: 100vh;
}

.dark-mode .app-container {
  background-color: #1a1a1a;
}
</style>
