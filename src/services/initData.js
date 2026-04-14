/**
 * 基础数据初始化服务
 * 用于在应用首次运行时初始化基础习惯数据
 */

import localforage from 'localforage'
import { getHabits } from './storage'

// 基础习惯模板
const BASIC_HABITS = [
  {
    id: '1',
    name: '🏃‍♂️ Morning Exercise',
    description: 'Exercise for 30 minutes every morning at 6 AM',
    frequency: 'daily',
    reminders: ['06:00'],
    daysPerWeek: ['1', '2', '3', '4', '5'],
    createdAt: null,
    completedDates: []
  }
]

/**
 * 初始化基础习惯数据
 * 仅在没有任何习惯时执行
 */
export const initializeBasicData = async () => {
  try {
    const habits = await getHabits()
    
    console.log('[InitData] Current habits:', habits)
    console.log('[InitData] Habits length:', habits ? habits.length : 'null')
    console.log('[InitData] Habits is empty:', !habits || habits.length === 0)
    
    // 只有在确实没有任何习惯时才初始化
    if (!habits || habits.length === 0) {
      console.log('[InitData] No habits found, initializing basic data...')
      
      const now = new Date()
      const currentHour = String(now.getHours()).padStart(2, '0')
      const currentMinute = String(now.getMinutes()).padStart(2, '0')
      const currentTime = `${currentHour}:${currentMinute}`
      
      console.log(`[InitData] Current time: ${currentTime}`)
      
      // 创建 1 条基础习惯，使用用户打开网页的时间作为提醒时间
      const habitToCreate = {
        id: '1',
        name: 'Testing',
        description: 'Test habit for tracking',
        frequency: 'daily',
        reminders: [currentTime],  // 使用当前时间
        daysPerWeek: ['0', '1', '2', '3', '4', '5', '6'],  // 每天
        createdAt: now.toISOString(),
        completedDates: []
      }
      
      console.log('[InitData] Creating habit:', habitToCreate)
      
      // 直接写入数据库
      await localforage.setItem('habits', [habitToCreate])
      
      console.log('[InitData] Basic habits initialized successfully!')
      console.log(`[InitData] Reminder time set to: ${currentTime} (current time)`)
      
      // 刷新页面以显示新数据
      setTimeout(() => {
        window.location.reload()
      }, 500)
      
      return true
    }
    
    return false
  } catch (error) {
    console.error('[InitData] Failed to initialize basic data:', error)
    throw error
  }
}

/**
 * 获取基础习惯模板（可用于重置或参考）
 */
export const getBasicHabitTemplates = () => {
  return BASIC_HABITS.map(habit => ({ ...habit }))
}

export default {
  initializeBasicData,
  getBasicHabitTemplates
}
