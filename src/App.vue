<script setup>
import { ref, onMounted, defineAsyncComponent, computed } from 'vue'
// 使用动态导入实现按需加载
const HabitList = defineAsyncComponent(() => import('./components/HabitList.vue'))
const HabitForm = defineAsyncComponent(() => import('./components/HabitForm.vue'))
const Dashboard = defineAsyncComponent(() => import('./components/Dashboard.vue'))
const ReminderSettings = defineAsyncComponent(() => import('./components/ReminderSettings.vue'))
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

// 统计视图激活标签页
const statsActiveTab = ref('days')

// 日历相关状态
const currentDate = ref(new Date())
const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// 日历相关计算属性
const currentMonthLabel = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.toLocaleString('en-US', { month: 'short' })
  return `${month} ${year}`
})

const calendarCells = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  
  // 获取当月第一天
  const firstDay = new Date(year, month, 1)
  // 获取当月最后一天
  const lastDay = new Date(year, month + 1, 0)
  // 获取第一天是星期几
  const firstDayOfWeek = firstDay.getDay()
  // 获取当月总天数
  const totalDays = lastDay.getDate()
  
  const cells = []
  const today = new Date()
  
  // 添加空单元格（上个月的）
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push({ isEmpty: true })
  }
  
  // 添加日期单元格
  for (let day = 1; day <= totalDays; day++) {
    const cellDate = new Date(year, month, day)
    const dateStr = cellDate.toISOString().split('T')[0] // YYYY-MM-DD
    
    // 查找这一天完成的习惯
    const completions = habits.value.filter(habit => {
      if (!habit.completedDates) return false
      return habit.completedDates.some(completedDate => {
        const completedDateStr = completedDate.split(' ')[0]
        return completedDateStr === dateStr
      })
    })
    
    cells.push({
      date: day,
      isEmpty: false,
      isToday: cellDate.toDateString() === today.toDateString(),
      completions: completions.length > 0 ? completions : null
    })
  }
  
  return cells
})

// 切换月份
const previousMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
}

const nextMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
}

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
    
    console.log('[INFO] 模拟数据生成脚本已加载')
    console.log('[INFO] 使用方法：在浏览器控制台输入 generateMockData() 并回车')
    console.log('[INFO] 查看数据：在浏览器控制台输入 printHabits() 并回车')
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
            <a href="#" class="nav-link" :class="{ active: currentView === 'stats' }" @click.prevent="currentView = 'stats'">Stats</a>
            <a href="#" class="nav-link" :class="{ active: currentView === 'settings' }" @click.prevent="currentView = 'settings'">Settings</a>
          </nav>
          <el-switch v-model="isDarkMode" @change="applyTheme()" inline-prompt :active-icon="Sunny"
            :inactive-icon="Moon" />
        </div>
      </header>

      <main class="main-content" :class="{ 'stats-view-active': currentView === 'stats' }">
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
          <div class="stats-view">
            <div class="calendar-header">
              <div class="calendar-nav">
                <div class="nav-arrow" @click="previousMonth">
                  <
                </div>
                <h3 :class="{ 'active': statsActiveTab === 'days' }" @click="statsActiveTab = 'days'">{{ currentMonthLabel }}</h3>
                <div class="nav-arrow" @click="nextMonth">
                  >
                </div>
              </div>
              <el-button link :class="{ 'active': statsActiveTab === 'weeks' }" @click="statsActiveTab = 'weeks'">
                Weeks
              </el-button>
              <el-button link :class="{ 'active': statsActiveTab === 'months' }" @click="statsActiveTab = 'months'">
                Months
              </el-button>
              <el-button link :class="{ 'active': statsActiveTab === 'years' }" @click="statsActiveTab = 'years'">
                Years
              </el-button>
            </div>
            
            <div class="stats-tab-content">
              <!-- Days 标签页内容（日历视图） -->
              <div v-if="statsActiveTab === 'days'" class="calendar-container">
                <div class="calendar-grid">
                  <div class="calendar-weekday" v-for="day in weekDays" :key="day">{{ day }}</div>
                  <div 
                    v-for="(cell, index) in calendarCells" 
                    :key="index"
                    class="calendar-cell"
                    :class="{ 'empty': cell.isEmpty, 'today': cell.isToday }"
                  >
                    <div class="cell-date">{{ cell.date }}</div>
                    <div v-if="!cell.isEmpty && cell.completions" class="cell-completions">
                      <div 
                        v-for="(habit, hIndex) in cell.completions" 
                        :key="hIndex"
                        class="completion-dot"
                        :title="habit.name"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
