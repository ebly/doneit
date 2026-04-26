import localforage from 'localforage'
import { handleHabitChange } from './reminderScheduler'
import { formatDateToLocal, extractDateFromCompletion } from '../utils/date.js'

// Convert date to local datetime string (YYYY-MM-DD HH:mm format)
const formatDateTimeToLocal = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

// Initialize localforage for habits
localforage.config({
  name: 'DoneIt',
  storeName: 'habits',
  description: 'User data for DoneIt habit tracking application',
  driver: localforage.INDEXEDDB
})

// Get all habits
export const getHabits = async () => {
  try {
    const habits = await localforage.getItem('habits')
    return habits || []
  } catch (error) {
    console.error('Get habits failed:', error)
    return []
  }
}

// Get single habit
export const getHabit = async (id) => {
  try {
    const habits = await getHabits()
    return habits.find(habit => habit.id === id)
  } catch (error) {
    console.error('Get habit failed:', error)
    return null
  }
}

// Add habit
export const addHabit = async (habit) => {
  try {
    const habits = await getHabits()
    const newHabit = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      completedDates: [],
      // 默认提醒时间：早上 9 点
      reminders: habit.reminders || ['09:00'],
      ...habit
    }
    habits.push(newHabit)
    await localforage.setItem('habits', habits)
    
    // Notify reminder scheduler that new habit has been added
    handleHabitChange(newHabit)
    
    return newHabit
  } catch (error) {
    console.error('Add habit failed:', error)
    return null
  }
}

// Update habit
export const updateHabit = async (id, updatedData) => {
  try {
    const habits = await getHabits()
    const index = habits.findIndex(habit => habit.id === id)
    if (index === -1) {
      return null
    }
    
    const updatedHabit = {
      ...habits[index],
      ...updatedData
    }
    
    habits[index] = updatedHabit
    await localforage.setItem('habits', habits)
    
    // Notify reminder scheduler that habit has been updated
    handleHabitChange(updatedHabit)
    
    return updatedHabit
  } catch (error) {
    console.error('Update habit failed:', error)
    return null
  }
}

// Delete habit
export const deleteHabit = async (id) => {
  try {
    const habits = await getHabits()
    const filteredHabits = habits.filter(habit => habit.id !== id)
    
    if (filteredHabits.length === habits.length) {
      return false // Habit not found
    }
    
    await localforage.setItem('habits', filteredHabits)
    
    return true
  } catch (error) {
    console.error('Delete habit failed:', error)
    return false
  }
}

// Toggle habit completion status
export const toggleHabitComplete = async (id, date) => {
  try {
    const habits = await getHabits()
    const habit = habits.find(habit => habit.id === id)
    
    if (!habit) {
      return false
    }
    
    const dateStr = formatDateToLocal(date)
    
    // Find if already completed on this date
    const existingIndex = habit.completedDates.findIndex(completion => {
      const completionDate = extractDateFromCompletion(completion)
      return completionDate === dateStr
    })
    
    if (existingIndex === -1) {
      // New completion - store as datetime string
      habit.completedDates.push(formatDateTimeToLocal(date))
    } else {
      // Remove completion
      habit.completedDates.splice(existingIndex, 1)
    }
    
    await localforage.setItem('habits', habits)
    return habit
  } catch (error) {
    console.error('Toggle habit completion failed:', error)
    return false
  }
}

// Check if habit is completed on specific date
export const isHabitCompleted = async (id, date) => {
  try {
    const habit = await getHabit(id)
    if (!habit) return false
    
    const dateStr = formatDateToLocal(date)
    return habit.completedDates.some(completion => {
      const completionDate = extractDateFromCompletion(completion)
      return completionDate === dateStr
    })
  } catch (error) {
    console.error('Check habit completion failed:', error)
    return false
  }
}

