<script setup>
import { ref, onMounted, defineAsyncComponent, watch } from 'vue'
import { useTheme } from './composables/useTheme.js'
import { useHabits } from './composables/useHabits.js'
import { loadMockDataScript } from './composables/useMockData.js'
import { Search } from '@element-plus/icons-vue'
import { useI18n, registerLocale } from './utils/i18n.js'
import { useSettings } from './composables/useSettings.js'
import en from './locales/en.js'
import zh from './locales/zh.js'

registerLocale('en', en)
registerLocale('zh', zh)

const HabitList = defineAsyncComponent(() => import('./components/HabitList.vue'))
const HabitForm = defineAsyncComponent(() => import('./components/HabitForm.vue'))
const Dashboard = defineAsyncComponent(() => import('./components/Dashboard.vue'))
const Calendar = defineAsyncComponent(() => import('./components/Calendar.vue'))
const Stats = defineAsyncComponent(() => import('./components/Stats.vue'))
const TopNav = defineAsyncComponent(() => import('./components/TopNav.vue'))

const { initTheme } = useTheme()
const { habits, showAddForm, editingHabit, loadHabits, handleAddHabit, startEditHabit, cancelEditHabit, handleDeleteHabit } = useHabits()
const { language } = useSettings()
const { t, currentLang } = useI18n()

const searchValue = ref('')
const currentView = ref('dashboard')

watch(() => language.value, (newVal) => {
  currentLang.value = newVal
}, { immediate: true })

onMounted(async () => {
  initTheme()
  await loadHabits()
  
  if (import.meta.env.DEV) {
    loadMockDataScript(loadHabits)
  }

  // 动态设置视口高度
  const setViewportHeight = () => {
    const vh = window.innerHeight * 0.01
    document.documentElement.style.setProperty('--vh', `${vh}px`)
  }

  setViewportHeight()
  window.addEventListener('resize', setViewportHeight)
})
</script>

<template>
  <div class="app-container">
    <div class="pc-layout">
      <TopNav v-model:currentView="currentView" />

      <main class="main-content">
        <Dashboard v-if="currentView === 'dashboard'" :habits="habits" @update:habits="habits = $event" />

        <template v-else-if="currentView === 'myhabits'">
          <div class="content-header">
            <div class="search-button-container">
              <el-input
                v-model="searchValue"
                :placeholder="t('common.search')"
                class="search-bar"
                clearable
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              <button class="add-btn" @click="showAddForm = true">{{ t('common.addHabit') }}</button>
            </div>
          </div>

          <HabitList :habits="habits" :search-value="searchValue" @edit="startEditHabit" @delete="handleDeleteHabit" />
        </template>

        <Calendar v-else-if="currentView === 'calendar'" :habits="habits" />

        <Stats v-else-if="currentView === 'stats'" :habits="habits" />
      </main>
    </div>

    <HabitForm v-model:visible="showAddForm" :habit="editingHabit" @add="handleAddHabit" @cancel="cancelEditHabit" />
  </div>
</template>

<style scoped>
.app-container {
  background-color: var(--bg-primary);
  height: calc(var(--vh, 1vh) * 100);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-bottom: env(safe-area-inset-bottom);
  padding-top: env(safe-area-inset-top);
}

.pc-layout {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.dark-mode .app-container {
  background-color: var(--bg-primary);
}
</style>
