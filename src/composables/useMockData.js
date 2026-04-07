import { generateMockData as generateMockDataUtil } from '../utils/generateMockData.js'
import { getHabits, updateHabit } from '../services/storage.js'

/**
 * 加载模拟数据生成脚本（仅开发环境）
 * @param {Function} loadHabits - 加载习惯数据的函数
 */
export const loadMockDataScript = (loadHabits) => {
  try {
    // 将生成函数暴露到全局作用域
    window.generateMockData = () => generateMockDataUtil(getHabits, updateHabit, loadHabits)
    
    // 添加查看 IndexedDB 数据的方法
    window.printHabits = async () => {
      try {
        const habits = await getHabits()
        console.log('===== IndexedDB 中的 Habits 数据 =====')
        console.log(JSON.parse(JSON.stringify(habits)))
        console.log('=====================================')
        console.log(`共 ${habits.length} 个习惯`)
        habits.forEach((habit, index) => {
          console.log(`\n习惯 ${index + 1}:`)
          console.log(`  ID: ${habit.id}`)
          console.log(`  名称：${habit.name}`)
          console.log(`  描述：${habit.description}`)
          console.log(`  频率：${habit.frequency}`)
          console.log(`  每周天数：${habit.daysPerWeek?.length || 0}`)
          console.log(`  完成记录数：${habit.completedDates?.length || 0}`)
          if (habit.completedDates?.length > 0) {
            console.log(`  最近完成：${habit.completedDates.slice(-5).join(', ')}`)
          }
        })
        return habits
      } catch (error) {
        console.error('[ERROR] 获取 habits 失败:', error)
      }
    }
    
    console.log('[INFO] 模拟数据生成脚本已加载')
    console.log('[INFO] 使用方法：在浏览器控制台输入 generateMockData() 并回车')
    console.log('[INFO] 查看数据：在浏览器控制台输入 printHabits() 并回车')
  } catch (error) {
    console.error('[ERROR] 加载模拟数据脚本失败:', error)
  }
}
