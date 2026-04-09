import { ref } from 'vue'

/**
 * 主题管理组合式函数
 * @returns {Object} 主题相关的方法和状态
 */
export const useTheme = () => {
  const isDarkMode = ref(false)

  // 初始化主题
  const initTheme = () => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      isDarkMode.value = savedTheme === 'dark'
    } else {
      // 默认使用浅色模式，忽略系统偏好
      isDarkMode.value = false
    }
    applyTheme()
  }

  // 应用主题并保存到本地存储
  const applyTheme = () => {
    if (isDarkMode.value) {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
    // 保存到本地存储
    localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light')
  }

  // 切换主题
  const toggleTheme = () => {
    isDarkMode.value = !isDarkMode.value
    applyTheme()
  }

  return {
    isDarkMode,
    initTheme,
    applyTheme,
    toggleTheme
  }
}
