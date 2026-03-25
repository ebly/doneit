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
</script>

<template>
  <div class="habit-list">
    
    <!-- Habit List -->
    <el-empty
      v-if="habits.length === 0"
      description="No habits yet, click 'Add Habit' to start"
      class="empty-state"
      image-size="100"
    />
    
    <el-card
      v-else
      class="habits-container"
      shadow="hover"
    >
      <el-table
        :data="filteredHabits"
        stripe
        style="width: 100%;"
      >
        <el-table-column prop="name" label="Habit" min-width="300">
          <template #default="{ row }">
            <div class="habit-info">
              <span class="habit-icon">{{ getHabitIcon(row) }}</span>
              <span class="habit-name">{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="daysPerWeek" label="Days/Week" width="120">
          <template #default="{ row }">
            <el-tag size="small" type="primary">
              {{ row.daysPerWeek }} days/week
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="reminders" label="Reminders" min-width="200">
          <template #default="{ row }">
            <span v-if="row.reminders">
              {{ row.reminders.map(r => r.time).join(', ') }}
            </span>
            <span v-else class="no-reminder">No reminders</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="streak" label="Streak" width="120">
          <template #default="{ row }">
            <el-tag type="warning">
              <el-icon><Star /></el-icon> {{ row.streak }} days
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="Actions" width="160" fixed="right" align="center">
          <template #default="{ row }">

            <el-button
              type="text"
              size="default"
              @click="emit('edit', row.id)"
              style="color: var(--primary-color); margin-right: 10px; font-weight: bold;"
            >
              Edit
            </el-button>
            <span style="color: #ccc; margin: 0 5px;">|</span>
            <el-button
              type="text"
              size="default"
              @click="emit('delete', row.id)"
              style="color: var(--primary-color); margin-left: 10px; font-weight: bold;"
            >
              Delete
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

