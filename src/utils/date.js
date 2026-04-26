/**
 * Shared date utility functions
 * Used across components to avoid duplication
 */

/**
 * Convert date to local date string (YYYY-MM-DD format)
 * @param {Date} date
 * @returns {string}
 */
export const formatDateToLocal = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Extract date string from completion record (supports both old string format and new format)
 * @param {string} completion - "YYYY-MM-DD" or "YYYY-MM-DD HH:mm"
 * @returns {string|null}
 */
export const extractDateFromCompletion = (completion) => {
  if (typeof completion === 'string') {
    return completion.split(' ')[0]
  }
  return null
}

/**
 * Check if a habit is completed on a specific date
 * @param {Object} habit
 * @param {Date} date
 * @returns {boolean}
 */
export const isHabitCompletedOnDate = (habit, date) => {
  if (!habit || !habit.completedDates) return false
  const dateStr = formatDateToLocal(date)
  return habit.completedDates.some(d => {
    const datePart = d.split(' ')[0]
    return datePart === dateStr
  })
}

/**
 * Check if a specific day index is enabled for a habit
 * @param {Object} habit
 * @param {number} dayIndex - 0=Sun, 1=Mon, ..., 6=Sat
 * @returns {boolean}
 */
export const isDayEnabled = (habit, dayIndex) => {
  if (!habit.daysPerWeek || habit.daysPerWeek.length === 0) {
    return true
  }
  return habit.daysPerWeek.includes(dayIndex.toString())
}

/**
 * Check if a date is today
 * @param {Date} date
 * @returns {boolean}
 */
export const isToday = (date) => {
  const today = new Date()
  return date.getFullYear() === today.getFullYear() &&
         date.getMonth() === today.getMonth() &&
         date.getDate() === today.getDate()
}

/**
 * Get today's date string in YYYY-MM-DD format
 * @returns {string}
 */
export const getTodayStr = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

/**
 * Check if habit is completed today
 * @param {Object} habit
 * @returns {boolean}
 */
export const isHabitCompletedToday = (habit) => {
  if (!habit || !habit.completedDates || habit.completedDates.length === 0) {
    return false
  }
  const today = getTodayStr()
  return habit.completedDates.some(d => {
    const datePart = d.split(' ')[0]
    return datePart === today
  })
}
