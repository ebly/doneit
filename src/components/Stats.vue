<script setup>
import { ref, computed, watch } from 'vue'
import CompletionTrend from './charts/CompletionTrend.vue'
import CompleteRate from './charts/CompleteRate.vue'
import MaxStreakDays from './charts/MaxStreakDays.vue'
import HabitHeatmap from './charts/HabitHeatmap.vue'
import CompletionRatio from './charts/CompletionRatio.vue'
import HabitRankings from './charts/HabitRankings.vue'
import { useI18n, registerLocale } from '../utils/i18n.js'
import { useSettings } from '../composables/useSettings.js'
import en from '../locales/en.js'
import zh from '../locales/zh.js'

registerLocale('en', en)
registerLocale('zh', zh)

const formatDateToLocal = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const props = defineProps({
  habits: {
    type: Array,
    default: () => []
  }
})

const { language } = useSettings()
const { t, currentLang } = useI18n()

watch(() => language.value, (newVal) => {
  currentLang.value = newVal
}, { immediate: true })

const selectedHabitId = ref('all')
const dateRange = ref('30')
const chartKey = ref(Date.now())

watch([selectedHabitId, dateRange], () => {
  chartKey.value = Date.now()
})

watch(() => props.habits, (newHabits, oldHabits) => {
}, { immediate: true, deep: true })

