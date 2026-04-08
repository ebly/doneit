<script setup>
import { ref, computed } from 'vue'

// 接收习惯数据作为 props
const props = defineProps({
  habits: {
    type: Array,
    default: () => []
  }
})

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
    // 使用本地时间格式化，避免时区问题
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    
    // 查找这一天完成的习惯
    const completions = props.habits.filter(habit => {
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
</script>

<template>
  <div class="calendar-content">
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
</style>
