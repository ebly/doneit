<script setup>
import { ref } from 'vue'
import { Star } from '@element-plus/icons-vue'

// 获取当前星期几的索引：0=周日，1=周一，...，6=周六
const currentDayIndex = ref(new Date().getDay())

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

    <el-card class="habits-container" shadow="hover" style="margin-top: 20px;">
      <el-table
        :data="habits"
        stripe
        style="width: 100%;"
      >
        <!-- Habit Column -->
        <el-table-column label="Habit" min-width="300">
          <template #default="{ row }">
            <div class="habit-info">
              <span class="habit-icon">{{ getHabitIcon(row) }}</span>
              <span class="habit-name">{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>

        <!-- Day Columns -->
        <el-table-column label="Sun" width="50" align="center">
          <template #header-cell="scope">
            <div class="header-cell day-column" :class="{ 'current-day': 0 === currentDayIndex.value }">{{ scope.column.label }}</div>
          </template>
          <template #default="{ row }">
            <div class="table-cell day-column" :class="{ 'current-day-column': 0 === currentDayIndex.value }">
              <div 
                class="day-icon"
                :class="{
                  'completed': row.completed[0],
                  'current-day-icon': 0 === currentDayIndex.value
                }"
                @click="toggleDay(row.id, 0)"
              >
                <span v-if="row.completed[0]">✓</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Mon" width="50" align="center">
          <template #header-cell="scope">
            <div class="header-cell day-column" :class="{ 'current-day': 1 === currentDayIndex.value }">{{ scope.column.label }}</div>
          </template>
          <template #default="{ row }">
            <div class="table-cell day-column" :class="{ 'current-day-column': 1 === currentDayIndex.value }">
              <div 
                class="day-icon"
                :class="{
                  'completed': row.completed[1],
                  'current-day-icon': 1 === currentDayIndex.value
                }"
                @click="toggleDay(row.id, 1)"
              >
                <span v-if="row.completed[1]">✓</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Tue" width="50" align="center">
          <template #header-cell="scope">
            <div class="header-cell day-column" :class="{ 'current-day': 2 === currentDayIndex.value }">{{ scope.column.label }}</div>
          </template>
          <template #default="{ row }">
            <div class="table-cell day-column" :class="{ 'current-day-column': 2 === currentDayIndex.value }">
              <div 
                class="day-icon"
                :class="{
                  'completed': row.completed[2],
                  'current-day-icon': 2 === currentDayIndex.value
                }"
                @click="toggleDay(row.id, 2)"
              >
                <span v-if="row.completed[2]">✓</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Wed" width="50" align="center">
          <template #header-cell="scope">
            <div class="header-cell day-column" :class="{ 'current-day': 3 === currentDayIndex.value }">{{ scope.column.label }}</div>
          </template>
          <template #default="{ row }">
            <div class="table-cell day-column" :class="{ 'current-day-column': 3 === currentDayIndex.value }">
              <div 
                class="day-icon"
                :class="{
                  'completed': row.completed[3],
                  'current-day-icon': 3 === currentDayIndex.value
                }"
                @click="toggleDay(row.id, 3)"
              >
                <span v-if="row.completed[3]">✓</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Thu" width="50" align="center">
          <template #header-cell="scope">
            <div class="header-cell day-column" :class="{ 'current-day': 4 === currentDayIndex.value }">{{ scope.column.label }}</div>
          </template>
          <template #default="{ row }">
            <div class="table-cell day-column" :class="{ 'current-day-column': 4 === currentDayIndex.value }">
              <div 
                class="day-icon"
                :class="{
                  'completed': row.completed[4],
                  'current-day-icon': 4 === currentDayIndex.value
                }"
                @click="toggleDay(row.id, 4)"
              >
                <span v-if="row.completed[4]">✓</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Fri" width="50" align="center">
          <template #header-cell="scope">
            <div class="header-cell day-column" :class="{ 'current-day': 5 === currentDayIndex.value }">{{ scope.column.label }}</div>
          </template>
          <template #default="{ row }">
            <div class="table-cell day-column" :class="{ 'current-day-column': 5 === currentDayIndex.value }">
              <div 
                class="day-icon"
                :class="{
                  'completed': row.completed[5],
                  'current-day-icon': 5 === currentDayIndex.value
                }"
                @click="toggleDay(row.id, 5)"
              >
                <span v-if="row.completed[5]">✓</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Sat" width="50" align="center">
          <template #header-cell="scope">
            <div class="header-cell day-column" :class="{ 'current-day': 6 === currentDayIndex.value }">{{ scope.column.label }}</div>
          </template>
          <template #default="{ row }">
            <div class="table-cell day-column" :class="{ 'current-day-column': 6 === currentDayIndex.value }">
              <div 
                class="day-icon"
                :class="{
                  'completed': row.completed[6],
                  'current-day-icon': 6 === currentDayIndex.value
                }"
                @click="toggleDay(row.id, 6)"
              >
                <span v-if="row.completed[6]">✓</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- Streak Column -->
        <el-table-column label="Streak" width="120" align="center">
          <template #default="{ row }">
            <div class="streak-info">
              <el-tag type="warning">
                <el-icon><Star /></el-icon> {{ row.streak }} days
              </el-tag>
              <div class="progress-bar">
                <div 
                  class="progress-fill"
                  :style="{ width: `${(row.streak / 30) * 100}%` }"
                ></div>
              </div>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
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
}

.dashboard-header h2 {
  margin: 0;
  font-size: 28px;
  color: var(--text-primary);
}

/* 确保表头和表格单元格对齐 */
.header-cell, .table-cell {
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

/* 当前天的列背景 */
.table-cell.current-day-column {
  background-color: rgba(50, 112, 202, 0.05);
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

/* 当前天的圆圈样式 */
.day-icon.current-day-icon {
  border-color: var(--primary-color);
  background-color: rgba(50, 112, 202, 0.1);
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
</style>