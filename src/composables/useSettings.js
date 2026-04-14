import { ref } from 'vue'

const deleteOldDatabases = () => {
  indexedDB.deleteDatabase('doneit-db')
  indexedDB.deleteDatabase('local-forage-detect-blob-support')
}

deleteOldDatabases()

const username = ref('')
const avatar = ref('')

const initSettings = () => {
  username.value = localStorage.getItem('username') || ''
  avatar.value = localStorage.getItem('avatar') || ''
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

  const clearAvatar = () => {
    avatar.value = ''
    localStorage.setItem('avatar', '')
  }

  return {
    username,
    avatar,
    setUsername,
    setAvatar,
    clearAvatar,
    initSettings
  }
}
