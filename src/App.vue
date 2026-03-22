<script setup>
import { ref, onMounted } from 'vue'
import HabitList from './components/HabitList.vue'
import HabitForm from './components/HabitForm.vue'
import Dashboard from './components/Dashboard.vue'
import { Sunny, Moon, Search } from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'

// 暗色模式相关逻辑
const isDarkMode = ref(false)

// 搜索值
const searchValue = ref('')

// 当前视图
const currentView = ref('dashboard')

// 检查本地存储中的主题设置
onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    isDarkMode.value = savedTheme === 'dark'
  } else {
    // 检查系统偏好
    isDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  // 应用主题
  applyTheme()
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

const habits = ref([
  {
    id: 1,
    name: 'Morning Exercise',
    daysPerWeek: 5,
    reminders: [{ id: 1, time: '07:00' }],
    streak: 5,
    lastChecked: null
  },
  {
    id: 2,
    name: 'Read a Book',
    daysPerWeek: 3,
    reminders: [{ id: 2, time: '20:00' }],
    streak: 3,
    lastChecked: null
  },
  {
    id: 3,
    name: 'Drink Water',
    daysPerWeek: 7,
    reminders: [
      { id: 3, time: '09:00' },
      { id: 4, time: '13:00' },
      { id: 5, time: '18:00' }
    ],
    streak: 7,
    lastChecked: null
  },
  {
    id: 4,
    name: 'Meditate',
    daysPerWeek: 4,
    reminders: [{ id: 6, time: '21:00' }],
    streak: 2,
    lastChecked: null
  }
])
const showAddForm = ref(false)

const addHabit = (habit) => {
  habits.value.push({
    ...habit,
    id: Date.now(),
    streak: 0,
    lastChecked: null
  })
  showAddForm.value = false
}

const editHabit = (id, updatedHabit) => {
  const index = habits.value.findIndex(habit => habit.id === id)
  if (index !== -1) {
    habits.value[index] = { ...habits.value[index], ...updatedHabit }
  }
}

const deleteHabit = (id) => {
  habits.value = habits.value.filter(habit => habit.id !== id)
}

const toggleHabit = (id) => {
  const habit = habits.value.find(habit => habit.id === id)
  if (habit) {
    const today = new Date().toDateString()
    if (habit.lastChecked !== today) {
      habit.streak += 1
      habit.lastChecked = today
    } else {
      habit.streak = Math.max(0, habit.streak - 1)
      habit.lastChecked = null
    }
  }
}
</script>

<template>
  <div class="app-container">
    <!-- PC端布局 -->
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

      <main class="page-content">
        <!-- 左侧广告 -->
        <div class="adsense left-adsense">
          <div class="ad-placeholder">Adsense Ad</div>
        </div>

        <!-- 主要内容 -->
        <div class="main-content">
          <!-- Dashboard视图 -->
          <div v-if="currentView === 'dashboard'">
            <Dashboard />
          </div>

          <!-- My Habits视图 -->
          <div v-else-if="currentView === 'myhabits'">
            <div class="content-header">
              <h2>My Habits</h2>
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

            <HabitList :habits="habits" :search-value="searchValue" @edit="editHabit" @delete="deleteHabit" />
          </div>

          <!-- Stats视图 -->
          <div v-else-if="currentView === 'stats'">
            <div class="content-header">
              <h2>Stats</h2>
            </div>
            <div style="padding: 20px; text-align: center; color: var(--text-light);">
              <p>Statistics will be available soon...</p>
            </div>
          </div>

          <!-- Settings视图 -->
          <div v-else-if="currentView === 'settings'">
            <div class="content-header">
              <h2>Settings</h2>
            </div>
            <div style="padding: 20px; text-align: center; color: var(--text-light);">
              <p>Settings will be available soon...</p>
            </div>
          </div>
        </div>

        <!-- 右侧广告 -->
        <div class="adsense right-adsense">
          <div class="ad-placeholder">Adsense Ad</div>
        </div>
      </main>
    </div>

    <!-- 添加/编辑习惯表单 -->
    <HabitForm v-if="showAddForm" @add="addHabit" @cancel="showAddForm = false" />
  </div>
</template>
