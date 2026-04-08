import { ref } from 'vue'

const DB_NAME = 'doneit-db'
const STORE_NAME = 'settings'
const DB_VERSION = 1

let db = null

const openDB = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db)
      return
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(request.error)
    
    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }
    
    request.onupgradeneeded = (event) => {
      const database = event.target.result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
  })
}

const getSetting = async (key) => {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(key)
    request.onsuccess = () => resolve(request.result?.value)
    request.onerror = () => reject(request.error)
  })
}

const setSetting = async (key, value) => {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put({ id: key, value })
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

const username = ref('')
const avatar = ref('')

const initSettings = async () => {
  username.value = await getSetting('username') || ''
  avatar.value = await getSetting('avatar') || ''
}

export const useSettings = () => {
  const setUsername = async (name) => {
    username.value = name
    await setSetting('username', name)
  }

  const setAvatar = async (data) => {
    avatar.value = data
    await setSetting('avatar', data)
  }

  const clearAvatar = async () => {
    avatar.value = ''
    await setSetting('avatar', '')
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
