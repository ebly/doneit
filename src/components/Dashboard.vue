<script setup>
import { ref, onMounted } from 'vue'
import { Star, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getHabits, toggleHabitComplete, exportData } from '../services/storage.js'

// 接收习惯数据作为 props
const props = defineProps({
  habits: {
    type: Array,
    default: () => []
  }
})

// 定义 emit
const emit = defineEmits(['update:habits'])

// 存储展开的习惯 ID
const expandedHabitId = ref(null)

// 切换习惯展开/收起状态
const toggleHabitExpand = (habitId) => {
  expandedHabitId.value = expandedHabitId.value === habitId ? null : habitId
}

// 获取当前星期几的索引：0=周日，1=周一，...，6=周六
const currentDayIndex = ref(new Date().getDay())

// 计算本周日期范围（从周日开始）
const getCurrentWeekDates = () => {
  const today = new Date()
  const currentDay = today.getDay()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - currentDay)
  
  const weekDates = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)
    weekDates.push(date)
  }

  return weekDates
}

const weekDates = ref(getCurrentWeekDates())
const weekDayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// 检查习惯在特定日期是否完成
const isHabitCompletedOnDate = (habit, date) => {
  if (!habit.completedDates) return false
  // 使用本地时间格式化，避免时区问题
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const dateStr = `${year}-${month}-${day}`
  return habit.completedDates.some(d => d.startsWith(dateStr))
}

// 计算本周可打卡的天数（根据 daysPerWeek 设置）
const calculateWeeklyTotal = (habit) => {
  if (!habit.daysPerWeek || habit.daysPerWeek.length === 0) {
    return 7 // 如果没有设置 daysPerWeek，默认可打卡 7 天
  }

  // 获取本周日期范围（从周日开始）
  const today = new Date()
  const currentDay = today.getDay()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - currentDay)
  
  let total = 0
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)
    const dayIndex = date.getDay().toString()
    
    if (habit.daysPerWeek.includes(dayIndex)) {
      total++
    }
  }

  return total
}

// 计算习惯的单周打卡次数（Weekly）
const calculateWeekly = (habit) => {
  if (!habit.completedDates || habit.completedDates.length === 0) {
    return 0
  }

  // 获取本周日期范围（从周日开始）
  const today = new Date()
  const currentDay = today.getDay()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - currentDay)
  
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6) // 本周周日

  // 统计本周内的打卡天数
  let weekly = 0
  const checkedDates = new Set()

  for (const dateStr of habit.completedDates) {
    const checkinDate = new Date(dateStr)
    const checkinDateOnly = new Date(checkinDate.getFullYear(), checkinDate.getMonth(), checkinDate.getDate())
    
    // 检查是否在本周范围内
    if (checkinDateOnly >= weekStart && checkinDateOnly <= weekEnd) {
      // 使用 Set 去重，同一天只计算一次
      const dateKey = checkinDateOnly.toISOString().split('T')[0]
      if (!checkedDates.has(dateKey)) {
        checkedDates.add(dateKey)
        weekly++
      }
    }
  }

  return weekly
}

// 检查某一天是否在习惯的 daysPerWeek 中
const isDayEnabled = (habit, dayIndex) => {
  // 如果没有设置 daysPerWeek 或为空数组，默认允许所有天
  if (!habit.daysPerWeek || habit.daysPerWeek.length === 0) {
    return true
  }
  return habit.daysPerWeek.includes(dayIndex.toString())
}

// 检查日期是否是今天
const isToday = (date) => {
  const today = new Date()
  // 使用本地时间比较，避免时区问题
  return date.getFullYear() === today.getFullYear() &&
         date.getMonth() === today.getMonth() &&
         date.getDate() === today.getDate()
}

