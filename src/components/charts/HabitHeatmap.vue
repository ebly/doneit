<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useTheme } from '../../composables/useTheme'
import { useChart } from '../../composables/useChart'

const { isDarkMode } = useTheme()

const props = defineProps({
  habit: {
    type: Object,
    default: null
  },
  habits: {
    type: Array,
    default: () => []
  },
  dateRange: {
    type: String,
    default: '365'
  },
  isAllHabits: {
    type: Boolean,
    default: false
  }
})

const chartDom = ref(null)
const { initChart } = useChart(chartDom)

const formatDateToLocal = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const option = computed(() => {
  const days = 365
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - days + 1)

  const habits = props.isAllHabits ? props.habits : (props.habit ? [props.habit] : [])
  const totalHabits = props.isAllHabits ? props.habits.length : 1

  const heatmapData = []

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = formatDateToLocal(date)

    let completedCount = 0
    habits.forEach(habit => {
      if (!habit.completedDates) return
      if (habit.completedDates.some(d => {
        const datePart = d.split(' ')[0]
        return datePart === dateStr
      })) {
        completedCount++
      }
    })

    const completionRate = totalHabits > 0 ? completedCount / totalHabits : 0
    heatmapData.push([dateStr, completionRate])
  }

  return {
    backgroundColor: isDarkMode.value ? '#2B2B2B' : '#ffffff',
    visualMap: {
      show: false,
      min: 0,
      max: 1,
      calculable: false,
      inRange: {
        color: isDarkMode.value ? [
          '#3a3a3a',
          '#90EE90',
          '#32CD32',
          '#228B22',
          '#006400'
        ] : [
          '#d0d0d0',
          '#90EE90',
          '#32CD32',
          '#228B22',
          '#006400'
        ]
      },
      outOfRange: {
        color: isDarkMode.value ? '#3a3a3a' : '#d0d0d0'
      }
    },
    calendar: {
      top: 30,
      left: '4%',
      right: '4%',
      bottom: 10,
      cellSize: [10, 10],
      range: [formatDateToLocal(startDate), formatDateToLocal(today)],
      itemStyle: {
        borderWidth: 5,
        borderColor: isDarkMode.value ? '#2B2B2B' : '#ffffff',
        borderRadius: 0
      },
      yearLabel: {
        show: false
      },
      monthLabel: {
        nameMap: 'en',
        fontSize: 10,
        color: isDarkMode.value ? '#888' : '#666',
        align: 'center'
      },
      dayLabel: {
        show: true,
        fontSize: 9,
        color: isDarkMode.value ? '#888' : '#666',
        firstDay: 0,
        nameMap: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      },
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      splitLine: {
        show: false
      }
    },
    series: [{
      name: 'Habit Completion',
      type: 'heatmap',
      coordinateSystem: 'calendar',
      data: heatmapData,
      label: {
        show: false
      },
      itemStyle: {
        borderRadius: 0,
        borderWidth: 0,
      }
    }]
  }
})

watch([() => props.habit, () => props.habits, () => props.dateRange, () => props.isAllHabits, isDarkMode], () => {
  initChart(option.value)
}, { deep: true })

onMounted(async () => {
  await nextTick()
  initChart(option.value)
})
</script>

<template>
  <div ref="chartDom" class="heatmap-chart"></div>
</template>

<style scoped>
.heatmap-chart {
  width: 100%;
  height: 160px;
  background-color: transparent;
}

/* 确保父容器在不同模式下背景正确 */
:deep(.dark-mode) .heatmap-chart {
  background-color: var(--chart-bg) !important;
}

/* 移除 canvas 可能存在的默认背景 */
.heatmap-chart :deep(canvas) {
  background-color: transparent !important;
}

.heatmap-chart canvas {
  background-color: transparent !important;
}

/* 消除 canvas 渲染时的抗锯齿白边 */
.heatmap-chart :deep(canvas) {
  image-rendering: -webkit-optimize-contrast !important;
  image-rendering: crisp-edges !important;
  image-rendering: pixelated !important;
}
</style>