// Export data (supports custom path)
export const exportData = async () => {
  try {
    const habits = await localforage.getItem('habits')
    
    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      habits: habits || []
    }
    
    const jsonString = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    
    // Try to use File System Access API (supports custom path)
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
        return true
      } catch (err) {
        // User cancelled or API not supported, fallback to traditional download
        if (err.name === 'AbortError') {
          return false
        }
      }
    }
    
    // Traditional download method
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `doneit-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    return true
  } catch (error) {
    console.error('Export data failed:', error)
    return false
  }
}

// Import data
export const importData = async (file) => {
  try {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = async (e) => {
        try {
          const importedData = JSON.parse(e.target.result)
          
          // Validate data format - support both old array format and new object format
          if (importedData && typeof importedData === 'object' && !Array.isArray(importedData) && importedData.habits) {
            // New format: { exportDate, version, habits: [...] }
            await localforage.setItem('habits', importedData.habits)
            resolve(true)
          } else if (Array.isArray(importedData)) {
            // Old format: [...habits]
            await localforage.setItem('habits', importedData)
            resolve(true)
          } else {
            reject(new Error('Invalid data format'))
          }
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = () => {
        reject(new Error('File read failed'))
      }
      
      reader.readAsText(file)
    })
  } catch (error) {
    console.error('Import data failed:', error)
    return false
  }
}

// Clear all data
export const clearAllData = async () => {
  try {
    await localforage.clear()
    return true
  } catch (error) {
    console.error('Clear data failed:', error)
    return false
  }
}

// Get data statistics
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
    console.error('Get data statistics failed:', error)
    return {
      totalHabits: 0,
      totalCompletions: 0,
      activeHabits: 0
    }
  }
}

// Get reminder notification settings
export const getReminderNotificationSettings = async () => {
  try {
    const settingsStr = localStorage.getItem('Notification')
    return settingsStr ? JSON.parse(settingsStr) : true
  } catch (error) {
    console.error('Get reminder notification settings failed:', error)
    return true
  }
}

// Update reminder notification settings
export const updateReminderNotificationSettings = async (enabled) => {
  try {
    localStorage.setItem('Notification', JSON.stringify(enabled))
    return enabled
  } catch (error) {
    console.error('Update reminder notification settings failed:', error)
    return null
  }
}

// Update reminder settings
export const updateReminderSettings = async (settings) => {
  try {
    // 此函数已废弃，提醒设置直接存储在习惯对象中
    console.warn('[DEPRECATED] updateReminderSettings is deprecated')
    return null
  } catch (error) {
    console.error('Update reminder settings failed:', error)
    return null
  }
}

// Add reminder time to habit
export const addHabitReminder = async (habitId, time) => {
  try {
    const habits = await getHabits()
    const habit = habits.find(h => h.id === habitId)
    
    if (!habit) {
      return false
    }
    
    // Ensure reminders field exists
    if (!habit.reminders) {
      habit.reminders = []
    }
    
    // Avoid duplicate reminder times
    if (!habit.reminders.includes(time)) {
      habit.reminders.push(time)
      // Sort by time
      habit.reminders.sort()
      
      await localforage.setItem('habits', habits)
      return true
    }
    
    return false
  } catch (error) {
    console.error('Add habit reminder failed:', error)
    return false
  }
}

// Remove reminder time from habit
export const removeHabitReminder = async (habitId, time) => {
  try {
    const habits = await getHabits()
    const habit = habits.find(h => h.id === habitId)
    
    if (!habit || !habit.reminders) {
      return false
    }
    
    const initialLength = habit.reminders.length
    habit.reminders = habit.reminders.filter(t => t !== time)
    
    if (habit.reminders.length !== initialLength) {
      await localforage.setItem('habits', habits)
      return true
    }
    
    return false
  } catch (error) {
    console.error('Remove habit reminder failed:', error)
    return false
  }
}

// Get all habits with reminders
export const getHabitsWithReminders = async () => {
  try {
    const habits = await getHabits()
    return habits.filter(habit => habit.reminders && habit.reminders.length > 0)
  } catch (error) {
    console.error('Get habits with reminders failed:', error)
    return []
  }
}

// Migrate old completion records to consistent format
// Old records might be just "YYYY-MM-DD", normalize to "YYYY-MM-DD HH:mm"
export const migrateCompletionRecords = async () => {
  try {
    const habits = await getHabits()
    let migrated = false
    
    habits.forEach(habit => {
      if (habit.completedDates) {
        const newCompletedDates = habit.completedDates.map(completion => {
          if (typeof completion === 'string') {
            // Check if it already has time
            const parts = completion.split(' ')
            if (parts.length === 1) {
              // Only date, add default time 00:00
              migrated = true
              return `${parts[0]} 00:00`
            } else if (parts.length === 2) {
              // Already has time, keep as is
              return completion
            }
          }
          return completion
        })
        
        if (migrated) {
          habit.completedDates = newCompletedDates
        }
      }
    })
    
    if (migrated) {
      await localforage.setItem('habits', habits)
      return true
    }
    
    return false
  } catch (error) {
    console.error('Migrate completion records failed:', error)
    return false
  }
}

// Remove specific date from all habits (e.g., remove April 12 records)
export const removeRecordsByDate = async (targetDate) => {
  try {
    const habits = await getHabits()
    let modified = false
    
    habits.forEach(habit => {
      if (habit.completedDates) {
        const initialLength = habit.completedDates.length
        habit.completedDates = habit.completedDates.filter(completion => {
          const completionDate = extractDateFromCompletion(completion)
          return completionDate !== targetDate
        })
        if (habit.completedDates.length !== initialLength) {
          modified = true
        }
      }
    })
    
    if (modified) {
      await localforage.setItem('habits', habits)
      return true
    }
    
    return false
  } catch (error) {
    console.error('Remove records by date failed:', error)
    return false
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
  getReminderNotificationSettings,
  updateReminderNotificationSettings,
  addHabitReminder,
  removeHabitReminder,
  getHabitsWithReminders,
  migrateCompletionRecords,
  removeRecordsByDate
}