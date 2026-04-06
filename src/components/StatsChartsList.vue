<script setup>
import { ref, watch } from 'vue'
import CompleteRate from './charts/CompleteRate.vue'
import MaxStreakDays from './charts/MaxStreakDays.vue'
import WeeklyTrend from './charts/WeeklyTrend.vue'

const props = defineProps({
  habits: {
    type: Array,
    default: () => []
  },
  selectedHabitId: {
    type: [String, Number],
    default: null
  }
})

const selectedHabit = ref(null)

watch(() => props.selectedHabitId, (newId) => {
  if (newId) {
    selectedHabit.value = props.habits.find(h => h.id === newId) || null
  }
}, { immediate: true })
</script>

<template>
  <div class="stats-chart-list">
    <CompleteRate :habit="selectedHabit" />
    <MaxStreakDays :habit="selectedHabit" />
    <WeeklyTrend :habit="selectedHabit" class="full-width" />
  </div>
</template>

<style scoped>
.stats-chart-list {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  flex: 1;
  gap: 20px;
}

.stats-chart-list>* {
  flex: 0 0 calc(50% - 10px);
  max-width: calc(50% - 10px);
  min-width: 400px;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.stats-chart-list .full-width {
  flex: 0 0 100%;
  max-width: 100%;
  min-width: 100%;
}

@media (max-width: 500px) {
  .stats-chart-list>* {
    flex: 0 0 100%;
    max-width: 100%;
    min-width: 100%;
  }
}

.stats-chart-list>*:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}
</style>
