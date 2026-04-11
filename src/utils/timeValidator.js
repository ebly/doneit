/**
 * 时间防作弊验证工具
 * 用于检测系统时间篡改，防止通过修改本地时间绕过时间限制
 */

// 存储键名
const STORAGE_KEY_SERVER_TIME = 'server_time_offset'
const STORAGE_KEY_TIME_CHECKS = 'time_check_records'

// 配置常量
const CONFIG = {
  // 服务器时间与本地时间允许的最大偏差（5 分钟）
  MAX_TIME_OFFSET: 5 * 60 * 1000,
  // 本地时间回拨允许的最大偏差（1 分钟）
  MAX_TIME_REWIND: 60 * 1000,
  // 时间检查记录最大保留数量
  MAX_RECORDS: 10,
  // 网络请求超时时间（3 秒）
  REQUEST_TIMEOUT: 3000
}

/**
 * 获取服务器时间（使用网络时间 API）
 * @returns {Promise<number|null>} 服务器时间戳（毫秒），失败返回 null
 */
export const getServerTime = async () => {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT)
    
    const response = await fetch('https://worldtimeapi.org/api/ip', { 
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    })
    clearTimeout(timeoutId)
    
    if (response.ok) {
      const data = await response.json()
      return new Date(data.datetime).getTime()
    }
  } catch (error) {
    console.warn('Failed to get server time, using fallback:', error)
  }
  
  return null
}

/**
 * 检查系统时间是否被篡改
 * @returns {Promise<{valid: boolean, message?: string}>} 验证结果
 */
export const checkTimeTampering = async () => {
  const now = Date.now()
  const serverTime = await getServerTime()
  
  // 获取上次记录的时间检查点
  const timeChecks = JSON.parse(localStorage.getItem(STORAGE_KEY_TIME_CHECKS) || '[]')
  
  if (timeChecks.length > 0) {
    const lastCheck = timeChecks[timeChecks.length - 1]
    
    // 如果服务器时间可用，检查是否与上次记录的时间一致
    if (serverTime) {
      // 记录服务器时间与本地时间的偏移
      const offset = serverTime - now
      localStorage.setItem(STORAGE_KEY_SERVER_TIME, JSON.stringify({ offset, timestamp: now }))
      
      // 如果本地时间与服务器时间差异超过允许范围，可能是时间篡改
      if (Math.abs(offset) > CONFIG.MAX_TIME_OFFSET) {
        return { 
          valid: false, 
          message: 'System time appears to be incorrect. Please check your system clock.' 
        }
      }
    }
    
    // 检查本地时间是否回拨
    if (now < lastCheck.localTime) {
      const timeDifference = lastCheck.localTime - now
      if (timeDifference > CONFIG.MAX_TIME_REWIND) {
        return { 
          valid: false, 
          message: 'System time has been set back. Please use the correct system time.' 
        }
      }
    }
  }
  
  // 记录当前时间检查点
  timeChecks.push({
    localTime: now,
    serverTime: serverTime || null,
    timestamp: new Date().toISOString()
  })
  
  // 只保留最近的记录
  if (timeChecks.length > CONFIG.MAX_RECORDS) {
    timeChecks.shift()
  }
  localStorage.setItem(STORAGE_KEY_TIME_CHECKS, JSON.stringify(timeChecks))
  
  return { valid: true }
}

/**
 * 验证时间并执行检查回调
 * @param {Function} onValid - 验证通过时的回调函数
 * @returns {Promise<{valid: boolean, message?: string}>} 验证结果
 */
export const validateTime = async (onValid) => {
  const result = await checkTimeTampering()
  
  if (!result.valid) {
    return result
  }
  
  if (onValid) {
    await onValid()
  }
  
  return { valid: true }
}

/**
 * 清除时间验证记录（用于测试或重置）
 */
export const clearTimeRecords = () => {
  localStorage.removeItem(STORAGE_KEY_TIME_CHECKS)
  localStorage.removeItem(STORAGE_KEY_SERVER_TIME)
}

/**
 * 获取上次服务器时间偏移量
 * @returns {{offset: number, timestamp: number}|null} 偏移量信息
 */
export const getLastServerOffset = () => {
  const data = localStorage.getItem(STORAGE_KEY_SERVER_TIME)
  return data ? JSON.parse(data) : null
}

/**
 * 获取时间检查历史记录
 * @returns {Array} 时间检查记录数组
 */
export const getTimeCheckHistory = () => {
  return JSON.parse(localStorage.getItem(STORAGE_KEY_TIME_CHECKS) || '[]')
}

export default {
  getServerTime,
  checkTimeTampering,
  validateTime,
  clearTimeRecords,
  getLastServerOffset,
  getTimeCheckHistory,
  CONFIG
}
