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
    if (!habits || habits.length === 0) {
      return false
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
