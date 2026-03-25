<script setup>
import { ref } from 'vue'
import { Close, Delete, Plus } from '@element-plus/icons-vue'

const props = defineProps({
  habit: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['add', 'cancel'])

const habitName = ref(props.habit?.name || '')
const daysPerWeek = ref(props.habit?.daysPerWeek || 1)
const reminders = ref(props.habit?.reminders || [])

const newReminderTime = ref('')
// 对话框显示状态
const dialogVisible = ref(true)

const addReminder = () => {
  if (newReminderTime.value) {
    reminders.value.push({
      id: Date.now(),
      time: newReminderTime.value
    })
    newReminderTime.value = ''
  }
}

const removeReminder = (id) => {
  reminders.value = reminders.value.filter(r => r.id !== id)
}

const submitForm = () => {
  if (!habitName.value.trim()) return
  
  const habitData = {
    name: habitName.value.trim(),
    daysPerWeek: parseInt(daysPerWeek.value),
    reminders: reminders.value
  }
  
  emit('add', habitData)
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="habit ? 'Edit Habit' : 'Add Habit'"
    width="500px"
    :close-on-click-modal="false"
    class="habit-form-dialog"
  >
    <el-form
      :model="formData"
      label-width="80px"
      class="habit-form"
      @submit.prevent="submitForm"
    >
      <el-form-item label="Habit Name" required>
        <el-input
          v-model="habitName"
          placeholder="e.g., Morning Exercise, Reading"
          clearable
        />
      </el-form-item>
      
      <el-form-item label="Days/Week" required>
        <el-input-number
          v-model="daysPerWeek"
          :min="1"
          :max="7"
          :controls-position="'right'"
          placeholder="1-7"
        />
      </el-form-item>
      
      <el-form-item label="Reminders">
        <div class="reminders-section">
          <!-- Added Reminders -->
          <div
            v-for="reminder in reminders"
            :key="reminder.id"
            class="reminder-item"
          >
            <el-tag type="primary" closable @close="removeReminder(reminder.id)">
              {{ reminder.time }}
            </el-tag>
          </div>
          
          <!-- Add New Reminder -->
          <div class="add-reminder">
            <el-time-picker
              v-model="newReminderTime"
              placeholder="Select time"
              format="HH:mm"
              value-format="HH:mm"
              style="width: 120px;"
            />
            <el-button
              type="primary"
              size="small"
              @click="addReminder"
              :disabled="!newReminderTime"
              style="margin-left: 10px;"
            >
              <el-icon><Plus /></el-icon> Add
            </el-button>
          </div>
        </div>
      </el-form-item>
      
      <el-form-item>
        <div class="form-actions">
          <el-button @click="emit('cancel')">Cancel</el-button>
          <el-button type="primary" native-type="submit">Save</el-button>
        </div>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<style scoped>
/* 提醒时间部分 */
.reminders-section {
  margin-top: 8px;
}

.reminder-item {
  margin-bottom: 8px;
}

.reminder-item:last-child {
  margin-bottom: 0;
}

.add-reminder {
  margin-top: 12px;
}

/* 表单操作按钮 */
.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>