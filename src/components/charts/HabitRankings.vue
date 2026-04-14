<script setup>
import { computed } from 'vue'
import { useTheme } from '../../composables/useTheme'

const { isDarkMode } = useTheme()

const props = defineProps({
  habits: {
    type: Array,
    default: () => []
  },
  dateRange: {
    type: String,
    default: '30'
  }
})

const formatDateToLocal = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const rankingsData = computed(() => {
  if (!props.habits || props.habits.length === 0) {
    return []
  }

  const days = parseInt(props.dateRange) || 30
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - days + 1)

  const habitStats = props.habits.map(habit => {
    const daysPerWeek = habit.daysPerWeek && habit.daysPerWeek.length > 0 
      ? habit.daysPerWeek 
      : [0, 1, 2, 3, 4, 5, 6]

    let totalCompleted = 0
    let totalRequired = 0

    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(currentDate.getDate() + i)
      
      const dayOfWeek = currentDate.getDay()
      
      if (daysPerWeek.includes(dayOfWeek.toString())) {
        totalRequired++
        const dateStr = formatDateToLocal(currentDate)
        const isCompleted = habit.completedDates && habit.completedDates.some(d => {
          const datePart = d.split(' ')[0]
          return datePart === dateStr
        })

        if (isCompleted) {
          totalCompleted++
        }
      }
    }

    const percentage = totalRequired > 0 
      ? Math.round((totalCompleted / totalRequired) * 100) 
      : 0

    return {
      id: habit.id,
      name: habit.name.length > 20 ? habit.name.substring(0, 20) + '...' : habit.name,
      icon: habit.icon || '📊',
      percentage,
      completed: totalCompleted,
      required: totalRequired
    }
  })

  // 按完成率降序排序，只取前 3 条
  return habitStats.sort((a, b) => b.percentage - a.percentage).slice(0, 3)
})

const getBarColor = (percentage) => {
  if (percentage >= 90) return isDarkMode.value ? '#4ade80' : '#22c55e'
  if (percentage >= 70) return isDarkMode.value ? '#84cc16' : '#65a30d'
  if (percentage >= 50) return isDarkMode.value ? '#eab308' : '#ca8a04'
  return isDarkMode.value ? '#f97316' : '#ea580c'
}
</script>

<template>
  <div class="habit-rankings">
    <div v-if="rankingsData.length === 0" class="empty-state">
      <p>No habits to display</p>
    </div>
    <div v-else class="rankings-list">
      <div 
        v-for="(habit, index) in rankingsData" 
        :key="habit.id" 
        class="ranking-item"
      >
        <div class="habit-info">
          <span class="habit-icon">{{ habit.icon }}</span>
          <span class="habit-name">{{ habit.name }}</span>
        </div>
        
        <div class="progress-section">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ 
                width: `${habit.percentage}%`,
                backgroundColor: getBarColor(habit.percentage)
              }"
            ></div>
          </div>
        </div>
        
        <div class="percentage-value">
          {{ habit.percentage }}%
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.habit-rankings {
  padding: 16px;
}

.empty-state {
  text-align: center;
  color: var(--text-secondary);
  font-size: 14px;
  padding: 20px;
}

.dark-mode .empty-state {
  color: var(--text-light);
}

.rankings-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.habit-info {
  min-width: 120px;
  max-width: 180px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.habit-icon {
  font-size: 16px;
}

.habit-name {
  font-size: 14px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.progress-section {
  flex: 1;
  min-width: 0;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease, background-color 0.3s ease;
  border-radius: 4px;
}

.percentage-value {
  width: 45px;
  text-align: right;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .habit-info {
    min-width: 100px;
    max-width: 140px;
  }
  
  .habit-name {
    font-size: 13px;
  }
  
  .percentage-value {
    width: 40px;
    font-size: 13px;
  }
}
</style>
