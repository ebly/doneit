/**
 * 提醒调度服务
 * 负责定期检查和触发习惯提醒
 */
import { getHabitsWithReminders } from './storage'
import { ElMessage } from 'element-plus'

// 存储所有定时器 ID
let timers = new Map()

// 检查习惯今天是否已打卡
const isHabitCompletedToday = (habit) => {
  if (!habit.completedDates || habit.completedDates.length === 0) {
    return false
  }
  
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  
  return habit.completedDates.some(dateStr => {
    const datePart = dateStr.split(' ')[0]
    return datePart === today
  })
}

// 检查是否应该发送提醒
const shouldSendReminder = (habit, reminderTime) => {
  // 获取当前时间
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const currentTimeInMinutes = currentHour * 60 + currentMinute
  
  // 解析提醒时间
  const [reminderHour, reminderMinute] = reminderTime.split(':').map(Number)
  const reminderTimeInMinutes = reminderHour * 60 + reminderMinute
  
  // 计算时间差（当前时间 - 提醒时间）
  const timeDiff = currentTimeInMinutes - reminderTimeInMinutes
  
  // 只有在提醒时间之后，且在 60 分钟范围内才提醒
  // timeDiff >= 0 表示当前时间在提醒时间之后
  // timeDiff <= 60 表示在提醒后 60 分钟内
  return timeDiff >= 0 && timeDiff <= 60
}

// 发送习惯提醒
const sendHabitReminder = async (habit, reminderTime) => {
  try {
    // 显示 ElMessage 提示
    ElMessage({
      message: `Time to track: ${habit.name}!`,
      type: 'warning',
      duration: 5000,
      showClose: true
    })
    
    return true
  } catch (error) {
    console.error('Send habit reminder failed:', error)
    return false
  }
}

// 清除所有提醒定时器
const clearAllReminders = () => {
  for (const timerId of timers.values()) {
    clearTimeout(timerId)
  }
  timers.clear()
}

// 监听习惯变化
const handleHabitChange = async (habit) => {
  // 现在使用每分钟检查机制，不需要单独设置定时器
}

// 初始化提醒调度
const initReminderScheduler = async () => {
  // 检查 Notification 设置
  const notificationEnabled = localStorage.getItem('Notification')
  if (notificationEnabled === 'false') {
    return
  }
  
  // 页面加载时立即执行一次检查
  checkReminders()
  
  // 每分钟检查一次提醒
  setInterval(() => {
    checkReminders()
  }, 60 * 1000)
}

// 检查并发送提醒
const checkReminders = async () => {
  try {
    // Check if notifications are enabled
    const notificationEnabled = localStorage.getItem('Notification')
    if (notificationEnabled === 'false') {
      return
    }
    
    const habits = await getHabitsWithReminders()
    
    for (const habit of habits) {
      // Skip if already completed today
      if (isHabitCompletedToday(habit)) {
        continue
      }
      
      for (const reminderTime of habit.reminders) {
        const shouldRemind = shouldSendReminder(habit, reminderTime)
        
        if (shouldRemind) {
          await sendHabitReminder(habit, reminderTime)
        }
      }
    }
  } catch (error) {
    console.error('Error during reminder check:', error)
  }
}

export {
  initReminderScheduler,
  clearAllReminders,
  handleHabitChange
}