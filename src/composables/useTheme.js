import { ref } from 'vue'

const isDarkMode = ref(false)

export const useTheme = () => {
  const initTheme = () => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      isDarkMode.value = savedTheme === 'dark'
    } else {
      isDarkMode.value = false
    }
    applyTheme()
  }

  const applyTheme = () => {
    if (isDarkMode.value) {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
    localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light')
  }

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
