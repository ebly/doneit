/**
 * 浏览器Notification API 使用说明
 * 
 * 权限要求：
 * 1. 必须在安全上下文(HTTPS)中使用
 * 2. 需要用户明确授权
 * 3. 必须在用户交互后才能请求权限
 * 
 * 使用限制：
 * 1. 浏览器可能限制通知频率
 * 2. 浏览器可能会静默禁用通知
 * 3. 关闭浏览器后，定时器会停止
 * 4. 在移动设备上行为可能不同
 */

// 检查浏览器是否支持通知API
export const isNotificationSupported = () => {
  return 'Notification' in window
}

// 请求通知权限
export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) {
    console.log('[NOTIFICATION] 浏览器不支持通知功能')
    return false
  }

  try {
    const permission = await Notification.requestPermission()
    console.log('[NOTIFICATION] 权限请求结果:', permission)
    return permission === 'granted'
  } catch (error) {
    console.error('[NOTIFICATION] 请求权限失败:', error)
    return false
  }
}

// 获取当前通知权限状态
export const getNotificationPermission = () => {
  if (!isNotificationSupported()) {
    return 'unsupported'
  }
  return Notification.permission
}

// 显示通知
export const showNotification = (title, options = {}) => {
  if (!isNotificationSupported()) {
    console.log('[NOTIFICATION] 浏览器不支持通知功能')
    return null
  }

  if (Notification.permission !== 'granted') {
    console.log('[NOTIFICATION] 通知权限未授予')
    return null
  }

  try {
    const notification = new Notification(title, {
      body: options.body || '',
      icon: options.icon || '/favicon.svg',
      badge: options.badge || '/favicon.svg',
      tag: options.tag || '',
      data: options.data || {},
      ...options
    })

    // 设置通知点击事件
    if (options.onClick) {
      notification.onclick = options.onClick
    }

    // 设置通知关闭事件
    if (options.onClose) {
      notification.onclose = options.onClose
    }

    // 设置通知错误事件
    if (options.onError) {
      notification.onerror = options.onError
    }

    console.log('[NOTIFICATION] 通知显示成功:', notification)
    return notification
  } catch (error) {
    console.error('[NOTIFICATION] 显示通知失败:', error)
    return null
  }
}

// 关闭通知
export const closeNotification = (notification) => {
  if (notification && notification.close) {
    notification.close()
    console.log('[NOTIFICATION] 通知已关闭')
  }
}

// 示例：为习惯创建提醒
export const createHabitReminder = (habit, time) => {
  return {
    id: Date.now().toString(),
    habitId: habit.id,
    habitName: habit.name,
    time: time, // 格式: "HH:MM"
    enabled: true,
    lastSent: null
  }
}

// Parse time string to Hour and Minute
export const parseTime = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return { hours, minutes }
}

// 计算下次提醒时间
export const calculateNextReminderTime = (timeStr) => {
  const now = new Date()
  const { hours, minutes } = parseTime(timeStr)
  const nextTime = new Date()
  nextTime.setHours(hours, minutes, 0, 0)

  // 如果时间已过，设置为明天的同一时间
  if (nextTime <= now) {
    nextTime.setDate(nextTime.getDate() + 1)
  }

  return nextTime
}

// 计算提醒延迟时间（毫秒）
export const calculateReminderDelay = (timeStr) => {
  const now = new Date()
  const nextTime = calculateNextReminderTime(timeStr)
  return nextTime - now
}