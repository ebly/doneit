<script setup>
import { ref, watch } from 'vue'
import { Close, Delete, Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

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

const habitName = ref(props.habit?.name || '')
const description = ref(props.habit?.description || '')
const selectedDays = ref(props.habit?.daysPerWeek || ['0', '1', '2', '3', '4', '5', '6'])
const reminders = ref(props.habit?.reminders && props.habit?.reminders.length > 0 ? [props.habit.reminders[0]] : ['00:00'])
const reminderHour = ref('00')
const reminderMinute = ref('00')
const habitIcon = ref(props.habit?.icon || '📝')

// 常用习惯图标选项
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

// Generate hour shortcuts
const hourShortcuts = [
  { text: '00', value: '00' },
  { text: '06', value: '06' },
  { text: '12', value: '12' },
  { text: '18', value: '18' },
  { text: '23', value: '23' }
]

// Parse hour and minute from time string
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

// Combine hour and minute into time string
const combineTime = () => {
  if (!reminderHour.value && !reminderMinute.value) {
    return ''
  }
  const hour = reminderHour.value || '00'
  const minute = reminderMinute.value || '00'
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
}

// 监听 habit 变化，更新表单数据
watch(() => props.habit, (newHabit) => {
  if (newHabit) {
    habitName.value = newHabit.name || ''
    description.value = newHabit.description || ''
    selectedDays.value = newHabit.daysPerWeek || ['0', '1', '2', '3', '4', '5', '6']
    // 只取第一个提醒时间，如果没有则为空数组
    reminders.value = newHabit.reminders && newHabit.reminders.length > 0 ? [newHabit.reminders[0]] : []
    parseTime(reminders.value[0])
    habitIcon.value = newHabit.icon || '📝'
  } else {
    habitName.value = ''
    description.value = ''
    selectedDays.value = ['0', '1', '2', '3', '4', '5', '6']
    reminders.value = ['00:00']
    parseTime('00:00')
    habitIcon.value = '📝'
  }
}, { immediate: true })

const submitForm = () => {
  // 验证 Name 不能为空
  if (!habitName.value.trim()) {
    ElMessage({
      message: 'Please enter a habit name',
      type: 'warning',
    })
    return
  }

  // Validate Reminders cannot be empty (need to select both Hour and Min)
  if (!reminderHour.value || !reminderMinute.value) {
    ElMessage({
      message: 'Please select a reminder time',
      type: 'warning',
    })
    return
  }

  // 验证 Days/Week 至少选择一天
  if (!selectedDays.value || selectedDays.value.length === 0) {
    ElMessage({
      message: 'Please select at least one day',
      type: 'warning',
    })
    return
  }

  // Combine hour and minute into full time
  const combinedTime = combineTime()
  // 00:00 是有效时间（深夜 12 点）
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
  
  // 清空所有字段，恢复初始状态
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
  
  // 清空所有字段，恢复初始状态
  habitName.value = ''
  description.value = ''
  selectedDays.value = ['0', '1', '2', '3', '4', '5', '6']
  reminders.value = ['00:00']
  reminderHour.value = '00'
  reminderMinute.value = '00'
  habitIcon.value = '📝'
}

// 切换星期几的选择状态
const toggleDaySelection = (dayIndex) => {
  const index = selectedDays.value.indexOf(dayIndex)
  if (index > -1) {
    // 如果已经选中，则取消选中
    selectedDays.value.splice(index, 1)
  } else {
    // 如果未选中，则添加选中
    selectedDays.value.push(dayIndex)
  }
}

// 处理图标选择
const handleIconSelect = (icon) => {
  habitIcon.value = icon
}
</script>

<template>
  <el-dialog :model-value="visible" @update:model-value="(value) => emit('update:visible', value)"
    :title="habit ? 'Edit Habit' : 'Add Habit'" width="500px" :close-on-click-modal="false" class="habit-form-dialog"
    @close="handleCancel">
    <el-form label-width="90px" class="habit-form" @submit.prevent="submitForm">
      <el-form-item label="Name" required>
        <div class="name-icon-inputs">
          <el-input v-model="habitName" placeholder="e.g., Morning Exercise, Reading" clearable style="flex: 1;" />
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

      <el-form-item label="Description">
        <el-input v-model="description" placeholder="e.g., Exercise for 30 minutes every morning at 6 AM" type="textarea" :rows="3" />
      </el-form-item>

      <el-form-item label="Days/Week" required>
        <div class="days-tags-selector">
          <el-tag v-for="(day, index) in ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']" :key="index"
            :type="selectedDays.includes(index.toString()) ? 'primary' : 'info'"
            :class="{ 'selected': selectedDays.includes(index.toString()) }"
            @click="toggleDaySelection(index.toString())" size="small"
            style="margin-right: 8px; margin-bottom: 8px; cursor: pointer;">
            {{ day }}
          </el-tag>
        </div>
      </el-form-item>

      <el-form-item label="Reminders" required>
        <div class="reminder-time-inputs">
          <el-select v-model="reminderHour" placeholder="Hour" style="width: 100px;" clearable filterable>
            <el-option v-for="h in 24" :key="h - 1" :label="String(h - 1).padStart(2, '0')" :value="String(h - 1).padStart(2, '0')" />
          </el-select>
          <span class="time-separator">:</span>
          <el-select v-model="reminderMinute" placeholder="Min" style="width: 100px;" clearable filterable>
            <el-option v-for="m in 60" :key="m - 1" :label="String(m - 1).padStart(2, '0')" :value="String(m - 1).padStart(2, '0')" />
          </el-select>
        </div>
      </el-form-item>

      <el-form-item :label-width="0">
        <div class="form-actions">
          <el-button type="default" @click="handleCancel"
            style="width: 160px; padding: 6px; font-size: 14px;">Cancel</el-button>
          <el-button native-type="submit" class="site-primary-button"
            style="width: 160px; padding: 6px; font-size: 14px;">Save</el-button>
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
</style>