const stats = computed(() => {
  if (!props.habits || props.habits.length === 0) {
    return {
      currentStreak: 0,
      completionRate: 0,
      totalCheckins: 0
    }
  }

  const habitsToCalculate = selectedHabitId.value && selectedHabitId.value !== 'all'
    ? props.habits.filter(h => h.id === selectedHabitId.value)
    : props.habits

  const isAllHabits = selectedHabitId.value === 'all' || !selectedHabitId.value

  const today = new Date()
  const daysToSubtract = parseInt(dateRange.value) || 30
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - daysToSubtract)

  let totalCheckins = 0
  let maxStreak = 0
  
  if (isAllHabits && props.habits.length > 0) {
    const allDates = new Set()
    
    props.habits.forEach(habit => {
      if (!habit.completedDates) return
      
      habit.completedDates.forEach(dateStr => {
        const datePart = dateStr.split(' ')[0]
        const [year, month, day] = datePart.split('-').map(Number)
        const checkinDate = new Date(year, month - 1, day)
        
        const startDateMidnight = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
        const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        
        if (checkinDate >= startDateMidnight && checkinDate <= todayMidnight) {
          allDates.add(datePart)
        }
      })
    })

    let completedDays = []
    allDates.forEach(dateStr => {
      const allCompleted = props.habits.every(habit => {
        if (!habit.completedDates) return false
        return habit.completedDates.some(d => {
          const datePart = d.split(' ')[0]
          return datePart === dateStr
        })
      })
      
      if (allCompleted) {
        completedDays.push(dateStr)
      }
    })

    totalCheckins = completedDays.length

    if (completedDays.length > 0) {
      const sortedDays = [...completedDays].sort((a, b) => {
        return new Date(b) - new Date(a)
      })

      let streak = 1
      const lastDay = new Date(sortedDays[0])
      const isToday = lastDay.toDateString() === today.toDateString()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const isYesterday = lastDay.toDateString() === yesterday.toDateString()

      if (!isToday && !isYesterday) {
        const yesterdayStr = formatDateToLocal(yesterday)
        const hasHabitsYesterday = props.habits.some(habit => {
          if (!habit.daysPerWeek || habit.daysPerWeek.length === 0) {
            return true
          }
          const dayOfWeek = yesterday.getDay().toString()
          return habit.daysPerWeek.includes(dayOfWeek)
        })
        
        if (!hasHabitsYesterday) {
          const dayBeforeYesterday = new Date(yesterday)
          dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 1)
          const isDayBeforeYesterdayInCompleted = completedDays.some(d => {
            return new Date(d).toDateString() === dayBeforeYesterday.toDateString()
          })
          
          if (!isDayBeforeYesterdayInCompleted) {
            streak = 0
          }
        } else {
          streak = 0
        }
      }

      for (let i = 1; i < sortedDays.length; i++) {
        const currentDate = new Date(sortedDays[i - 1])
        const prevDate = new Date(sortedDays[i])
        const diffDays = Math.round((currentDate - prevDate) / (1000 * 60 * 60 * 24))

        if (diffDays === 1) {
          streak++
        } else if (diffDays > 1) {
          let hasSkippedDays = true
          for (let j = 1; j < diffDays; j++) {
            const skipDate = new Date(prevDate)
            skipDate.setDate(skipDate.getDate() + j)
            const skipDateStr = formatDateToLocal(skipDate)
            
            const hasHabitsOnSkipDay = props.habits.some(habit => {
              if (!habit.daysPerWeek || habit.daysPerWeek.length === 0) {
                return true
              }
              const dayOfWeek = skipDate.getDay().toString()
              return habit.daysPerWeek.includes(dayOfWeek)
            })
            
            if (hasHabitsOnSkipDay) {
              hasSkippedDays = false
              break
            }
          }
          
          if (hasSkippedDays) {
            streak++
          } else {
            break
          }
        } else {
          break
        }
      }

      maxStreak = streak
    }
  } else {
    habitsToCalculate.forEach(habit => {
      if (!habit.completedDates) return

      const filteredDates = habit.completedDates.filter(dateStr => {
        const datePart = dateStr.split(' ')[0]
        const [year, month, day] = datePart.split('-').map(Number)
        const checkinDate = new Date(year, month - 1, day)
        
        const startDateMidnight = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
        const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        
        return checkinDate >= startDateMidnight && checkinDate <= todayMidnight
      })

      totalCheckins += filteredDates.length

      if (filteredDates.length > 0) {
        const sortedDates = [...filteredDates].sort((a, b) => {
          return new Date(b.split(' ')[0]) - new Date(a.split(' ')[0])
        })

        let streak = 1
        const lastCheckinDate = new Date(sortedDates[0].split(' ')[0])
        const isTodayChecked = lastCheckinDate.toDateString() === today.toDateString()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        const isYesterdayChecked = lastCheckinDate.toDateString() === yesterday.toDateString()

        if (!isTodayChecked && !isYesterdayChecked) {
          const todayDayIndex = today.getDay().toString()
          const isTodayRequired = !habit.daysPerWeek || habit.daysPerWeek.length === 0 || habit.daysPerWeek.includes(todayDayIndex)
          
          if (isTodayRequired) {
            const yesterdayDayIndex = yesterday.getDay().toString()
            const isYesterdayRequired = !habit.daysPerWeek || habit.daysPerWeek.length === 0 || habit.daysPerWeek.includes(yesterdayDayIndex)
            if (isYesterdayRequired) {
              streak = 0
            }
          }
        }

        for (let i = 1; i < sortedDates.length; i++) {
          const currentDate = new Date(sortedDates[i - 1].split(' ')[0])
          const prevDate = new Date(sortedDates[i].split(' ')[0])
          const diffDays = Math.round((currentDate - prevDate) / (1000 * 60 * 60 * 24))

          if (diffDays === 1) {
            streak++
          } else if (diffDays > 1) {
            let hasSkippedRequiredDays = false
            for (let j = 1; j < diffDays; j++) {
              const skipDate = new Date(prevDate)
              skipDate.setDate(skipDate.getDate() + j)
              const skipDayIndex = skipDate.getDay().toString()
              const isSkipRequired = !habit.daysPerWeek || habit.daysPerWeek.length === 0 || habit.daysPerWeek.includes(skipDayIndex)
              if (isSkipRequired) {
                hasSkippedRequiredDays = true
                break
              }
            }
            if (hasSkippedRequiredDays) {
              break
            }
            streak++
          } else {
            break
          }
        }

        maxStreak = Math.max(maxStreak, streak)
      }
    })
  }

  const totalPossibleDays = daysToSubtract
  const completionRate = totalPossibleDays > 0
    ? Math.round((totalCheckins / totalPossibleDays) * 100)
    : 0

  return {
    currentStreak: maxStreak,
    completionRate: Math.min(100, completionRate),
    totalCheckins
  }
})