// Check if current time is within ±1 Hour of reminder time
const isWithinReminderWindow = (habit) => {
  if (!habit.reminders || habit.reminders.length === 0) {
    return { valid: true } // 没有设置提醒时间，允许勾选
  }

  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const currentTimeInMinutes = currentHour * 60 + currentMinute

  for (const reminderTime of habit.reminders) {
    if (!reminderTime) continue

    const [reminderHour, reminderMinute] = reminderTime.split(':').map(Number)
    const reminderTimeInMinutes = reminderHour * 60 + reminderMinute

    // Calculate time difference (minutes)
    let timeDiff = currentTimeInMinutes - reminderTimeInMinutes

    // 处理跨天情况
    if (timeDiff > 720) {
      timeDiff -= 1440 // Subtract one day's minutes
    } else if (timeDiff < -720) {
      timeDiff += 1440 // Add one day's minutes
    }

    // Check if within ±1 Hour (60 minutes) range
    if (Math.abs(timeDiff) <= 60) {
      return { valid: true }
    }
  }

  // Not within ±1 Hour range of any reminder time
  const earliestReminder = habit.reminders[0]
  const [earliestHour, earliestMinute] = earliestReminder.split(':').map(Number)
  const earliestReminderInMinutes = earliestHour * 60 + earliestMinute
  
  // Format hour display, handle 00:00 case
  const prevHour = earliestHour === 0 ? 23 : earliestHour - 1
  const nextHour = earliestHour === 23 ? 0 : earliestHour + 1
  
  if (currentTimeInMinutes < earliestReminderInMinutes - 60) {
    return { valid: false, message: `Too early. Reminder is at ${earliestReminder}, please check in after ${String(prevHour).padStart(2, '0')}:00` }
  } else {
    return { valid: false, message: `Too late. Reminder was at ${earliestReminder}, please check in before ${String(nextHour).padStart(2, '0')}:00` }
  }
}

// 切换习惯在特定日期的完成状态
const toggleDay = async (habitId, dayIndex) => {
  const date = weekDates.value[dayIndex]
  const habit = props.habits.find(h => h.id === habitId)

  if (!isToday(date)) {
    ElMessage({
      message: 'Can only check off today\'s habits',
      type: 'warning',
    })
    return
  }

  // Check if within reminder time valid range
  const timeCheck = isWithinReminderWindow(habit)
  if (!timeCheck.valid) {
    ElMessage({
      message: timeCheck.message,
      type: 'warning',
    })
    return
  }

  await toggleHabitComplete(habitId, date)
  const updatedHabits = await getHabits()
  console.log('[DEBUG] Dashboard: Emitting updated habits:', updatedHabits)
  emit('update:habits', updatedHabits)
}

const getHabitIcon = (habit) => {
  // 优先使用保存的 icon，如果没有则根据名称返回默认图标
  if (habit.icon) {
    return habit.icon
  }
  const icons = {
    'Morning Exercise': '🏃‍♂️',
    'Read a Book': '📚',
    'Drink Water': '💧',
    'Meditate': '🧘‍♀️'
  }
  return icons[habit.name] || '📝'
}

// 导出数据
const handleExport = async () => {
  const success = await exportData()
  if (success) {
    ElMessage({
      message: 'Data exported successfully!',
      type: 'success',
    })
  }
}

// Check if current time is within ±1 Hour of reminder time
const checkReminderWindow = () => {
  // 只在页面第一次打开时检查，使用 sessionStorage 记录
  const hasShownReminder = sessionStorage.getItem('hasShownReminder')
  if (hasShownReminder === 'true') {
    return
  }
  sessionStorage.setItem('hasShownReminder', 'true')

  const habits = props.habits
  if (!habits || habits.length === 0) return

  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const currentTimeInMinutes = currentHour * 60 + currentMinute
  // 使用本地时间格式化，避免时区问题
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const currentDayIndex = now.getDay()

  const habitsToTrack = []

  for (const habit of habits) {
    // 检查今天是否可跟踪
    if (!habit.daysPerWeek || habit.daysPerWeek.length === 0 || 
        habit.daysPerWeek.includes(currentDayIndex.toString())) {
      
      // 检查今天是否已完成
      const isCompletedToday = habit.completedDates?.includes(today)
      
      if (isCompletedToday) continue // 已完成，跳过

      // 检查是否在提醒时间范围内
      if (habit.reminders && habit.reminders.length > 0) {
        for (const reminderTime of habit.reminders) {
          if (!reminderTime) continue

          const [reminderHour, reminderMinute] = reminderTime.split(':').map(Number)
          const reminderTimeInMinutes = reminderHour * 60 + reminderMinute

          let timeDiff = currentTimeInMinutes - reminderTimeInMinutes
          if (timeDiff > 720) timeDiff -= 1440
          else if (timeDiff < -720) timeDiff += 1440

          if (Math.abs(timeDiff) <= 60) {
            habitsToTrack.push(habit.name)
            break
          }
        }
      } else {
        // 没有设置提醒时间，也加入提示
        habitsToTrack.push(habit.name)
      }
    }
  }

  if (habitsToTrack.length > 0) {
    const message = habitsToTrack.length === 1
      ? `Time to track: ${habitsToTrack[0]}!`
      : `Time to track ${habitsToTrack.length} habits: ${habitsToTrack.join(', ')}!`
    
    ElMessage({
      message: message,
      type: 'info',
      duration: 5000,
    })
  }
}

