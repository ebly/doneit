import { ref } from 'vue'
import localforage from 'localforage'

const deleteOldDatabases = () => {
  indexedDB.deleteDatabase('doneit-db')
  indexedDB.deleteDatabase('local-forage-detect-blob-support')
}

deleteOldDatabases()

const settingsStore = localforage.createInstance({
  name: 'DoneIt',
  storeName: 'settings',
  description: 'Settings for DoneIt application'
})

const username = ref('')
const avatar = ref('')

const initSettings = async () => {
  username.value = await settingsStore.getItem('username') || ''
  avatar.value = await settingsStore.getItem('avatar') || ''
}

export const useSettings = () => {
  const setUsername = async (name) => {
    username.value = name
    await settingsStore.setItem('username', name)
  }

  const setAvatar = async (data) => {
    avatar.value = data
    await settingsStore.setItem('avatar', data)
  }

  const clearAvatar = async () => {
    avatar.value = ''
    await settingsStore.setItem('avatar', '')
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
