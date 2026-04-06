import localforage from 'localforage'
import { handleHabitChange, handleReminderSettingsChange, clearHabitReminders } from './reminderScheduler'

// 将日期转换为本地日期字符串（YYYY-MM-DD 格式）
const formatDateToLocal = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 初始化 localforage
localforage.config({
  name: 'DoneIt',
  storeName: 'habits',
  description: '存储 DoneIt 习惯跟踪应用的用户数据'
})

// 示例习惯数据
const sampleHabits = [
  {
    id: '1',
    name: 'Morning Exercise',
    description: 'Exercise for 30 minutes every morning at 6 AM',
    frequency: 'daily',
    reminders: ['06:00'], // 提醒时间数组
    daysPerWeek: ['1', '2', '3', '4', '5'],
    createdAt: new Date().toISOString(),
    completedDates: []
  },
  {
    id: '2',
    name: 'Reading',
    description: 'Read for 1 hour every day',
    frequency: 'daily',
    reminders: ['20:00'],
    daysPerWeek: ['0', '1', '2', '3', '4', '5', '6'],
    createdAt: new Date().toISOString(),
    completedDates: []
  },
  {
    id: '3',
    name: 'Learning Code',
    description: 'Learn programming for 2 hours every day',
    frequency: 'daily',
    reminders: ['19:00'],
    daysPerWeek: ['1', '2', '3', '4', '5'],
    createdAt: new Date().toISOString(),
    completedDates: []
  }
]

// 示例提醒设置
const sampleReminderSettings = {
  enabled: true,
  soundEnabled: true,
  vibrationEnabled: true
}

// 初始化数据库，如果没有数据则添加示例数据
const initDatabase = async () => {
  try {
    // 初始化习惯数据
    const habits = await localforage.getItem('habits')
    if (!habits || habits.length === 0) {
      await localforage.setItem('habits', sampleHabits)
      console.log('[DEBUG] 数据库初始化完成，已添加示例习惯', sampleHabits)
    } else {
      console.log('[DEBUG] 数据库已存在，已加载', habits.length, '个习惯')
    }
    
    // 初始化提醒设置
    const reminderSettings = await localforage.getItem('reminderSettings')
    if (!reminderSettings) {
      await localforage.setItem('reminderSettings', sampleReminderSettings)
      console.log('[DEBUG] 提醒设置初始化完成，已添加默认设置', sampleReminderSettings)
    } else {
      console.log('[DEBUG] 提醒设置已存在', reminderSettings)
    }
  } catch (error) {
    console.error('[DEBUG] 初始化数据库失败:', error)
  }
}

// 获取所有习惯
export const getHabits = async () => {
  try {
    const habits = await localforage.getItem('habits')
    console.log('[DEBUG] 获取所有习惯:', habits || [])
    return habits || []
  } catch (error) {
    console.error('[DEBUG] 获取习惯失败:', error)
    return []
  }
}

// 获取单个习惯
export const getHabit = async (id) => {
  try {
    const habits = await getHabits()
    return habits.find(habit => habit.id === id)
  } catch (error) {
    console.error('获取单个习惯失败:', error)
    return null
  }
}

// 添加习惯
export const addHabit = async (habit) => {
  try {
    const habits = await getHabits()
    const newHabit = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      completedDates: [],
      reminders: habit.reminders || [],
      ...habit
    }
    habits.push(newHabit)
    await localforage.setItem('habits', habits)
    console.log('[DEBUG] 成功添加习惯:', newHabit)
    
    // 通知提醒调度器新习惯已添加
    handleHabitChange(newHabit)
    
    return newHabit
  } catch (error) {
    console.error('[DEBUG] 添加习惯失败:', error)
    return null
  }
}

// 更新习惯
export const updateHabit = async (id, updatedData) => {
  try {
    const habits = await getHabits()
    const index = habits.findIndex(habit => habit.id === id)
    if (index === -1) {
      console.log('[DEBUG] 未找到要更新的习惯，ID:', id)
      return null
    }
    
    console.log('[DEBUG] 原始习惯数据:', habits[index])
    console.log('[DEBUG] 更新数据:', updatedData)
    
    const updatedHabit = {
      ...habits[index],
      ...updatedData
    }
    
    console.log('[DEBUG] 更新后的习惯数据:', updatedHabit)
    
    habits[index] = updatedHabit
    await localforage.setItem('habits', habits)
    console.log('[DEBUG] 成功更新习惯:', updatedHabit)
    
    // 通知提醒调度器习惯已更新
    handleHabitChange(updatedHabit)
    
    return updatedHabit
  } catch (error) {
    console.error('[DEBUG] 更新习惯失败:', error)
    return null
  }
}