const isAllHabits = computed(() => {
  return selectedHabitId.value === 'all' || !selectedHabitId.value
})

const selectedHabit = computed(() => {
  if (isAllHabits.value) {
    return null
  }
  return props.habits.find(h => h.id === selectedHabitId.value)
})

watch(dateRange, () => {
})
</script>

<template>
  <!-- 顶部控制栏 -->
  <div class="stats-header">
    <div class="header-left">
        <el-select v-model="selectedHabitId" :placeholder="t('stats.selectHabit')" class="habit-select">
          <el-option :label="t('stats.allHabits')" value="all" />
          <el-option
            v-for="habit in props.habits"
            :key="habit.id"
            :label="habit.name"
            :value="habit.id"
          >
            <span>{{ habit.icon || '📊' }} {{ habit.name }}</span>
          </el-option>
        </el-select>
        <el-select v-model="dateRange" :placeholder="t('stats.selectHabit')" class="date-select">
          <el-option :label="t('stats.last7Days')" value="7" />
          <el-option :label="t('stats.last30Days')" value="30" />
          <el-option :label="t('stats.last90Days')" value="90" />
          <el-option :label="t('stats.last365Days')" value="365" />
        </el-select>
      </div>
  </div>

  <!-- 统计卡片 -->
  <div class="stats-cards">
    <div class="stat-card">
      <div class="stat-icon streak">🔥</div>
      <div class="stat-content">
        <div class="stat-label">{{ t('stats.currentStreak') }}</div>
        <div class="stat-value">{{ stats.currentStreak }} {{ t('dashboard.days') }}</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon rate">✅</div>
      <div class="stat-content">
        <div class="stat-label">{{ t('stats.completionRate') }}</div>
        <div class="stat-value">{{ stats.completionRate }}%</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon total">📅</div>
      <div class="stat-content">
        <div class="stat-label">{{ t('stats.totalCheckins') }}</div>
        <div class="stat-value">{{ stats.totalCheckins }}</div>
      </div>
    </div>
  </div>

  <!-- 图表区域 -->
  <div class="charts-grid">
    <!-- Completion Trend -->
    <div class="chart-card wide">
      <h3 class="chart-title">{{ t('stats.completionTrend') }}</h3>
      <CompletionTrend 
        v-if="(isAllHabits || selectedHabit) && props.habits && props.habits.length > 0"
        :key="`trend-${chartKey}`"
        :habit="selectedHabit" 
        :habits="props.habits"
        :date-range="dateRange"
        :is-all-habits="isAllHabits"
      />
      <div v-else-if="props.habits && props.habits.length === 0" class="no-habit-tip">{{ t('stats.noHabitsYet') }}</div>
      <div v-else class="no-habit-tip">{{ t('stats.overallStats') }}</div>
    </div>

    <!-- Habit Heatmap -->
    <div class="chart-card wide">
      <h3 class="chart-title">{{ t('stats.habitHeatmap') }}</h3>
      <HabitHeatmap 
        v-if="(isAllHabits || selectedHabit) && props.habits && props.habits.length > 0"
        :key="`heatmap-${chartKey}`" 
        :habit="selectedHabit" 
        :habits="props.habits"
        :date-range="dateRange"
        :is-all-habits="isAllHabits"
      />
      
      <div v-else-if="props.habits && props.habits.length === 0" class="no-habit-tip">{{ t('stats.noHabitsYet') }}</div>
      <div v-else class="no-habit-tip">{{ t('stats.overallStats') }}</div>
    </div>

    <!-- Completion Ratio -->
    <div class="chart-card">
      <h3 class="chart-title">{{ t('stats.completionRatio') }}</h3>
      <CompletionRatio 
        v-if="(isAllHabits || selectedHabit) && props.habits && props.habits.length > 0"
        :habit="selectedHabit" 
        :habits="props.habits"
        :date-range="dateRange"
        :is-all-habits="isAllHabits"
      />
      <div v-else-if="props.habits && props.habits.length === 0" class="no-habit-tip">{{ t('stats.noHabitsYet') }}</div>
      <div v-else class="no-habit-tip">{{ t('stats.overallStats') }}</div>
    </div>

    <!-- Habit Rankings -->
    <div class="chart-card">
      <h3 class="chart-title">{{ t('stats.habitRankings') }}</h3>
      <HabitRankings 
        v-if="(isAllHabits || selectedHabit) && props.habits && props.habits.length > 0"
        :habits="props.habits"
        :date-range="dateRange"
      />
      <div v-else-if="props.habits && props.habits.length === 0" class="no-habit-tip">{{ t('stats.noHabitsYet') }}</div>
      <div v-else class="no-habit-tip">{{ t('stats.overallStats') }}</div>
    </div>

    <!-- Complete Rate -->
    <div class="chart-card">
      <h3 class="chart-title">{{ t('stats.completionRate') }}</h3>
      <CompleteRate v-if="selectedHabit" :habit="selectedHabit" />
      <div v-else class="no-habit-tip">{{ t('stats.overallStats') }}</div>
    </div>

    <!-- Max Streak Days -->
    <div class="chart-card">
      <h3 class="chart-title">{{ t('stats.currentStreak') }}</h3>
      <MaxStreakDays v-if="selectedHabit" :habit="selectedHabit" />
      <div v-else class="no-habit-tip">{{ t('stats.overallStats') }}</div>
    </div>
  </div>