// 页面加载时检查
onMounted(() => {
  checkReminderWindow()
})
</script>

<template>
  <div class="dashboard-header">
    <el-button type="primary" @click="handleExport" :icon="Download">
      Export
    </el-button>
  </div>

  <el-card class="habits-container" shadow="hover">
      <el-table :data="props.habits" stripe style="width: 100%;" :row-key="(row) => row.id"
        @row-click="(row) => toggleHabitExpand(row.id)" :expanded-row-keys="[expandedHabitId]">
        <!-- Habit Column -->
        <el-table-column label="Habit" min-width="200">
          <template #default="{ row }">
            <div class="habit-info">
              <span class="habit-icon">{{ getHabitIcon(row) }}</span>
              <span class="habit-name">{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>

        <!-- Day Columns (v-for) -->
        <el-table-column
          v-for="(label, index) in weekDayLabels"
          :key="label"
          :label="label"
          width="50"
          align="center"
        >
          <template #header-cell="scope">
            <div class="header-cell day-column" :class="{ 'current-day': index === currentDayIndex.value }">
              {{ scope.column.label }}
            </div>
          </template>
          <template #default="{ row }">
            <div class="table-cell day-column" :class="{ 'current-day-column': index === currentDayIndex.value }">
              <div class="day-icon" :class="{
                'completed': isHabitCompletedOnDate(row, weekDates[index]),
                'current-day-icon': index === currentDayIndex.value,
                'disabled': !isDayEnabled(row, index)
              }" @click="isDayEnabled(row, index) && toggleDay(row.id, index)">
                <span v-if="isHabitCompletedOnDate(row, weekDates[index])">✓</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- Weekly Column -->
        <el-table-column label="Weekly" width="100" align="center">
          <template #default="{ row }">
            <div class="weekly-info">
              <el-tag type="warning">
                <el-icon>
                  <Star />
                </el-icon> {{ calculateWeekly(row) }} days
              </el-tag>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: `${Math.min((calculateWeekly(row) / calculateWeeklyTotal(row)) * 100, 100)}%` }"></div>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- Expandable Row Column -->
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="detail-item">
              <span class="detail-label">Description:</span>
              <span class="detail-value">{{ row.description || 'No description' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Created At:</span>
              <span class="detail-value">{{ new Date(row.createdAt).toLocaleString() }}</span>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
</template>

<style scoped>
:deep(.el-table__expanded-cell) {
  padding: 10px;
}
.dashboard-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

/* 增加表格行高 */
:deep(.el-table__row) {
  height: 70px !important;
}

:deep(.el-table__row .cell) {
  padding: 10px 0;
}

/* 确保表头和表格单元格对齐 */
.header-cell,
.table-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
}

/* 当前天的列背景 */
.header-cell.current-day {
  background-color: var(--primary-color);
  color: white;
  border-radius: 4px;
}

.table-cell.current-day-column {
  background-color: rgba(var(--primary-color-rgb), 0.05);
}

.day-icon {
  width: 32px;
  height: 32px;
  border: 2px solid var(--border-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
  background-color: white;
}

.day-icon:hover {
  border-color: var(--primary-color);
}

.day-icon.disabled {
  background-color: var(--bg-tertiary);
  border-color: var(--border-color);
  cursor: not-allowed;
  opacity: 0.5;
}

.day-icon.disabled:hover {
  border-color: var(--border-color);
}

.day-icon.completed {
  background-color: var(--success-color);
  border-color: var(--success-color);
  color: white;
  font-weight: bold;
}

.day-icon.current-day-icon {
  border-color: var(--primary-color);
  background-color: rgba(var(--primary-color-rgb), 0.1);
}

.weekly-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.progress-bar {
  width: 100%;
  max-width: 80px;
  height: 4px;
  background-color: var(--border-color);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--warning-color);
  transition: width 0.3s ease;
}

:deep(.el-table__expanded-cell) {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
