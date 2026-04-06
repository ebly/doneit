<script setup>
import { ref, onMounted, defineAsyncComponent, computed } from 'vue'
// 使用动态导入实现按需加载
const HabitList = defineAsyncComponent(() => import('./components/HabitList.vue'))
const HabitForm = defineAsyncComponent(() => import('./components/HabitForm.vue'))
const Dashboard = defineAsyncComponent(() => import('./components/Dashboard.vue'))
const ReminderSettings = defineAsyncComponent(() => import('./components/ReminderSettings.vue'))
const Calendar = defineAsyncComponent(() => import('./components/Calendar.vue'))
import Stats from './components/Stats.vue'
import { Sunny, Moon, Search } from '@element-plus/icons-vue'
// 导入存储服务
import { getHabits, addHabit as addHabitToStorage, updateHabit, deleteHabit as deleteHabitFromStorage, toggleHabitComplete } from './services/storage.js'
// 导入模拟数据生成工具
import { generateMockData as generateMockDataUtil } from './utils/generateMockData.js'

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
  
  // 开发环境下加载模拟数据生成脚本
  if (import.meta.env.DEV) {
    loadMockDataScript()
  }
})

// 加载模拟数据生成脚本
const loadMockDataScript = async () => {
  try {
    // 将生成函数暴露到全局作用域
    window.generateMockData = () => generateMockDataUtil(getHabits, updateHabit, loadHabits)
    
    // 添加查看 IndexedDB 数据的方法
    window.printHabits = async () => {
      try {
        const habits = await getHabits()
        console.log('===== IndexedDB 中的 Habits 数据 =====')
        console.log(JSON.parse(JSON.stringify(habits)))
        console.log('=====================================')
        console.log(`共 ${habits.length} 个习惯`)
        habits.forEach((habit, index) => {
          console.log(`\n习惯 ${index + 1}:`)
          console.log(`  ID: ${habit.id}`)
          console.log(`  名称：${habit.name}`)
          console.log(`  描述：${habit.description}`)
          console.log(`  频率：${habit.frequency}`)
          console.log(`  每周天数：${habit.daysPerWeek?.length || 0}`)
          console.log(`  完成记录数：${habit.completedDates?.length || 0}`)
          if (habit.completedDates?.length > 0) {
            console.log(`  最近完成：${habit.completedDates.slice(-5).join(', ')}`)
          }
        })
        return habits
      } catch (error) {
        console.error('[ERROR] 获取 habits 失败:', error)
      }
    }
    
    // 添加删除特定日期打卡记录的方法
    window.removeCompletionsByDate = async (dateStr) => {
      try {
        const habits = await getHabits()
        let removedCount = 0
        
        for (const habit of habits) {
          if (!habit.completedDates) continue
          
          const initialLength = habit.completedDates.length
          habit.completedDates = habit.completedDates.filter(d => !d.startsWith(dateStr))
          const removed = initialLength - habit.completedDates.length
          
          if (removed > 0) {
            removedCount += removed
            await updateHabit(habit.id, { completedDates: habit.completedDates })
            console.log(`从习惯 "${habit.name}" 删除了 ${removed} 条 ${dateStr} 的记录`)
          }
        }
        
        await loadHabits()
        console.log(`\n总共删除了 ${removedCount} 条 ${dateStr} 的打卡记录`)
        return removedCount
      } catch (error) {
        console.error('[ERROR] 删除记录失败:', error)
        return 0
      }
    }
    
    console.log('[INFO] 模拟数据生成脚本已加载')
    console.log('[INFO] 使用方法：在浏览器控制台输入 generateMockData() 并回车')
    console.log('[INFO] 查看数据：在浏览器控制台输入 printHabits() 并回车')
    console.log('[INFO] 删除 7 号记录：在浏览器控制台输入 removeCompletionsByDate("2026-04-07") 并回车')
  } catch (error) {
    console.error('[ERROR] 加载模拟数据脚本失败:', error)
  }
}

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
    <HabitForm v-model:visible="showAddForm" :habit="editingHabit" @add="addHabit" @cancel="cancelEditHabit" />
  </div>
</template>

<style scoped>
/* 布局样式保持不变 */

.coming-soon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.coming-soon-text {
  font-size: 24px;
  color: #999;
  font-weight: 500;
}

.dark-mode .coming-soon-text {
  color: #666;
}
</style>
