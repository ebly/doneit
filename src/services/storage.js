import localforage from 'localforage'
import { handleHabitChange, handleReminderSettingsChange, clearHabitReminders } from './reminderScheduler'

// Convert date to local date string (YYYY-MM-DD format)
const formatDateToLocal = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Convert date to local datetime string (YYYY-MM-DD HH:mm format)
const formatDateTimeToLocal = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

// Extract date string from completion record (supports both old string format and new object format)
// Used for date comparison (only cares about YYYY-MM-DD)
const extractDateFromCompletion = (completion) => {
  if (typeof completion === 'string') {
    // Old format: "YYYY-MM-DD" or "YYYY-MM-DD HH:mm"
    return completion.split(' ')[0]
  } else if (completion && typeof completion === 'object' && completion.dateTime) {
    // New format: { dateTime: "YYYY-MM-DD HH:mm", timestamp: number }
    return completion.dateTime.split(' ')[0]
  }
  return null
}

// Initialize localforage
localforage.config({
  name: 'DoneIt',
  storeName: 'habits',
  description: 'User data for DoneIt habit tracking application',
  driver: localforage.INDEXEDDB // 强制使用 IndexedDB，避免创建 blob 检测键
})

// Sample habit data
const sampleHabits = [
  {
    id: '1',
    name: 'Morning Exercise',
    description: 'Exercise for 30 minutes every morning at 6 AM',
    frequency: 'daily',
    reminders: ['06:00'], // Reminder times array
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
    name: 'Sleeping',
    description: 'Sleep early for 8 hours every night',
    frequency: 'daily',
    reminders: ['22:00'],
    daysPerWeek: ['0', '1', '2', '3', '4', '5', '6'],
    createdAt: new Date().toISOString(),
    completedDates: []
  }
]

// Sample reminder settings
const sampleReminderSettings = {
  enabled: true,
  soundEnabled: true,
  vibrationEnabled: true
}

// Initialize database, add sample data if no data exists
const initDatabase = async () => {
  try {
    // Initialize habit data
    const habits = await localforage.getItem('habits')
    if (!habits || habits.length === 0) {
      await localforage.setItem('habits', sampleHabits)
    }
  } catch (error) {
    console.error('Database initialization failed:', error)
  }
}

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
      reminders: habit.reminders || [],
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
    
    // Notify reminder scheduler that habit has been deleted, clear related timers
    clearHabitReminders(id)
    
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
      // New completion - store with timestamp
      const completionRecord = {
        dateTime: formatDateTimeToLocal(date),
        timestamp: date.getTime()
      }
      habit.completedDates.push(completionRecord)
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

// Convert completion record to standard object format
// For old string data, treat as 00:00
const normalizeCompletion = (completion) => {
  if (typeof completion === 'string') {
    // Old format: "YYYY-MM-DD" or "YYYY-MM-DD HH:mm"
    const parts = completion.split(' ')
    const dateStr = parts[0]
    const timeStr = parts[1] || '00:00' // Default to 00:00 if no time
    const [year, month, day] = dateStr.split('-').map(Number)
    const [hours, minutes] = timeStr.split(':').map(Number)
    const completionDate = new Date(year, month - 1, day, hours, minutes)
    
    return {
      dateTime: `${dateStr} ${timeStr}`,
      timestamp: completionDate.getTime()
    }
  }
  // Already in object format
  return completion
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
    const reminderSettings = await localforage.getItem('reminderSettings')
    
    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      habits: habits || [],
      reminderSettings: reminderSettings || {}
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
        console.log('[DEBUG] Data exported to:', handle.name)
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
          
          // Validate data format
          if (Array.isArray(importedData)) {
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

// Get reminder settings
export const getReminderSettings = async () => {
  try {
    const settings = await localforage.getItem('reminderSettings')
    return settings || sampleReminderSettings
  } catch (error) {
    console.error('Get reminder settings failed:', error)
    return sampleReminderSettings
  }
}

// Update reminder settings
export const updateReminderSettings = async (settings) => {
  try {
    const currentSettings = await getReminderSettings()
    const newSettings = { ...currentSettings, ...settings }
    await localforage.setItem('reminderSettings', newSettings)
    
    // Notify reminder scheduler that settings have been updated
    handleReminderSettingsChange()
    
    return newSettings
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

// Migrate old completion records to new format
export const migrateCompletionRecords = async () => {
  try {
    const habits = await getHabits()
    let migrated = false
    
    habits.forEach(habit => {
      if (habit.completedDates) {
        const newCompletedDates = habit.completedDates.map(completion => {
          if (typeof completion === 'string' || (completion && !completion.timestamp)) {
            migrated = true
            return normalizeCompletion(completion)
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
      console.log('[DEBUG] Migrated completion records to new format')
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
      console.log(`[DEBUG] Removed records for date: ${targetDate}`)
      return true
    }
    
    return false
  } catch (error) {
    console.error('Remove records by date failed:', error)
    return false
  }
}

// Initialize database
initDatabase()

// Expose clear data function to global for debugging
if (typeof window !== 'undefined') {
  window.clearDoneItData = async () => {
    await clearAllData()
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
  getHabitsWithReminders,
  migrateCompletionRecords,
  removeRecordsByDate
}