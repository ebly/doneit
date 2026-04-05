<script setup>
import { ref, computed } from 'vue'
import { Search, Star } from '@element-plus/icons-vue'

const props = defineProps({
  habits: {
    type: Array,
    required: true
  },
  searchValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['edit', 'delete'])

// 过滤后的习惯列表
const filteredHabits = computed(() => {
  if (!props.searchValue) {
    return props.habits
  }
  const search = props.searchValue.toLowerCase()
  return props.habits.filter(habit => {
    return habit.name.toLowerCase().includes(search)
  })
})

const getHabitIcon = (habit) => {
  // 优先使用保存的 icon，如果没有则根据名称返回默认图标
  if (habit.icon) {
    return habit.icon
  }
  const icons = {
    'Morning Exercise': '🏃‍♂️',
    'Read a Book': '📚',
    'Drink Water': '💧',
    'Meditate': '🧘‍♀️',
    'Code': '💻',
    'Sleep Early': '😴',
    'Eat Healthy': '🥗',
    'Walk': '🚶‍♂️'
  }
  return icons[habit.name] || '📝'
}

const getDayName = (dayIndex) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const index = parseInt(dayIndex)
  return days[index] || ''
}
</script>

<template>
  <div class="habit-list">

    <!-- Habit List -->
    <el-empty v-if="habits.length === 0" description="No habits yet, click 'Add Habit' to start" class="empty-state"
      image-size="100" />

    <el-card v-else class="habits-container" shadow="hover">
      <el-table :data="filteredHabits" stripe style="width: 100%;">
        <el-table-column prop="name" label="Habit" min-width="200">
          <template #default="{ row }">
            <div class="habit-info">
              <span class="habit-icon">{{ getHabitIcon(row) }}</span>
              <span class="habit-name">{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="daysPerWeek" label="Days/Week" width="200">
          <template #default="{ row }">
            <div v-if="row.daysPerWeek && row.daysPerWeek.length > 0" class="days-tags">
              <el-tag v-for="day in row.daysPerWeek" :key="day" size="small" type="primary"
                style="margin-right: 4px; margin-bottom: 4px;">
                {{ getDayName(day) }}
              </el-tag>
            </div>
            <span v-else class="no-days">no days</span>
          </template>
        </el-table-column>

        <el-table-column prop="reminders" label="Reminders" min-width="200">
          <template #default="{ row }">
            <span v-if="row.reminders && row.reminders.length > 0">
              {{ row.reminders.join(', ') }}
            </span>
            <span v-else class="no-reminder">No reminders</span>
          </template>
        </el-table-column>



        <el-table-column label="Actions" width="160" fixed="right" align="center">
          <template #default="{ row }">

            <el-button link size="default" @click="emit('edit', row)"
              style="color: var(--primary-color); margin-right: 5px; font-weight: bold;">
              Edit
            </el-button>
            <span style="color: var(--border-color); margin: 0 5px;">|</span>
            <el-button link size="default" @click="emit('delete', row.id)"
              style="color: var(--primary-color); margin-left: 5px; font-weight: bold;">
              Delete
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.days-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
  align-items: center;
}

.no-days {
  color: var(--text-secondary);
  font-style: italic;
  text-align: center;
}
</style>