</template>

<style scoped>
.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  gap: 12px;
}

.habit-select,
.date-select {
  width: 180px;
}

/* 覆盖 Element Plus 选框的蓝色 */
:deep(.el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 1px var(--primary-color) inset !important;
}

:deep(.el-select-dropdown__item.selected) {
  color: var(--primary-color) !important;
  font-weight: 600;
  background-color: var(--bg-tertiary);
}

:deep(.el-select-dropdown__item:hover) {
  background-color: var(--bg-tertiary);
}

:deep(.dark-mode .el-select-dropdown__item.selected) {
  color: var(--primary-color) !important;
  background-color: rgba(50, 112, 202, 0.2);
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px;
  background: var(--bg-secondary);
  border-radius: 4px;
  box-shadow: var(--shadow-md);
}

.stat-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 24px;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.dark-mode .stat-label {
  color: var(--text-light);
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
}

.dark-mode .stat-value {
  color: var(--text-primary);
}

/* 图表网格 */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.chart-card {
  background: var(--bg-secondary);
  border-radius: 4px;
  box-shadow: var(--shadow-sm);
  padding: 10px;
}

.chart-card.wide {
  grid-column: span 2;
}

.chart-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 10px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.chart-toggle {
  display: flex;
  gap: 8px;
}

.toggle-btn {
  font-size: 12px;
  border: none;
  cursor: pointer;
  color: var(--text-light);
  transition: all 0.2s;
  background: transparent;
}

.toggle-btn.active {
  color: var(--primary-color);
  font-weight: 600;
}

.dark-mode .toggle-btn {
  color: var(--text-secondary);
}

.dark-mode .toggle-btn.active {
  background: transparent;
  color: var(--primary-color);
}

.dark-mode .chart-title {
  color: var(--text-primary);
}

.no-habit-tip {
  padding: 40px 20px;
  text-align: center;
  color: var(--text-light);
  font-size: 14px;
}

.dark-mode .no-habit-tip {
  color: var(--text-disabled);
}

@media (max-width: 768px) {
  .stats-page {
    padding: 12px;
  }

  .stats-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .header-left {
    flex-wrap: wrap;
  }

  .habit-select,
  .date-select {
    flex: 1;
    min-width: 140px;
  }

  .stats-cards {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .stat-card {
    padding: 12px;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }

  .stat-value {
    font-size: 20px;
  }

  .charts-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .chart-card.wide {
    grid-column: span 1;
  }

  .chart-card {
    padding: 12px;
  }

  .chart-title {
    font-size: 14px;
  }
}
</style>
