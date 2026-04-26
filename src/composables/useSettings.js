import { ref } from 'vue'

const username = ref('')
const avatar = ref('')
const language = ref(localStorage.getItem('language') || 'en')

const initSettings = () => {
  username.value = localStorage.getItem('username') || ''
  avatar.value = localStorage.getItem('avatar') || ''
  language.value = localStorage.getItem('language') || 'en'
}

export const useSettings = () => {
  const setUsername = (name) => {
    username.value = name
    localStorage.setItem('username', name)
  }

  const setAvatar = (data) => {
    avatar.value = data
    localStorage.setItem('avatar', data)
  }

  const setLanguage = (lang) => {
    language.value = lang
    localStorage.setItem('language', lang)
  }

  const clearAvatar = () => {
    avatar.value = ''
    localStorage.setItem('avatar', '')
  }

  return {
    username,
    avatar,
    language,
    setUsername,
    setAvatar,
    setLanguage,
    clearAvatar,
    initSettings
  }
}
