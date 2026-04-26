<script setup>
import { ref, computed, watch } from 'vue'
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

const { language } = useSettings()
const { t, currentLang } = useI18n()

watch(() => language.value, (newVal) => {
  currentLang.value = newVal
}, { immediate: true })

const currentDate = ref(new Date())
const weekDays = computed(() => t.value('days'))

const currentMonthLabel = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.toLocaleString(currentLang.value === 'zh' ? 'zh-CN' : 'en-US', { month: currentLang.value === 'zh' ? 'long' : 'short' })
  return `${month} ${year}`
})

const calendarCells = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const firstDayOfWeek = firstDay.getDay()
  const totalDays = lastDay.getDate()
  
  const cells = []
  const today = new Date()
  
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push({ isEmpty: true })
  }
  
  for (let day = 1; day <= totalDays; day++) {
    const cellDate = new Date(year, month, day)
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    
    const completions = props.habits.filter(habit => {
      if (!habit.completedDates) return false
      return habit.completedDates.some(d => {
        const datePart = d.split(' ')[0]
        return datePart === dateStr
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

const previousMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
}

const nextMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
}
</script>

<template>
  <div v-if="props.habits.length === 0" class="empty-calendar">
    <el-empty :description="t('calendar.noHabits')" image-size="80" />
  </div>
  <div v-else class="calendar-content">
    <div class="calendar-header-nav">
      <div class="nav-arrow" @click="previousMonth">
        &lt;
      </div>
      <h3>{{ currentMonthLabel }}</h3>
      <div class="nav-arrow" @click="nextMonth">
        &gt;
      </div>
    </div>
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
            class="completion-tag"
            :title="habit.name"
          >
            <span class="completion-icon">{{ habit.icon || '✅' }}</span>
            <span class="completion-name">{{ habit.name }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.calendar-content {
  flex: 1;
}

.calendar-header-nav {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.calendar-header-nav h3 {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  padding: 0 50px;
}

.nav-arrow {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.nav-arrow:hover {
  color: var(--primary-color);
  transform: scale(1.1);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10px;
  margin: 0 auto;
}

.calendar-weekday {
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  padding: 10px 0;
}

.calendar-cell {
  aspect-ratio: 1;
  border-radius: 4px;
  background: var(--bg-secondary);
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  min-height: 35px;
  transition: all 0.2s ease;
}

.calendar-cell:hover {
  background: var(--bg-tertiary);
}

.calendar-cell.empty {
  background: transparent;
}

.calendar-cell.today {
  background: var(--primary-color);
  color: white;
}

.calendar-cell.today .cell-date {
  color: white;
}

.cell-date {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.cell-completions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: flex-start;
  overflow-y: auto;
  width: 100%;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .calendar-header-nav {
    gap: 8px;
    margin-bottom: 12px;
  }

  .calendar-header-nav h3 {
    font-size: 16px;
    padding: 0 20px;
  }

  .nav-arrow {
    font-size: 18px;
    padding: 8px;
  }

  .calendar-grid {
    gap: 4px;
  }

  .calendar-weekday {
    font-size: 10px;
    padding: 6px 0;
  }

  .calendar-cell {
    padding: 4px;
    min-height: 40px;
  }

  .cell-date {
    font-size: 12px;
  }

  .cell-completions {
    gap: 2px;
  }

  .completion-tag {
    font-size: 8px;
    padding: 1px 3px;
  }

  .completion-icon {
    font-size: 10px;
  }

  .completion-name {
    max-width: 40px;
  }
}
</style>
