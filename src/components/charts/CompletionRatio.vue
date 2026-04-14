<script setup>
import { computed } from 'vue'
import { useTheme } from '../../composables/useTheme'

const { isDarkMode } = useTheme()

const props = defineProps({
  habit: {
    type: Object,
    default: null
  },
  habits: {
    type: Array,
    default: () => []
  },
  dateRange: {
    type: String,
    default: '30'
  },
  isAllHabits: {
    type: Boolean,
    default: false
  }
})

const formatDateToLocal = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const ratioData = computed(() => {
  const days = parseInt(props.dateRange) || 30
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - days + 1)

  const habits = props.isAllHabits ? props.habits : (props.habit ? [props.habit] : [])
  const totalHabits = habits.length

  if (totalHabits === 0) {
    return {
      completed: 0,
      missed: 0,
      total: 0,
      percentage: 0
    }
  }

  let totalCompleted = 0
  let totalMissed = 0

  // 计算每个习惯在指定日期范围内的完成情况
  habits.forEach(habit => {
    const daysPerWeek = habit.daysPerWeek && habit.daysPerWeek.length > 0 
      ? habit.daysPerWeek 
      : [0, 1, 2, 3, 4, 5, 6] // 默认每天都要打卡

    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(currentDate.getDate() + i)
      
      const dayOfWeek = currentDate.getDay()
      
      // 检查这天是否需要打卡
      if (daysPerWeek.includes(dayOfWeek.toString())) {
        const dateStr = formatDateToLocal(currentDate)
        const isCompleted = habit.completedDates && habit.completedDates.some(d => {
          const datePart = d.split(' ')[0]
          return datePart === dateStr
        })

        if (isCompleted) {
          totalCompleted++
        } else {
          totalMissed++
        }
      }
    }
  })

  const total = totalCompleted + totalMissed
  const percentage = total > 0 ? Math.round((totalCompleted / total) * 100) : 0

  return {
    completed: totalCompleted,
    missed: totalMissed,
    total,
    percentage
  }
})

const completedPercent = computed(() => ratioData.value.percentage)
const missedPercent = computed(() => 100 - completedPercent.value)

const chartOption = computed(() => ({
  color: [isDarkMode.value ? '#4ade80' : '#22c55e', isDarkMode.value ? '#404040' : '#e5e7eb'],
  series: [
    {
      type: 'pie',
      radius: ['65%', '85%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: isDarkMode.value ? '#1a1a1a' : '#ffffff',
        borderWidth: 2
      },
      label: {
        show: true,
        position: 'center',
        formatter: () => `{value|${completedPercent.value}%}`,
        rich: {
          value: {
            fontSize: 28,
            fontWeight: 'bold',
            color: isDarkMode.value ? '#ffffff' : '#1f2937'
          }
        }
      },
      emphasis: {
        label: {
          show: true
        }
      },
      data: [
        { value: ratioData.value.completed, name: 'Completed' },
        { value: ratioData.value.missed, name: 'Missed' }
      ]
    }
  ]
}))
</script>

<template>
  <div class="completion-ratio">
    <div class="ratio-content">
      <div class="chart-container">
        <div class="donut-chart" :style="{
          background: `conic-gradient(
            ${isDarkMode ? '#4ade80' : '#22c55e'} 0% ${completedPercent}%,
            ${isDarkMode ? '#404040' : '#e5e7eb'} ${completedPercent}% 100%
          )`
        }">
          <div class="center-text">
            <span class="percentage">{{ completedPercent }}%</span>
          </div>
        </div>
      </div>
      
      <div class="legend-container">
        <div class="legend-item">
          <div class="legend-info">
            <span class="legend-dot" :style="{ backgroundColor: isDarkMode ? '#4ade80' : '#22c55e' }"></span>
            <span class="legend-label">Completed</span>
          </div>
          <span class="legend-value">{{ completedPercent }}%</span>
        </div>
        
        <div class="progress-bar">
          <div class="progress-fill" :style="{ 
            width: `${completedPercent}%`,
            backgroundColor: isDarkMode ? '#4ade80' : '#22c55e'
          }"></div>
        </div>
        
        <div class="legend-item">
          <div class="legend-info">
            <span class="legend-dot" :style="{ backgroundColor: isDarkMode ? '#404040' : '#e5e7eb' }"></span>
            <span class="legend-label">Missed</span>
          </div>
          <span class="legend-value">{{ missedPercent }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.completion-ratio {
  padding: 16px;
}

.ratio-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.chart-container {
  flex-shrink: 0;
}

.donut-chart {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.center-text {
  position: absolute;
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.percentage {
  font-size: 20px;
  font-weight: bold;
  color: var(--text-primary);
}

.legend-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.legend-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.legend-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.legend-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.dark-mode .legend-label {
  color: var(--text-light);
}

.legend-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: var(--bg-tertiary);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
}
</style>
