/**
 * 提醒调度服务
 * 负责定期检查和触发习惯提醒
 */
import { getHabitsWithReminders } from './storage'
import { getReminderSettings } from './storage'
import { requestNotificationPermission, showNotification, calculateReminderDelay } from './notification'

// 存储所有定时器ID
let timers = new Map()

// 检查是否应该发送提醒
const shouldSendReminder = (habit, reminderTime) => {
  // 获取当前时间
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  
  // 解析提醒时间
  const [reminderHour, reminderMinute] = reminderTime.split(':').map(Number)
  
  // 检查是否到了提醒时间
  return currentHour === reminderHour && currentMinute === reminderMinute
}

// 发送习惯提醒
const sendHabitReminder = async (habit, reminderTime) => {
  try {
    // 检查提醒设置
    const settings = await getReminderSettings()
    if (!settings.enabled) {
      return false
    }
    
    // 检查通知权限
    if (Notification.permission !== 'granted') {
      // 尝试请求权限
      const granted = await requestNotificationPermission()
      if (!granted) {
        return false
      }
    }
    
    // 发送通知
    const notification = showNotification(habit.name, {
      body: `是时候完成你的习惯: ${habit.description}`,
      icon: '/favicon.svg',
      tag: `habit-reminder-${habit.id}`,
      data: {
        habitId: habit.id,
        habitName: habit.name
      },
      onClick: () => {
        // 点击通知时的处理逻辑
        // 可以在这里添加导航逻辑
      }
    })
    
    if (notification) {
      return true
    } else {
      return false
    }
  } catch (error) {
    return false
  }
}

// 为单个习惯设置提醒定时器
const setupHabitReminders = async (habit) => {
  if (!habit.reminders || habit.reminders.length === 0) {
    return
  }
  
  // 清除该习惯现有的所有定时器
  clearHabitReminders(habit.id)
  
  // 为每个提醒时间设置定时器
  for (const reminderTime of habit.reminders) {
    const delay = calculateReminderDelay(reminderTime)
    
    const timerId = setTimeout(async () => {
      // 检查是否应该发送提醒
      if (shouldSendReminder(habit, reminderTime)) {
        await sendHabitReminder(habit, reminderTime)
      }
      
      // 设置下一次提醒
      setupHabitReminders(habit)
    }, delay)
    
    // 存储定时器ID
    const key = `${habit.id}-${reminderTime}`
    timers.set(key, timerId)
  }
}

// 清除单个习惯的所有提醒定时器
const clearHabitReminders = (habitId) => {
  for (const [key, timerId] of timers.entries()) {
    if (key.startsWith(habitId)) {
      clearTimeout(timerId)
      timers.delete(key)
    }
  }
}

// 设置所有习惯的提醒
const setupAllReminders = async () => {
  try {
    // 清除所有现有定时器
    clearAllReminders()
    
    // 获取所有带有提醒的习惯
    const habits = await getHabitsWithReminders()
    
    // 检查提醒设置
    const settings = await getReminderSettings()
    if (!settings.enabled) {
      console.log('[REMINDER] 提醒已全局禁用，不设置任何提醒')
      return
    }
    
    // 为每个习惯设置提醒
    for (const habit of habits) {
      await setupHabitReminders(habit)
    }
    
    console.log('[REMINDER] 已设置所有习惯提醒，共', habits.length, '个习惯')
  } catch (error) {
    console.error('[REMINDER] 设置提醒时发生错误:', error)
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
  await setupHabitReminders(habit)
}

// 监听提醒设置变化
const handleReminderSettingsChange = async () => {
  await setupAllReminders()
}

// 初始化提醒调度
const initReminderScheduler = async () => {
  // 尝试请求通知权限
  await requestNotificationPermission()
  
  // 设置所有提醒
  await setupAllReminders()
  
  // Check every minute (as a backup mechanism)
  setInterval(async () => {
    try {
      const habits = await getHabitsWithReminders()
      const settings = await getReminderSettings()
      
      if (settings.enabled && Notification.permission === 'granted') {
        for (const habit of habits) {
          for (const reminderTime of habit.reminders) {
            if (shouldSendReminder(habit, reminderTime)) {
              await sendHabitReminder(habit, reminderTime)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error during per-minute check:', error)
    }
  }, 60000) // Check every minute
}

export {
  initReminderScheduler,
  setupAllReminders,
  clearAllReminders,
  handleHabitChange,
  handleReminderSettingsChange,
  setupHabitReminders,
  clearHabitReminders
}