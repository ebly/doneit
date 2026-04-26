<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Star, Download, Calendar, Check, ChatDotRound } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getHabits, toggleHabitComplete, exportData } from '../services/storage.js'
import { useI18n, registerLocale } from '../utils/i18n.js'
import { useSettings } from '../composables/useSettings.js'
import en from '../locales/en.js'
import zh from '../locales/zh.js'

registerLocale('en', en)
registerLocale('zh', zh)

const props = defineProps({
  habits: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:habits'])

const { language } = useSettings()
const { t, currentLang } = useI18n()

watch(() => language.value, (newVal) => {
  currentLang.value = newVal
}, { immediate: true })

const activeTab = ref('today')
const expandedHabitId = ref(null)

const toggleHabitExpand = (habitId) => {
  expandedHabitId.value = expandedHabitId.value === habitId ? null : habitId
}

const today = computed(() => new Date())
const currentDayIndex = ref(new Date().getDay())

const motivations = {
  en: [
    'Make a little progress every day, and you will thank yourself later.',
    'Persistence is victory, you are already great!',
    'Good habits are the foundation of success, keep it up!',
    'Today\'s effort is tomorrow\'s harvest.',
    'Every step counts, don\'t give up!',
    'You are better than yesterday, keep it up!',
    'Self-discipline gives me freedom, persistence achieves dreams.'
  ],
  zh: [
    '每天进步一点点，未来会感谢现在的自己。',
    '坚持就是胜利，你已经很棒了！',
    '好习惯是成功的基石，继续加油！',
    '今天的努力，是明天的收获。',
    '每一步都算数，不要放弃！',
    '你比昨天更优秀，继续保持！',
    '自律给我自由，坚持成就梦想。'
  ]
}

const dailyMotivation = computed(() => {
  const lang = currentLang.value || 'en'
  const langMotivations = motivations[lang] || motivations.en
  const dayOfYear = Math.floor((today.value - new Date(today.value.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24))
  return langMotivations[dayOfYear % langMotivations.length]
})

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

const weekDayLabels = computed(() => t.value('days'))

const weekDates = computed(() => getCurrentWeekDates())

const isHabitCompletedOnDate = (habit, date) => {
  if (!habit.completedDates) return false
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const dateStr = `${year}-${month}-${day}`
  return habit.completedDates.some(d => {
    const datePart = d.split(' ')[0]
    return datePart === dateStr
  })
}

const calculateWeeklyTotal = (habit) => {
  if (!habit.daysPerWeek || habit.daysPerWeek.length === 0) {
    return 7
  }

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

const calculateWeekly = (habit) => {
  if (!habit.completedDates || habit.completedDates.length === 0) {
    return 0
  }

  const today = new Date()
  const currentDay = today.getDay()
  const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - currentDay)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  let weekly = 0
  const checkedDates = new Set()

  for (const dateStr of habit.completedDates) {
    const [datePart, timePart] = dateStr.split(' ')
    const [year, month, day] = datePart.split('-').map(Number)
    const checkinDateOnly = new Date(year, month - 1, day)
    
    if (checkinDateOnly >= weekStart && checkinDateOnly <= weekEnd) {
      const dateKey = datePart
      if (!checkedDates.has(dateKey)) {
        checkedDates.add(dateKey)
        weekly++
      }
    }
  }

  return weekly
}

const isDayEnabled = (habit, dayIndex) => {
  if (!habit.daysPerWeek || habit.daysPerWeek.length === 0) {
    return true
  }
  return habit.daysPerWeek.includes(dayIndex.toString())
}

const isToday = (date) => {
  const today = new Date()
  return date.getFullYear() === today.getFullYear() &&
         date.getMonth() === today.getMonth() &&
         date.getDate() === today.getDate()
}

const isWithinReminderWindow = (habit) => {
  if (!habit.reminders || habit.reminders.length === 0) {
    return { valid: true }
  }

  const now = new Date()
  const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes()

  for (const reminderTime of habit.reminders) {
    if (!reminderTime) continue
    const [reminderHour, reminderMinute] = reminderTime.split(':').map(Number)
    const reminderTimeInMinutes = reminderHour * 60 + reminderMinute
    const timeDiff = Math.abs(currentTimeInMinutes - reminderTimeInMinutes)
    const adjustedDiff = Math.min(timeDiff, 1440 - timeDiff)
    if (adjustedDiff <= 60) {
      return { valid: true }
    }
  }

  const earliestReminder = habit.reminders[0]
  const [earliestHour] = earliestReminder.split(':').map(Number)
  const prevHour = earliestHour === 0 ? 23 : earliestHour - 1
  const nextHour = earliestHour === 23 ? 0 : earliestHour + 1
  
  const currentTimeInMinutes2 = new Date().getHours() * 60 + new Date().getMinutes()
  const earliestInMinutes = earliestHour * 60
  if (currentTimeInMinutes2 < earliestInMinutes - 60) {
    return { valid: false, message: t.value('dashboard.tooEarly').replace('{time}', earliestReminder).replace('{after}', String(prevHour).padStart(2, '0') + ':00') }
  } else {
    return { valid: false, message: t.value('dashboard.tooLate').replace('{time}', earliestReminder).replace('{before}', String(nextHour).padStart(2, '0') + ':00') }
  }
}

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const [hours, minutes] = timeStr.split(':')
  const hour = parseInt(hours)
  if (hour >= 12) {
    if (hour === 12) {
      return `12:${minutes} PM`
    } else {
      return `${hour - 12}:${minutes} PM`
    }
  } else {
    if (hour === 0) {
      return `12:${minutes} AM`
    } else {
      return `${hour}:${minutes} AM`
    }
  }
}

const filteredTodayHabits = computed(() => {
  const todayIndex = new Date().getDay().toString()
  return props.habits.filter(habit => {
    if (!habit.daysPerWeek || habit.daysPerWeek.length === 0) {
      return true
    }
    return habit.daysPerWeek.includes(todayIndex)
  })
})

const todayCompleted = computed(() => {
  return filteredTodayHabits.value.filter(habit => 
    isHabitCompletedOnDate(habit, today.value)
  ).length
})

const todayTotal = computed(() => {
  return filteredTodayHabits.value.length
})

const todayPercentage = computed(() => {
  if (todayTotal.value === 0) return 0
  return Math.round((todayCompleted.value / todayTotal.value) * 100)
})

const toggleTodayHabit = async (habitId) => {
  const habit = props.habits.find(h => h.id === habitId)
  const todayDate = new Date()

  if (!isToday(todayDate)) {
    ElMessage({
      message: t.value('dashboard.canOnlyCheckToday'),
      type: 'warning',
    })
    return
  }

  const timeCheck = isWithinReminderWindow(habit)
  if (!timeCheck.valid) {
    ElMessage({
      message: timeCheck.message,
      type: 'warning',
    })
    return
  }

  await toggleHabitComplete(habitId, todayDate)
  const updatedHabits = await getHabits()
  emit('update:habits', updatedHabits)
}

const toggleDay = async (habitId, dayIndex) => {
  const date = weekDates.value[dayIndex]
  const habit = props.habits.find(h => h.id === habitId)

  if (!isToday(date)) {
    ElMessage({
      message: t.value('dashboard.canOnlyCheckToday'),
      type: 'warning',
    })
    return
  }

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
  emit('update:habits', updatedHabits)
}

const getHabitIcon = (habit) => {
  if (habit.icon) {
    return habit.icon
  }
  const icons = {
    'Morning Exercise': '🏃‍️',
    'Read a Book': '📚',
    'Drink Water': '💧',
    'Meditate': '🧘‍♀️'
  }
  return icons[habit.name] || '📝'
}

const handleExport = async () => {
  const success = await exportData()
  if (success) {
    ElMessage({
      message: t.value('dashboard.exportSuccess'),
      type: 'success',
    })
  }
}

const checkReminderWindow = () => {
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
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const currentDayIndex = now.getDay()

  const habitsToTrack = []

  for (const habit of habits) {
    if (!habit.daysPerWeek || habit.daysPerWeek.length === 0 || 
        habit.daysPerWeek.includes(currentDayIndex.toString())) {
      
      const isCompletedToday = habit.completedDates?.some(d => {
        const datePart = d.split(' ')[0]
        return datePart === today
      })
      
      if (isCompletedToday) continue

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
        habitsToTrack.push(habit.name)
      }
    }
  }

  if (habitsToTrack.length > 0) {
    const message = habitsToTrack.length === 1
      ? t.value('dashboard.timeToTrack').replace('{habits}', habitsToTrack[0])
      : t.value('dashboard.timeToTrackMultiple').replace('{count}', habitsToTrack.length).replace('{habits}', habitsToTrack.join(', '))
    
    ElMessage({
      message: message,
      type: 'info',
      duration: 5000,
    })
  }
}

onMounted(() => {
  checkReminderWindow()
})
</script>

<template>
  <div class="dashboard-container">
    <!-- Export按钮 -->
    <div class="dashboard-header">
      <el-button type="primary" @click="handleExport" :icon="Download">
        {{ t('dashboard.export') }}
      </el-button>
    </div>

    <!-- 标签页切换 -->
    <el-tabs v-model="activeTab" class="dashboard-tabs">
      <el-tab-pane name="today">
        <template #label>
          <span class="tab-label">
            {{ t('dashboard.todayTab') }}
          </span>
        </template>
      </el-tab-pane>
      <el-tab-pane name="week">
        <template #label>
          <span class="tab-label">
            {{ t('dashboard.weekTab') }}
          </span>
        </template>
      </el-tab-pane>
    </el-tabs>

    <!-- 今日打卡统计区（公共） -->
    <div class="today-summary">
      <div class="summary-left">
        <el-icon class="summary-icon"><Calendar /></el-icon>
        <div class="summary-text">
          <h3>{{ t('dashboard.todayCheckin') }}</h3>
          <p>{{ t('dashboard.todayFocus') }}</p>
        </div>
      </div>
      <div class="summary-right">
        <div class="progress-text">
          <span class="completed-count">{{ todayCompleted }}</span>
          <span class="total-count">/{{ todayTotal }}</span>
          <p>{{ t('dashboard.todayCompleted') }}</p>
        </div>
        <div class="progress-ring">
          <svg viewBox="0 0 100 100">
            <circle class="progress-ring-bg" cx="50" cy="50" r="40" />
            <circle 
              class="progress-ring-fill" 
              cx="50" 
              cy="50" 
              r="40"
              :stroke-dasharray="251.2"
              :stroke-dashoffset="251.2 * (1 - todayPercentage / 100)"
            />
          </svg>
          <span class="progress-percentage">{{ todayPercentage }}%</span>
        </div>
      </div>
    </div>

    <!-- 标签页内容区 -->
    <div class="tab-content">
      <!-- 仅今日打卡内容 -->
      <div v-if="activeTab === 'today'" class="today-view">
        <el-empty v-if="filteredTodayHabits.length === 0" :description="t('common.noHabitsForToday')" :image-size="60" />
        <el-table v-else :data="filteredTodayHabits" class="today-table" :show-header="true">
          <el-table-column :label="t('nav.myHabits')" min-width="300">
            <template #default="{ row }">
              <div class="habit-cell">
                <span class="habit-icon">{{ getHabitIcon(row) }}</span>
                <div class="habit-details">
                  <span class="habit-name">{{ row.name }}</span>
                  <span class="habit-time" v-if="row.reminders && row.reminders.length > 0">
                    {{ t('dashboard.suggestedTime') }}：{{ formatTime(row.reminders[0]) }}
                  </span>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column :label="t('dashboard.status')" width="150" align="center">
            <template #default="{ row }">
              <div class="status-cell">
                <div class="check-button" 
                     :class="{ 'completed': isHabitCompletedOnDate(row, today) }"
                     @click="toggleTodayHabit(row.id)">
                  <span v-if="isHabitCompletedOnDate(row, today)">✓</span>
                </div>
                <span class="status-text">
                  {{ isHabitCompletedOnDate(row, today) ? t('dashboard.checked') : t('dashboard.unchecked') }}
                </span>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 所有打卡（按周）内容 -->
      <div v-if="activeTab === 'week'" class="week-view">
        <el-empty v-if="props.habits.length === 0" :description="t('common.noHabitsYetAdd')" image-size="80" />
        <el-card v-else class="habits-container" shadow="hover">
          <el-table :data="props.habits" stripe style="width: 100%;" :row-key="(row) => row.id"
            @row-click="(row) => toggleHabitExpand(row.id)" :expanded-row-keys="[expandedHabitId]">
            <!-- Habit Column -->
            <el-table-column :label="t('nav.myHabits')" min-width="200">
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
                <div class="header-cell day-column" :class="{ 'current-day': index === currentDayIndex }">
                  {{ scope.column.label }}
                </div>
              </template>
              <template #default="{ row }">
                <div class="table-cell day-column" :class="{ 'current-day-column': index === currentDayIndex }">
                  <div class="day-icon" :class="{
                    'completed': isHabitCompletedOnDate(row, weekDates[index]),
                    'current-day-icon': index === currentDayIndex,
                    'disabled': !isDayEnabled(row, index)
                  }" @click="isDayEnabled(row, index) && toggleDay(row.id, index)">
                    <span v-if="isHabitCompletedOnDate(row, weekDates[index])">✓</span>
                  </div>
                </div>
              </template>
            </el-table-column>

            <!-- Weekly Column -->
            <el-table-column :label="t('dashboard.weekly')" width="100" align="center">
              <template #default="{ row }">
                <div class="weekly-info">
                  <el-tag type="warning">
                    <el-icon>
                      <Star />
                    </el-icon> {{ calculateWeekly(row) }} {{ t('dashboard.days') }}
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
                  <span class="detail-label">{{ t('common.description') }}:</span>
                  <span class="detail-value">{{ row.description || t('common.noDescription') }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">{{ t('common.createdAt') }}:</span>
                  <span class="detail-value">{{ new Date(row.createdAt).toLocaleString() }}</span>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>
    </div>

    <!-- 底部鼓励框（公共） -->
    <div class="motivation-box">
      <el-icon class="quote-icon"><ChatDotRound /></el-icon>
      <p class="motivation-text">{{ dailyMotivation }}</p>
      <p class="motivation-author">— {{ t('dashboard.keepGoing') }} —</p>
    </div>
  </div>
</template>

<style scoped>
.dashboard-container {
  background-color: var(--bg-primary);
  min-height: calc(100vh - 60px);
}

.dashboard-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

/* 标签页样式 */
.dashboard-tabs {
  margin-bottom: 0;
}

.dashboard-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
  border-bottom: none;
}