// 删除习惯
export const deleteHabit = async (id) => {
  try {
    const habits = await getHabits()
    const filteredHabits = habits.filter(habit => habit.id !== id)
    
    if (filteredHabits.length === habits.length) {
      console.log('[DEBUG] 未找到要删除的习惯，ID:', id)
      return false // 没有找到要删除的习惯
    }
    
    await localforage.setItem('habits', filteredHabits)
    console.log('[DEBUG] 成功删除习惯，ID:', id)
    console.log('[DEBUG] 删除后剩余习惯数量:', filteredHabits.length)
    
    // 通知提醒调度器习惯已删除，清除相关提醒定时器
    clearHabitReminders(id)
    
    return true
  } catch (error) {
    console.error('[DEBUG] 删除习惯失败:', error)
    return false
  }
}

// 切换习惯完成状态
export const toggleHabitComplete = async (id, date) => {
  try {
    const habits = await getHabits()
    const habit = habits.find(habit => habit.id === id)
    
    if (!habit) {
      console.log('[DEBUG] 未找到要切换完成状态的习惯，ID:', id)
      return false
    }
    
    const dateStr = formatDateToLocal(date)
    const index = habit.completedDates.indexOf(dateStr)
    
    if (index === -1) {
      habit.completedDates.push(dateStr)
      console.log('[DEBUG] 标记习惯为完成:', habit.name, '日期:', dateStr)
    } else {
      habit.completedDates.splice(index, 1)
      console.log('[DEBUG] 取消习惯完成状态:', habit.name, '日期:', dateStr)
    }
    
    await localforage.setItem('habits', habits)
    console.log('[DEBUG] 习惯完成状态更新后:', habit)
    return habit
  } catch (error) {
    console.error('[DEBUG] 切换习惯完成状态失败:', error)
    return false
  }
}

// 检查习惯在特定日期是否完成
export const isHabitCompleted = async (id, date) => {
  try {
    const habit = await getHabit(id)
    if (!habit) return false
    
    const dateStr = formatDateToLocal(date)
    return habit.completedDates.includes(dateStr)
  } catch (error) {
    console.error('检查习惯完成状态失败:', error)
    return false
  }
}

