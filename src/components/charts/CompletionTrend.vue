<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
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
    default: '30'
  },
  isAllHabits: {
    type: Boolean,
    default: false
  }
})

const chartDom = ref(null)
const { initChart, setupResizeObserver } = useChart(chartDom, { enableResizeObserver: true })

const formatDateToLocal = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const chartData = computed(() => {
  const days = parseInt(props.dateRange) || 30
  const today = new Date()
  const dates = []
  const data = []

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = formatDateToLocal(date)
    dates.push(dateStr)

    if (props.isAllHabits) {
      const completedCount = props.habits.filter(habit => {
        if (!habit.completedDates) return false
        return habit.completedDates.some(d => {
          const datePart = d.split(' ')[0]
          return datePart === dateStr
        })
      }).length

      const completionRate = props.habits.length > 0
        ? (completedCount / props.habits.length) * 100
        : 0
      data.push(completionRate.toFixed(0))
    } else {
      if (!props.habit || !props.habit.completedDates) {
        data.push(0)
        continue
      }

      const isCompleted = props.habit.completedDates.some(d => {
        const datePart = d.split(' ')[0]
        return datePart === dateStr
      })
      data.push(isCompleted ? 100 : 0)
    }
  }

  return { dates, data }
})

const option = computed(() => ({
  tooltip: {
    trigger: 'axis',
    formatter: function(params) {
      const value = params[0].value
      return `${params[0].name}<br/>Completion: ${value}%`
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    top: '5%',
    bottom: '10%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: chartData.value.dates.map(date => {
      const d = new Date(date)
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ]
      return `${monthNames[d.getMonth()]} ${d.getDate()}`
    }),
    axisLabel: {
      rotate: 0,
      fontSize: 10,
      interval: Math.floor(chartData.value.dates.length / 7),
      color: document.body.classList.contains('dark-mode') ? '#888' : '#666'
    },
    axisLine: {
      lineStyle: {
        color: document.body.classList.contains('dark-mode') ? '#444' : '#ddd'
      }
    }
  },
  yAxis: {
    type: 'value',
    min: 0,
    max: 100,
    axisLabel: {
      formatter: '{value}%',
      fontSize: 10,
      color: document.body.classList.contains('dark-mode') ? '#888' : '#666'
    },
    splitLine: {
      lineStyle: {
        color: document.body.classList.contains('dark-mode') ? '#444' : '#ddd',
        type: 'dashed'
      }
    }
  },
  series: [
    {
      name: 'Completion Rate',
      type: 'line',
      data: chartData.value.data,
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      itemStyle: {
        color: '#3270ca'
      },
      lineStyle: {
        width: 2,
        color: '#3270ca'
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(50, 112, 202, 0.2)' },
            { offset: 1, color: 'rgba(50, 112, 202, 0.02)' }
          ]
        }
      },
      emphasis: {
        disabled: true
      }
    }
  ]
}))

onMounted(async () => {
  await nextTick()
  initChart(option.value)
  setupResizeObserver(() => option.value)
})
</script>

<template>
  <div ref="chartDom" class="completion-trend-chart"></div>
</template>

<style scoped>
.completion-trend-chart {
  width: 100%;
  height: 180px;
}
</style>
