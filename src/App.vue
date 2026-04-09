<script setup>
import { ref, onMounted, defineAsyncComponent } from 'vue'
import { useTheme } from './composables/useTheme.js'
import { useHabits } from './composables/useHabits.js'
import { loadMockDataScript } from './composables/useMockData.js'
import { Search } from '@element-plus/icons-vue'

const HabitList = defineAsyncComponent(() => import('./components/HabitList.vue'))
const HabitForm = defineAsyncComponent(() => import('./components/HabitForm.vue'))
const Dashboard = defineAsyncComponent(() => import('./components/Dashboard.vue'))
const Calendar = defineAsyncComponent(() => import('./components/Calendar.vue'))
const Stats = defineAsyncComponent(() => import('./components/Stats.vue'))
const TopNav = defineAsyncComponent(() => import('./components/TopNav.vue'))

const { initTheme } = useTheme()
const { habits, showAddForm, editingHabit, loadHabits, handleAddHabit, startEditHabit, cancelEditHabit, handleDeleteHabit } = useHabits()

const searchValue = ref('')
const currentView = ref('dashboard')

onMounted(async () => {
  initTheme()
  await loadHabits()
  
  if (import.meta.env.DEV) {
    loadMockDataScript(loadHabits)
  }
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
                placeholder="Search habits..."
                class="search-bar"
                clearable
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              <button class="add-btn" @click="showAddForm = true">+ Add Habit</button>
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
  min-height: 100vh;
}

.dark-mode .app-container {
  background-color: var(--bg-primary);
}
</style>
