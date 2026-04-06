<script setup>
import { ref, computed, watch } from 'vue'
import CompletionTrend from './charts/CompletionTrend.vue'
import CompleteRate from './charts/CompleteRate.vue'
import MaxStreakDays from './charts/MaxStreakDays.vue'
import HabitHeatmap from './charts/HabitHeatmap.vue'

// 接收习惯数据作为 props
const props = defineProps({
  habits: {
    type: Array,
    default: () => []
  }
})

// 当前选中的 habit，默认选择第一个
const selectedHabitId = ref('all') // 默认为 'all' 表示所有习惯
const dateRange = ref('30') // 默认 Last 30 Days

// 监听 habits 变化，但不自动选择，默认就是 'all'
watch(() => props.habits, (newHabits) => {
  // 保持默认值 'all'
}, { immediate: true })

// 计算总体统计数据
const stats = computed(() => {
  if (!props.habits || props.habits.length === 0) {
    return {
      currentStreak: 0,
      completionRate: 0,
      totalCheckins: 0
    }
  }

  // 根据选中的习惯计算
  const habitsToCalculate = selectedHabitId.value && selectedHabitId.value !== 'all'
    ? props.habits.filter(h => h.id === selectedHabitId.value)
    : props.habits

  const isAllHabits = selectedHabitId.value === 'all' || !selectedHabitId.value

  // 计算日期范围
  const today = new Date()
  const daysToSubtract = parseInt(dateRange.value) || 30
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - daysToSubtract)

  let totalCheckins = 0
  let maxStreak = 0

  if (isAllHabits && props.habits.length > 0) {
    // All Habits 模式：统计所有习惯都完成的天数
    const allDates = new Set()
    
    // 收集所有日期
    props.habits.forEach(habit => {
      if (!habit.completedDates) return
      
      habit.completedDates.forEach(dateStr => {
        const datePart = dateStr.split(' ')[0]
        const checkinDate = new Date(datePart)
        if (checkinDate >= startDate && checkinDate <= today) {
          allDates.add(datePart)
        }
      })
    })

    // 检查每一天是否所有习惯都完成了
    let completedDays = []
    allDates.forEach(dateStr => {
      const allCompleted = props.habits.every(habit => {
        if (!habit.completedDates) return false
        return habit.completedDates.some(d => d.startsWith(dateStr))
      })
      
      if (allCompleted) {
        completedDays.push(dateStr)
      }
    })

    totalCheckins = completedDays.length

    // 计算连续天数（所有习惯都完成的天数）
    // 需要考虑某天没有习惯需要打卡的情况
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
        // 检查昨天是否所有习惯都不需要打卡
        const yesterdayStr = yesterday.toISOString().split('T')[0]
        const hasHabitsYesterday = props.habits.some(habit => {
          if (!habit.daysPerWeek || habit.daysPerWeek.length === 0) {
            return true // 没有配置，默认每天都需要
          }
          const dayOfWeek = yesterday.getDay().toString()
          return habit.daysPerWeek.includes(dayOfWeek)
        })
        
        if (!hasHabitsYesterday) {
          // 昨天没有习惯需要打卡，继续检查前天
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
          // 连续的天数
          streak++
        } else if (diffDays > 1) {
          // 中间有间隔，检查间隔的天是否所有习惯都不需要打卡
          let hasSkippedDays = true
          for (let j = 1; j < diffDays; j++) {
            const skipDate = new Date(prevDate)
            skipDate.setDate(skipDate.getDate() + j)
            const skipDateStr = skipDate.toISOString().split('T')[0]
            
            // 检查这天是否有习惯需要打卡
            const hasHabitsOnSkipDay = props.habits.some(habit => {
              if (!habit.daysPerWeek || habit.daysPerWeek.length === 0) {
                return true // 没有配置，默认每天都需要
              }
              const dayOfWeek = skipDate.getDay().toString()
              return habit.daysPerWeek.includes(dayOfWeek)
            })
            
            if (hasHabitsOnSkipDay) {
              // 这天有习惯需要打卡，但没有完成，streak 断了
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
    // 单个习惯模式
    habitsToCalculate.forEach(habit => {
      if (!habit.completedDates) return

      // 过滤日期范围内的打卡记录
      const filteredDates = habit.completedDates.filter(dateStr => {
        const checkinDate = new Date(dateStr.split(' ')[0])
        return checkinDate >= startDate && checkinDate <= today
      })

      totalCheckins += filteredDates.length

      // 计算连续打卡天数
      if (filteredDates.length > 0) {
        const sortedDates = [...filteredDates].sort((a, b) => {
          return new Date(b.split(' ')[0]) - new Date(a.split(' ')[0])
        })

        let streak = 1
        const lastCheckin = new Date(sortedDates[0].split(' ')[0])
        const isToday = lastCheckin.toDateString() === today.toDateString()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        const isYesterday = lastCheckin.toDateString() === yesterday.toDateString()

        if (!isToday && !isYesterday) {
          streak = 0
        }

        for (let i = 1; i < sortedDates.length; i++) {
          const currentDate = new Date(sortedDates[i - 1].split(' ')[0])
          const prevDate = new Date(sortedDates[i].split(' ')[0])
          const diffDays = (currentDate - prevDate) / (1000 * 60 * 60 * 24)

          if (diffDays === 1) {
            streak++
          } else {
            break
          }
        }

        maxStreak = Math.max(maxStreak, streak)
      }
    })
  }

  // 计算完成率
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
    return null // All habits
  }
  return props.habits.find(h => h.id === selectedHabitId.value)
})

// 监听日期范围变化，重新计算统计数据
watch(dateRange, () => {
  // stats 是 computed，会自动重新计算
})
</script>

<template>
  <!-- 顶部控制栏 -->
  <div class="stats-header">
    <div class="header-left">
        <el-select v-model="selectedHabitId" placeholder="Select Habit" class="habit-select">
          <el-option label="All Habits" value="all" />
          <el-option
            v-for="habit in props.habits"
            :key="habit.id"
            :label="habit.name"
            :value="habit.id"
          >
            <span>{{ habit.icon || '📊' }} {{ habit.name }}</span>
          </el-option>
        </el-select>
        <el-select v-model="dateRange" placeholder="Date Range" class="date-select">
          <el-option label="Last 7 Days" value="7" />
          <el-option label="Last 30 Days" value="30" />
          <el-option label="Last 90 Days" value="90" />
          <el-option label="Last 365 Days" value="365" />
        </el-select>
      </div>
  </div>

  <!-- 统计卡片 -->
  <div class="stats-cards">
    <div class="stat-card">
      <div class="stat-icon streak">🔥</div>
      <div class="stat-content">
        <div class="stat-label">Current Streak</div>
        <div class="stat-value">{{ stats.currentStreak }} days</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon rate">✅</div>
      <div class="stat-content">
        <div class="stat-label">Completion Rate</div>
        <div class="stat-value">{{ stats.completionRate }}%</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon total">📅</div>
      <div class="stat-content">
        <div class="stat-label">Total Checkins</div>
        <div class="stat-value">{{ stats.totalCheckins }}</div>
      </div>
    </div>
  </div>

  <!-- 图表区域 -->
  <div class="charts-grid">
    <!-- Completion Trend -->
    <div class="chart-card wide">
      <h3 class="chart-title">Completion Trend</h3>
      <CompletionTrend 
        v-if="(selectedHabit || isAllHabits)" 
        :habit="selectedHabit" 
        :habits="props.habits"
        :date-range="dateRange"
        :is-all-habits="isAllHabits"
      />
      <div v-if="!selectedHabit && !isAllHabits" class="no-habit-tip">Overall statistics for all habits</div>
    </div>

    <!-- Habit Heatmap -->
    <div class="chart-card wide">
      <h3 class="chart-title">Habit Heatmap</h3>
      <HabitHeatmap 
        v-if="(selectedHabit || isAllHabits)" 
        :habit="selectedHabit" 
        :habits="props.habits"
        :date-range="dateRange"
        :is-all-habits="isAllHabits"
      />
      <div v-if="!selectedHabit && !isAllHabits" class="no-habit-tip">Overall statistics for all habits</div>
    </div>

    <!-- Complete Rate -->
    <div class="chart-card">
      <h3 class="chart-title">Completion Rate</h3>
      <CompleteRate v-if="selectedHabit" :habit="selectedHabit" />
      <div v-else class="no-habit-tip">Overall statistics for all habits</div>
    </div>

    <!-- Max Streak Days -->
    <div class="chart-card">
      <h3 class="chart-title">Max Streak Days</h3>
      <MaxStreakDays v-if="selectedHabit" :habit="selectedHabit" />
      <div v-else class="no-habit-tip">Overall statistics for all habits</div>
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
  box-shadow: 0 0 0 1px #3270ca inset !important;
}

