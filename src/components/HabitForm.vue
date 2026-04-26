<script setup>
import { ref, watch } from 'vue'
import { Close, Delete, Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useI18n, registerLocale } from '../utils/i18n.js'
import { useSettings } from '../composables/useSettings.js'
import en from '../locales/en.js'
import zh from '../locales/zh.js'

registerLocale('en', en)
registerLocale('zh', zh)

const props = defineProps({
  habit: {
    type: Object,
    default: null
  },
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['add', 'cancel', 'update:visible'])

const { language } = useSettings()
const { t, currentLang } = useI18n()

watch(() => language.value, (newVal) => {
  currentLang.value = newVal
}, { immediate: true })

const habitName = ref('')
const description = ref('')
const selectedDays = ref(['0', '1', '2', '3', '4', '5', '6'])
const reminders = ref([])
const reminderHour = ref('00')
const reminderMinute = ref('00')
const habitIcon = ref('📝')

const iconOptions = [
  { value: '🏃‍♂️', label: '跑步' },
  { value: '📚', label: '阅读' },
  { value: '💧', label: '喝水' },
  { value: '🧘‍♀️', label: '冥想' },
  { value: '💻', label: '编程' },
  { value: '😴', label: '睡眠' },
  { value: '🥗', label: '健康饮食' },
  { value: '🚶‍♂️', label: '散步' },
  { value: '🏋️‍♂️', label: '健身' },
  { value: '🎨', label: '艺术' },
  { value: '🎵', label: '音乐' },
  { value: '✍️', label: '写作' },
  { value: '🌅', label: '早起' },
  { value: '🧹', label: '清洁' },
  { value: '💊', label: '服药' },
  { value: '📝', label: '默认' }
]

const hourShortcuts = [
  { text: '00', value: '00' },
  { text: '06', value: '06' },
  { text: '12', value: '12' },
  { text: '18', value: '18' },
  { text: '23', value: '23' }
]

const parseTime = (timeStr) => {
  if (!timeStr) {
    reminderHour.value = ''
    reminderMinute.value = ''
    return
  }
  const [hour, minute] = timeStr.split(':')
  reminderHour.value = hour
  reminderMinute.value = minute
}

const combineTime = () => {
  if (!reminderHour.value && !reminderMinute.value) {
    return ''
  }
  const hour = reminderHour.value || '00'
  const minute = reminderMinute.value || '00'
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
}

watch(() => props.habit, (newHabit) => {
  if (newHabit) {
    habitName.value = newHabit.name || ''
    description.value = newHabit.description || ''
    selectedDays.value = newHabit.daysPerWeek || ['0', '1', '2', '3', '4', '5', '6']
    if (newHabit.reminders && newHabit.reminders.length > 0) {
      reminders.value = [newHabit.reminders[0]]
      parseTime(newHabit.reminders[0])
    } else {
      reminders.value = []
      reminderHour.value = '00'
      reminderMinute.value = '00'
    }
    habitIcon.value = newHabit.icon || '📝'
  } else {
    habitName.value = ''
    description.value = ''
    selectedDays.value = ['0', '1', '2', '3', '4', '5', '6']
    reminders.value = []
    reminderHour.value = '00'
    reminderMinute.value = '00'
    habitIcon.value = '📝'
  }
}, { immediate: true })

const submitForm = () => {
  if (!habitName.value.trim()) {
    ElMessage({
      message: t.value('habitForm.enterHabitName'),
      type: 'warning',
    })
    return
  }

  if (!reminderHour.value || !reminderMinute.value) {
    ElMessage({
      message: t.value('habitForm.selectReminder'),
      type: 'warning',
    })
    return
  }

  if (!selectedDays.value || selectedDays.value.length === 0) {
    ElMessage({
      message: t.value('habitForm.selectDay'),
      type: 'warning',
    })
    return
  }

  const combinedTime = combineTime()
  const validReminders = combinedTime ? [combinedTime] : []

  const habitData = {
    name: habitName.value.trim(),
    description: description.value.trim(),
    frequency: props.habit?.frequency || 'daily',
    reminders: validReminders,
    daysPerWeek: Array.from(selectedDays.value),
    icon: habitIcon.value
  }

  emit('add', habitData)
  emit('update:visible', false)
  
  habitName.value = ''
  description.value = ''
  selectedDays.value = ['0', '1', '2', '3', '4', '5', '6']
  reminders.value = ['00:00']
  reminderHour.value = '00'
  reminderMinute.value = '00'
  habitIcon.value = '📝'
}

const handleCancel = () => {
  emit('cancel')
  emit('update:visible', false)
  
  habitName.value = ''
  description.value = ''
  selectedDays.value = ['0', '1', '2', '3', '4', '5', '6']
  reminders.value = ['00:00']
  reminderHour.value = '00'
  reminderMinute.value = '00'
  habitIcon.value = '📝'
}

const toggleDaySelection = (dayIndex) => {
  const index = selectedDays.value.indexOf(dayIndex)
  if (index > -1) {
    selectedDays.value.splice(index, 1)
  } else {
    selectedDays.value.push(dayIndex)
  }
}

const handleIconSelect = (icon) => {
  habitIcon.value = icon
}
</script>

<template>
  <el-dialog :model-value="visible" @update:model-value="(value) => emit('update:visible', value)"
    :title="habit ? t('habitForm.editTitle') : t('habitForm.addTitle')" width="500px" :close-on-click-modal="false" class="habit-form-dialog"
    @close="handleCancel">
    <el-form label-width="90px" class="habit-form" @submit.prevent="submitForm">
      <el-form-item :label="t('habitForm.name')" required>
        <div class="name-icon-inputs">
          <el-input 
            v-model="habitName" 
            :placeholder="t('habitForm.namePlaceholder')" 
            clearable 
            maxlength="20" 
            show-word-limit
            style="flex: 1;" 
          />
          <el-dropdown trigger="click" class="icon-dropdown" @command="handleIconSelect" :hide-on-click="false">
            <span class="icon-trigger" style="font-size: 18px; cursor: pointer; margin-left: 12px;">
              {{ habitIcon }}
            </span>
            <template #dropdown>
              <el-dropdown-menu class="icon-menu">
                <div class="icon-grid">
                  <span v-for="option in iconOptions" :key="option.value" 
                    class="icon-item" 
                    @click="handleIconSelect(option.value)"
                    :class="{ 'selected': habitIcon === option.value }">
                    {{ option.value }}
                  </span>
                </div>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-form-item>

      <el-form-item :label="t('habitForm.description')">
        <el-input v-model="description" :placeholder="t('habitForm.descriptionPlaceholder')" type="textarea" :rows="3" />
      </el-form-item>

      <el-form-item :label="t('habitForm.daysPerWeek')" required>
        <div class="days-tags-selector">
          <el-tag v-for="(day, index) in t('days')" :key="index"
            :type="selectedDays.includes(index.toString()) ? 'primary' : 'info'"
            :class="{ 'selected': selectedDays.includes(index.toString()) }"
            @click="toggleDaySelection(index.toString())" size="small"
            style="margin-right: 8px; margin-bottom: 8px; cursor: pointer;">
            {{ day }}
          </el-tag>
        </div>
      </el-form-item>

      <el-form-item :label="t('habitForm.reminders')" required>
        <div class="reminder-time-inputs">
          <el-select v-model="reminderHour" :placeholder="t('habitForm.hour')" style="width: 100px;" clearable filterable>
            <el-option v-for="h in 24" :key="h - 1" :label="String(h - 1).padStart(2, '0')" :value="String(h - 1).padStart(2, '0')" />
          </el-select>
          <span class="time-separator">:</span>
          <el-select v-model="reminderMinute" :placeholder="t('habitForm.min')" style="width: 100px;" clearable filterable>
            <el-option v-for="m in 60" :key="m - 1" :label="String(m - 1).padStart(2, '0')" :value="String(m - 1).padStart(2, '0')" />
          </el-select>
        </div>
      </el-form-item>

      <el-form-item :label-width="0">
        <div class="form-actions">
          <el-button type="default" @click="handleCancel"
            style="width: 160px; padding: 6px; font-size: 14px;">{{ t('common.cancel') }}</el-button>
          <el-button native-type="submit" class="site-primary-button"
            style="width: 160px; padding: 6px; font-size: 14px;">{{ t('common.save') }}</el-button>
        </div>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<style scoped>
/* 表单项目对齐 */
:deep(.el-form-item) {
  align-items: center;
  margin-bottom: 10px;
}

/* 表单内容区域占满宽度 */
:deep(.el-form-item__content) {
  width: 100%;
}

/* 星期几标签选择器 */
.days-tags-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

:deep(.el-tag) {
  transition: all 0.3s ease;
}

:deep(.el-tag:hover) {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 提醒时间输入框容器 */
.reminder-time-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-separator {
  font-size: 16px;
  font-weight: bold;
  color: var(--el-text-color-regular);
}

/* 名称和图标输入容器 */
.name-icon-inputs {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

/* 图标下拉触发器 */
.icon-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  transition: transform 0.2s;
}

.icon-trigger:hover {
  transform: scale(1.1);
}

/* 图标下拉菜单 */
.icon-menu {
  padding: 8px;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  max-width: 200px;
}

.icon-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  font-size: 18px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.icon-item:hover {
  background-color: var(--el-fill-color-light);
  transform: scale(1.1);
}

.icon-item.selected {
  background-color: var(--el-color-primary-light-9);
  border: 2px solid var(--el-color-primary);
}

.dark-mode .icon-item:hover {
  background-color: var(--bg-tertiary);
}

.dark-mode .icon-item.selected {
  background-color: var(--bg-tertiary);
  border-color: var(--primary-color);
}

/* el-dialog 暗色模式 */
.dark-mode :deep(.el-dialog) {
  background-color: var(--bg-secondary);
}

/* 移动端适配 */
@media (max-width: 768px) {
  :deep(.el-dialog) {
    width: 90% !important;
    top: 50%;
    transform: translateY(-50%);
  }

  :deep(.el-form-item__label) {
    font-size: 13px;
  }

  .days-tags-selector {
    gap: 6px;
  }

  .days-tags-selector .el-tag {
    font-size: 12px;
    padding: 0 8px;
  }

  .reminder-time-inputs {
    gap: 6px;
  }

  .reminder-time-inputs .el-select {
    width: 80px !important;
  }

  .time-separator {
    font-size: 14px;
  }

  .name-icon-inputs {
    gap: 8px;
  }

  .icon-trigger {
    width: 28px;
    height: 28px;
    font-size: 16px;
  }

  .icon-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
    max-width: 180px;
  }

  .icon-item {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }

  .form-actions {
    flex-direction: column;
    gap: 8px;
  }

  .form-actions .el-button {
    width: 100% !important;
  }
}
</style>
