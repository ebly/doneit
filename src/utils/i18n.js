import { ref, computed } from 'vue'

const currentLang = ref(localStorage.getItem('language') || 'en')

const messages = {
  en: {},
  zh: {}
}

export const setLocale = (lang) => {
  currentLang.value = lang
  localStorage.setItem('language', lang)
}

export const registerLocale = (lang, msg) => {
  messages[lang] = msg
}

export const useI18n = () => {
  const t = computed(() => {
    return (key) => {
      const keys = key.split('.')
      let value = messages[currentLang.value]
      for (const k of keys) {
        if (value && value[k] !== undefined) {
          value = value[k]
        } else {
          return key
        }
      }
      return value
    }
  })

  return { t, currentLang, setLocale }
}