:deep(.el-select-dropdown__item.selected) {
  color: #3270ca !important;
  font-weight: 600;
  background-color: #e8f0fe;
}

:deep(.el-select-dropdown__item:hover) {
  background-color: #f5f7fa;
}

:deep(.dark-mode .el-select-dropdown__item.selected) {
  color: #3270ca !important;
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
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.dark-mode .stat-card {
  background: #2d2d2d;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
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
  color: #666;
  margin-bottom: 4px;
}

.dark-mode .stat-label {
  color: #999;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.dark-mode .stat-value {
  color: #fff;
}

/* 图表网格 */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.chart-card {
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  padding: 10px;
}

.dark-mode .chart-card {
  background: #2d2d2d;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.chart-card.wide {
  grid-column: span 2;
}

.chart-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
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
  color: #999;
  transition: all 0.2s;
  background: transparent;
}

.toggle-btn.active {
  color: #3270ca;
  font-weight: 600;
}

.dark-mode .toggle-btn {
  color: #666;
}

.dark-mode .toggle-btn.active {
  background: transparent;
  color: #3270ca;
}

.dark-mode .chart-title {
  color: #e0e0e0;
}

.no-habit-tip {
  padding: 40px 20px;
  text-align: center;
  color: #999;
  font-size: 14px;
}

.dark-mode .no-habit-tip {
  color: #666;
}

/* 响应式 */
@media (max-width: 1024px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }

  .chart-card.wide {
    grid-column: span 1;
  }
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

  .stat-card {
    padding: 5px;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }

  .stat-value {
    font-size: 20px;
  }
}
</style>