// 导出数据（支持自定义路径）
export const exportData = async () => {
  try {
    const habits = await localforage.getItem('habits')
    const reminderSettings = await localforage.getItem('reminderSettings')
    
    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      habits: habits || [],
      reminderSettings: reminderSettings || {}
    }
    
    const jsonString = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    
    // 尝试使用 File System Access API（支持自定义路径）
    if (typeof window.showSaveFilePicker === 'function') {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: `doneit-backup-${new Date().toISOString().split('T')[0]}.json`,
          types: [{
            description: 'JSON File',
            accept: { 'application/json': ['.json'] }
          }]
        })
        const writable = await handle.createWritable()
        await writable.write(blob)
        await writable.close()
        console.log('[DEBUG] 数据已导出到:', handle.name)
        return true
      } catch (err) {
        // 用户取消或 API 不支持，回退到传统下载方式
        if (err.name === 'AbortError') {
          console.log('[DEBUG] 用户取消了保存操作')
          return false
        }
        console.log('[DEBUG] File System Access API 失败，使用传统下载方式')
      }
    }
    
    // 传统下载方式
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `doneit-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    console.log('[DEBUG] 数据已下载')
    return true
  } catch (error) {
    console.error('导出数据失败:', error)
    return false
  }
}

// 导入数据
export const importData = async (file) => {
  try {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = async (e) => {
        try {
          const importedData = JSON.parse(e.target.result)
          
          // 验证数据格式
          if (Array.isArray(importedData)) {
            await localforage.setItem('habits', importedData)
            resolve(true)
          } else {
            reject(new Error('无效的数据格式'))
          }
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = () => {
        reject(new Error('文件读取失败'))
      }
      
      reader.readAsText(file)
    })
  } catch (error) {
    console.error('导入数据失败:', error)
    return false
  }
}

// 清空所有数据
export const clearAllData = async () => {
  try {
    await localforage.clear()
    return true
  } catch (error) {
    console.error('清空数据失败:', error)
    return false
  }
}

// 获取数据统计信息
export const getDataStats = async () => {
  try {
    const habits = await getHabits()
    const totalHabits = habits.length
    const totalCompletions = habits.reduce((sum, habit) => sum + habit.completedDates.length, 0)
    
    return {
      totalHabits,
      totalCompletions,
      activeHabits: habits.length
    }
  } catch (error) {
    console.error('获取数据统计失败:', error)
    return {
      totalHabits: 0,
      totalCompletions: 0,
      activeHabits: 0
    }
  }
}

// 获取提醒设置
export const getReminderSettings = async () => {
  try {
    const settings = await localforage.getItem('reminderSettings')
    return settings || sampleReminderSettings
  } catch (error) {
    console.error('[DEBUG] 获取提醒设置失败:', error)
    return sampleReminderSettings
  }
}

// 更新提醒设置
export const updateReminderSettings = async (settings) => {
  try {
    const currentSettings = await getReminderSettings()
    const newSettings = { ...currentSettings, ...settings }
    await localforage.setItem('reminderSettings', newSettings)
    console.log('[DEBUG] 提醒设置已更新:', newSettings)
    
    // 通知提醒调度器设置已更新
    handleReminderSettingsChange()
    
    return newSettings
  } catch (error) {
    console.error('[DEBUG] 更新提醒设置失败:', error)
    return null
  }
}

// 为习惯添加提醒时间
export const addHabitReminder = async (habitId, time) => {
  try {
    const habits = await getHabits()
    const habit = habits.find(h => h.id === habitId)
    
    if (!habit) {
      console.log('[DEBUG] 未找到要添加提醒的习惯，ID:', habitId)
      return false
    }
    
    // 确保reminders字段存在
    if (!habit.reminders) {
      habit.reminders = []
    }
    
    // 避免重复的提醒时间
    if (!habit.reminders.includes(time)) {
      habit.reminders.push(time)
      // 按时间排序
      habit.reminders.sort()
      
      await localforage.setItem('habits', habits)
      console.log('[DEBUG] 为习惯添加提醒时间:', habit.name, '时间:', time)
      return true
    }
    
    return false
  } catch (error) {
    console.error('[DEBUG] 为习惯添加提醒失败:', error)
    return false
  }
}

// 从习惯中移除提醒时间
export const removeHabitReminder = async (habitId, time) => {
  try {
    const habits = await getHabits()
    const habit = habits.find(h => h.id === habitId)
    
    if (!habit || !habit.reminders) {
      console.log('[DEBUG] 未找到要移除提醒的习惯或提醒列表，ID:', habitId)
      return false
    }
    
    const initialLength = habit.reminders.length
    habit.reminders = habit.reminders.filter(t => t !== time)
    
    if (habit.reminders.length !== initialLength) {
      await localforage.setItem('habits', habits)
      console.log('[DEBUG] 从习惯移除提醒时间:', habit.name, '时间:', time)
      return true
    }
    
    return false
  } catch (error) {
    console.error('[DEBUG] 从习惯移除提醒失败:', error)
    return false
  }
}

// 获取所有带有提醒的习惯
export const getHabitsWithReminders = async () => {
  try {
    const habits = await getHabits()
    return habits.filter(habit => habit.reminders && habit.reminders.length > 0)
  } catch (error) {
    console.error('[DEBUG] 获取带提醒的习惯失败:', error)
    return []
  }
}

// 初始化数据库
initDatabase()

// 将清除数据函数暴露到全局，方便调试
if (typeof window !== 'undefined') {
  window.clearDoneItData = async () => {
    await clearAllData()
    console.log('[DEBUG] 数据已清除，请刷新页面')
    location.reload()
  }
}

export default {
  getHabits,
  getHabit,
  addHabit,
  updateHabit,
  deleteHabit,
  toggleHabitComplete,
  isHabitCompleted,
  exportData,
  importData,
  clearAllData,
  getDataStats,
  getReminderSettings,
  updateReminderSettings,
  addHabitReminder,
  removeHabitReminder,
  getHabitsWithReminders
}