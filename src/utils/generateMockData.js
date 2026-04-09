/**
 * 生成过去 3-4 个月的模拟数据
 * @param {Function} getHabits - 获取所有习惯的方法
 * @param {Function} updateHabit - 更新习惯的方法
 * @param {Function} loadHabits - 重新加载习惯的方法
 */
export const generateMockData = async (getHabits, updateHabit, loadHabits) => {
  try {
    const habits = await getHabits()
    
    if (!habits || habits.length === 0) {
      return
    }
    
    const today = new Date()
    // 获取当前月份的 1 号
    const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    // 从 4 个月前的 1 号开始生成数据
    const startDate = new Date(firstDayOfCurrentMonth)
    startDate.setMonth(startDate.getMonth() - 4) // 4 个月前的 1 号
    
    // 只生成到昨天的数据（不包含今天和未来）
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    // 为每个习惯生成随机的完成日期
    for (const habit of habits) {
      const completedDates = []
      
      // 遍历从 startDate 到 yesterday 的所有日期
      for (let d = new Date(startDate); d <= yesterday; d.setDate(d.getDate() + 1)) {
        // 使用本地时间格式化，避免时区问题
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        const dateStr = `${year}-${month}-${day}`
        
        // 检查这一天是否在习惯的 daysPerWeek 中
        const dayOfWeek = d.getDay().toString()
        const shouldCompleteOnThisDay = habit.daysPerWeek && habit.daysPerWeek.includes(dayOfWeek)
        
        if (shouldCompleteOnThisDay) {
          // 70% 的概率完成习惯
          const completed = Math.random() < 0.7
          if (completed) {
            // Generate random time based on reminder time (±1 Hour range)
            let timeStr
            if (habit.reminders && habit.reminders.length > 0) {
              // 随机选择一个提醒时间
              const randomReminder = habit.reminders[Math.floor(Math.random() * habit.reminders.length)]
              const [reminderHour, reminderMinute] = randomReminder.split(':').map(Number)
              
              // Random within ±1 Hour of reminder time (-60 minutes to +60 minutes)
              const minuteOffset = Math.floor(Math.random() * 121) - 60 // -60 到 +60
              
              let totalMinutes = reminderHour * 60 + reminderMinute + minuteOffset
              
              // Handle cross-day situation (24 Hour format)
              totalMinutes = ((totalMinutes % 1440) + 1440) % 1440
              
              const hour = Math.floor(totalMinutes / 60)
              const minute = totalMinutes % 60
              
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
    }
    
    // 重新加载数据
    await loadHabits()
  } catch (error) {
    console.error('生成模拟数据失败:', error)
  }
}
