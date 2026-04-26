<script setup>
import { ref, computed, watch } from 'vue'
import { Search, Star } from '@element-plus/icons-vue'
import { useI18n, registerLocale } from '../utils/i18n.js'
import { useSettings } from '../composables/useSettings.js'
import en from '../locales/en.js'
import zh from '../locales/zh.js'

registerLocale('en', en)
registerLocale('zh', zh)

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

const { language } = useSettings()
const { t, currentLang } = useI18n()

watch(() => language.value, (newVal) => {
  currentLang.value = newVal
}, { immediate: true })

const filteredHabits = computed(() => {
  if (!props.searchValue) {
    return props.habits
  }
  const search = props.searchValue.toLowerCase()
  return props.habits.filter(habit => {
    return habit.name.toLowerCase().includes(search) || 
           (habit.description && habit.description.toLowerCase().includes(search))
  })
})

const getHabitIcon = (habit) => {
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
  const days = t.value('days')
  const index = parseInt(dayIndex)
  return days[index] || ''
}
</script>

<template>
  <div class="habit-list">

    <!-- Habit List -->
    <el-empty v-if="habits.length === 0" :description="t('common.noHabitsYet')" class="empty-state"
      image-size="100" />

    <el-card v-else class="habits-container" shadow="hover">
      <el-table :data="filteredHabits" stripe style="width: 100%;">
        <el-table-column prop="name" :label="t('nav.myHabits')" min-width="200">
          <template #default="{ row }">
            <div class="habit-info">
              <span class="habit-icon">{{ getHabitIcon(row) }}</span>
              <span class="habit-name">{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="daysPerWeek" :label="t('habitForm.daysPerWeek')" width="200">
          <template #default="{ row }">
            <div v-if="row.daysPerWeek && row.daysPerWeek.length > 0" class="days-tags">
              <el-tag v-for="day in row.daysPerWeek" :key="day" size="small" type="primary"
                style="margin-right: 4px; margin-bottom: 4px;">
                {{ getDayName(day) }}
              </el-tag>
            </div>
            <span v-else class="no-days">{{ t('common.noDays') }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="reminders" :label="t('habitForm.reminders')" min-width="200">
          <template #default="{ row }">
            <span v-if="row.reminders && row.reminders.length > 0">
              {{ row.reminders.join(', ') }}
            </span>
            <span v-else class="no-reminder">{{ t('common.noReminders') }}</span>
          </template>
        </el-table-column>



        <el-table-column :label="t('dashboard.status')" width="160" fixed="right" align="center">
          <template #default="{ row }">

            <el-button link size="default" @click="emit('edit', row)"
              style="color: var(--primary-color); margin-right: 5px; font-weight: bold;">
              {{ t('common.edit') }}
            </el-button>
            <span style="color: var(--border-color); margin: 0 5px;">|</span>
            <el-button link size="default" @click="emit('delete', row.id)"
              style="color: var(--danger-color); margin-left: 5px; font-weight: bold;">
              {{ t('common.delete') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.no-days {
  color: var(--text-secondary);
  font-style: italic;
  text-align: center;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .habit-info {
    gap: 8px;
  }

  .habit-icon {
    font-size: 18px;
  }

  .habit-name {
    font-size: 14px;
    max-width: 100px;
  }

  .days-tags {
    flex-wrap: wrap;
    gap: 2px;
  }

  .days-tags .el-tag {
    font-size: 10px;
    padding: 0 4px;
    margin: 0 !important;
  }

  :deep(.el-table) {
    font-size: 12px;
  }

  :deep(.el-table__row) {
    height: 60px !important;
  }

  .no-days,
  .no-reminder {
    font-size: 12px;
  }
}
</style>
