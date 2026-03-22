<script setup>
import { ref } from 'vue'
import { Star } from '@element-plus/icons-vue'

const habits = ref([
  {
    id: 1,
    name: 'Morning Exercise',
    daysPerWeek: 5,
    completed: [true, true, true, true, true, false, false],
    streak: 5
  },
  {
    id: 2,
    name: 'Read a Book',
    daysPerWeek: 3,
    completed: [true, true, false, false, false, false, false],
    streak: 3
  },
  {
    id: 3,
    name: 'Drink Water',
    daysPerWeek: 7,
    completed: [true, true, true, false, false, false, false],
    streak: 7
  },
  {
    id: 4,
    name: 'Meditate',
    daysPerWeek: 4,
    completed: [true, true, false, false, false, false, false],
    streak: 2
  }
])

const getHabitIcon = (habit) => {
  const icons = {
    'Morning Exercise': '🏃‍♂️',
    'Read a Book': '📚',
    'Drink Water': '💧',
    'Meditate': '🧘‍♀️'
  }
  return icons[habit.name] || '📝'
}

const toggleDay = (habitId, dayIndex) => {
  const habit = habits.value.find(h => h.id === habitId)
  if (habit) {
    habit.completed[dayIndex] = !habit.completed[dayIndex]
  }
}
</script>

<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h2>Track Your Habits Daily!</h2>
    </div>
    
    <div class="dashboard-content">
      <div class="habit-table">
        <div class="table-header">
          <div class="header-cell habit-column">Habit</div>
          <div class="header-cell day-column">S</div>
          <div class="header-cell day-column">M</div>
          <div class="header-cell day-column">T</div>
          <div class="header-cell day-column">W</div>
          <div class="header-cell day-column">T</div>
          <div class="header-cell day-column">F</div>
          <div class="header-cell day-column">S</div>
          <div class="header-cell streak-column">Streak</div>
        </div>
        
        <div class="table-body">
          <div v-for="habit in habits" :key="habit.id" class="habit-row">
            <div class="habit-info">
              <span class="habit-icon">{{ getHabitIcon(habit) }}</span>
              <span class="habit-name">{{ habit.name }}</span>
            </div>
            
            <div class="day-icons">
              <div 
                v-for="(completed, index) in habit.completed" 
                :key="index"
                class="day-icon"
                :class="{ completed: completed }"
                @click="toggleDay(habit.id, index)"
              >
                <span v-if="completed">✓</span>
              </div>
            </div>
            
            <div class="streak-info">
              <el-tag type="warning">
                <el-icon><Star /></el-icon> {{ habit.streak }} days
              </el-tag>
              <div class="progress-bar">
                <div 
                  class="progress-fill"
                  :style="{ width: `${(habit.streak / 30) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  width: 100%;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px 0;
  border-bottom: 1px solid var(--border-color);
}

.dashboard-header h2 {
  margin: 0;
  font-size: 24px;
  color: var(--text-primary);
}

.habit-table {
  width: 100%;
  background-color: white;
  border-radius: 8px;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.table-header {
  display: flex;
  background-color: var(--bg-tertiary);
  padding: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.habit-column {
  flex: 1;
  min-width: 200px;
}

.day-column {
  width: 40px;
  text-align: center;
}

.streak-column {
  width: 120px;
  text-align: center;
}

.habit-row {
  display: flex;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid var(--border-color);
  transition: background-color var(--transition-fast);
}

.habit-row:hover {
  background-color: var(--bg-secondary);
}

.habit-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 200px;
}

.habit-icon {
  font-size: 24px;
}

.habit-name {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
}

.day-icons {
  display: flex;
  gap: 8px;
  margin: 0 20px;
}

.day-icon {
  width: 32px;
  height: 32px;
  border: 2px solid #e0e0e0;
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

.day-icon.completed {
  background-color: var(--success-color);
  border-color: var(--success-color);
  color: white;
  font-weight: bold;
}

.streak-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  width: 120px;
}

.progress-bar {
  width: 80px;
  height: 4px;
  background-color: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--success-color);
  transition: width var(--transition-normal);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dashboard-header {
    align-items: flex-start;
  }
  
  .habit-row {
    flex-wrap: wrap;
  }
  
  .day-icons {
    margin: 15px 0;
  }
}
</style>