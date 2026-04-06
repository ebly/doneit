/**
 * 模拟数据生成工具
 * 使用方法：在浏览器控制台执行 generateMockData()
 */

/**
 * 生成过去 2 周的模拟数据
 * @param {Function} getHabits - 获取所有习惯的方法
 * @param {Function} updateHabit - 更新习惯的方法
 * @param {Function} loadHabits - 重新加载习惯的方法
 */
export const generateMockData = async (getHabits, updateHabit, loadHabits) => {
  try {
    console.log('[INFO] 开始生成模拟数据...')
    
    const habits = await getHabits()
    
    if (!habits || habits.length === 0) {
      console.log('[INFO] 没有找到习惯数据，请先在应用中创建习惯')
      return
    }
    
    const today = new Date()
    const twoWeeksAgo = new Date(today)
    twoWeeksAgo.setDate(today.getDate() - 14)
    
    // 为每个习惯生成随机的完成日期
    for (const habit of habits) {
      const completedDates = []
      
      // 遍历过去 14 天
      for (let d = new Date(twoWeeksAgo); d <= today; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0] // YYYY-MM-DD
        
        // 检查这一天是否在习惯的 daysPerWeek 中
        const dayOfWeek = d.getDay().toString()
        const shouldCompleteOnThisDay = habit.daysPerWeek.includes(dayOfWeek)
        
        if (shouldCompleteOnThisDay) {
          // 70% 的概率完成习惯
          const completed = Math.random() < 0.7
          if (completed) {
            // 基于提醒时间生成随机时间（前后 1 小时范围，分钟随机）
            let timeStr
            if (habit.reminders && habit.reminders.length > 0) {
              // 随机选择一个提醒时间
              const randomReminder = habit.reminders[Math.floor(Math.random() * habit.reminders.length)]
              const [reminderHour, reminderMinute] = randomReminder.split(':').map(Number)
              
              // 在提醒时间前后 1 小时内随机（-1 小时到 +1 小时）
              const hourOffset = Math.floor(Math.random() * 3) - 1 // -1, 0, 1
              
              let hour = reminderHour + hourOffset
              // 分钟在 0-59 之间随机
              let minute = Math.floor(Math.random() * 60)
              
              // 处理小时进位和借位（24 小时制）
              hour = ((hour % 24) + 24) % 24
              
              timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
            } else {
              // 如果没有提醒时间，使用完全随机的时间
              const hour = Math.floor(Math.random() * 24)
              const minute = Math.floor(Math.random() * 60)
              timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
            }
            completedDates.push(`${dateStr} ${timeStr}`)
          }
        }
      }
      
      // 更新习惯的完成日期（只更新 completedDates 字段）
      const updateData = { completedDates }
      await updateHabit(habit.id, updateData)
      
      console.log(`[INFO] 为习惯 "${habit.name}" 生成了 ${completedDates.length} 条完成记录`)
    }
    
    // 重新加载数据
    await loadHabits()
    
    console.log('[INFO] 模拟数据生成完成！')
  } catch (error) {
    console.error('[ERROR] 生成模拟数据失败:', error)
  }
}
