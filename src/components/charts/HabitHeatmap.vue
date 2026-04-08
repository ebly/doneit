<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useChart } from '../../composables/useChart'

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
      if (habit.completedDates.some(d => d.startsWith(dateStr))) {
        completedCount++
      }
    })

    const completionRate = totalHabits > 0 ? completedCount / totalHabits : 0
    heatmapData.push([dateStr, completionRate])
  }

  return {
    visualMap: {
      show: false,
      min: 0,
      max: 1,
      calculable: false,
      inRange: {
        color: [
          '#ebedf0',
          '#98FB98',
          '#3CB371',
          '#2E8B57',
          '#27AE60'
        ]
      },
      outOfRange: {
        color: ['#ebedf0']
      }
    },
    calendar: {
      top: 30,
      left: '3%',
      right: '4%',
      bottom: 10,
      cellSize: [8, 8],
      range: [formatDateToLocal(startDate), formatDateToLocal(today)],
      itemStyle: {
        borderWidth: 4,
        borderColor: '#fff',
        borderRadius: 4
      },
      dayStyle: {
        color: '#ebedf0'
      },
      yearLabel: {
        show: false
      },
      monthLabel: {
        nameMap: 'en',
        fontSize: 10,
        color: '#666',
        align: 'center'
      },
      dayLabel: {
        show: true,
        fontSize: 9,
        color: '#666',
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
        borderRadius: 4,
        color: function(params) {
          if (!params.value || params.value[1] === 0) {
            return '#ebedf0'
          }
          return null
        }
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  }
})

watch([() => props.habit, () => props.habits, () => props.dateRange, () => props.isAllHabits], () => {
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
}
</style>