.dashboard-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.dashboard-tabs :deep(.el-tabs__item) {
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 500;
  color: var(--text-secondary);
  border: none;
  background: none;
  transition: all 0.2s;
  text-align: center;
}

.dashboard-tabs :deep(.el-tabs__item:hover) {
  color: var(--primary-color);
}

.dashboard-tabs :deep(.el-tabs__item.is-active) {
  color: var(--primary-color);
  font-weight: 600;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 今日统计区 */
.today-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  margin-bottom: 24px;
}

.summary-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.summary-icon {
  font-size: 32px;
  color: var(--primary-color);
}

.summary-text h3 {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.summary-text p {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
}

.summary-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.progress-text {
  text-align: right;
}

.completed-count {
  font-size: 28px;
  font-weight: 700;
  color: var(--primary-color);
}

.total-count {
  font-size: 18px;
  color: var(--text-secondary);
}

.progress-text p {
  margin: 4px 0 0 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.progress-ring {
  position: relative;
  width: 80px;
  height: 80px;
}

.progress-ring svg {
  transform: rotate(-90deg);
  width: 80px;
  height: 80px;
}

.progress-ring-bg {
  fill: none;
  stroke: var(--border-color);
  stroke-width: 8;
}

.progress-ring-fill {
  fill: none;
  stroke: var(--primary-color);
  stroke-width: 8;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.5s ease;
}

.progress-percentage {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

/* 标签页内容区 */
.tab-content {
  margin-bottom: 24px;
}

/* 今日视图 */
.today-view {
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
}

.today-table {
  background-color: transparent;
}

.today-table :deep(.el-table__header th) {
  background-color: var(--bg-secondary);
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 14px;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}

.today-table :deep(.el-table__row) {
  height: 80px;
}

.today-table :deep(.el-table__row td) {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}

.habit-cell {
  display: flex;
  align-items: center;
  gap: 16px;
}

.habit-icon {
  font-size: 28px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(var(--primary-color-rgb), 0.1);
  border-radius: 8px;
}

.habit-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.habit-name {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
}

.habit-time {
  font-size: 13px;
  color: var(--text-secondary);
}

.status-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.check-button {
  width: 36px;
  height: 36px;
  border: 2px solid var(--border-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  background-color: var(--bg-secondary);
}

.check-button:hover {
  border-color: var(--primary-color);
}

.check-button.completed {
  background-color: var(--success-color);
  border-color: var(--success-color);
  color: white;
  font-weight: bold;
}

.status-text {
  font-size: 13px;
  color: var(--text-secondary);
}

/* 周视图 */
.week-view {
  background-color: var(--bg-primary);
}

.habits-container {
  border-radius: 12px;
}

:deep(.el-table__expanded-cell) {
  padding: 20px;
  background-color: transparent !important;
}

:deep(.el-table__expanded-cell .el-table__cell) {
  display: block;
  width: 100%;
  background-color: transparent;
}

.dark-mode :deep(.el-table__expanded-cell) {
  background-color: transparent;
}

.detail-item {
  display: flex;
  gap: 8px;
  padding: 8px 0;
}

.detail-label {
  font-weight: 600;
  color: var(--text-primary);
  min-width: 120px;
}

.detail-value {
  color: var(--text-secondary);
  flex: 1;
  word-break: break-word;
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
  background-color: var(--bg-secondary);
}

.dark-mode .day-icon {
  background-color: var(--bg-primary);
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

.detail-item {
  display: flex;
  gap: 8px;
  padding: 8px 12px;
  background-color: transparent;
  border-radius: 6px;
}

.detail-label {
  font-weight: 600;
  color: var(--text-primary);
  min-width: 120px;
}

.detail-value {
  color: var(--text-secondary);
  flex: 1;
}

/* 底部鼓励框 */
.motivation-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  background-color: rgba(var(--primary-color-rgb), 0.05);
  border: 1px solid rgba(var(--primary-color-rgb), 0.2);
  border-radius: 12px;
  text-align: center;
}

.quote-icon {
  font-size: 24px;
  color: var(--primary-color);
  margin-bottom: 12px;
}

.motivation-text {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: var(--text-primary);
  line-height: 1.6;
}

.motivation-author {
  margin: 0;
  font-size: 14px;
  color: var(--primary-color);
  font-weight: 500;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .today-summary {
    flex-direction: column;
    gap: 20px;
    padding: 16px;
  }

  .summary-left {
    width: 100%;
  }

  .summary-right {
    width: 100%;
    justify-content: center;
  }

  .today-table :deep(.el-table__row) {
    height: 70px;
  }

  .habit-icon {
    width: 40px;
    height: 40px;
    font-size: 24px;
  }

  .habit-name {
    font-size: 14px;
  }

  .habit-time {
    font-size: 12px;
  }

  .check-button {
    width: 32px;
    height: 32px;
  }

  :deep(.el-table__row) {
    height: 60px !important;
  }

  .day-icon {
    width: 28px;
    height: 28px;
  }

  .weekly-info {
    gap: 4px;
  }

  .progress-bar {
    max-width: 60px;
  }

  .detail-label {
    min-width: 100px;
    font-size: 13px;
  }

  .detail-value {
    font-size: 13px;
  }

  .dashboard-header {
    justify-content: center;
  }

  .dashboard-header .el-button {
    width: 100%;
  }

  .motivation-text {
    font-size: 14px;
  }
}
</style>
