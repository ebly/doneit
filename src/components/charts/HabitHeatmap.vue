<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'

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
const chartInstance = ref(null)

// Convert date to local date string (YYYY-MM-DD format)
const formatDateToLocal = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Generate heatmap data
const heatmapData = computed(() => {
  const days = parseInt(props.dateRange) || 365
  const today = new Date()
  const data = []
  const habits = props.isAllHabits ? props.habits : (props.habit ? [props.habit] : [])
  
  console.log('[DEBUG] Heatmap: Generating data for', days, 'days')
  console.log('[DEBUG] Heatmap: Habits count:', habits.length)
  console.log('[DEBUG] Heatmap: isAllHabits:', props.isAllHabits)
  
  // Generate data for the past N days
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = formatDateToLocal(date)
    
    let completedCount = 0
    
    // Calculate completion count for the day
    habits.forEach(habit => {
      if (!habit.completedDates) return
      if (habit.completedDates.some(d => d.startsWith(dateStr))) {
        completedCount++
      }
    })
    
    // Calculate completion rate (0-1)
    const completionRate = habits.length > 0 ? completedCount / habits.length : 0
    
    // Log today's data
    if (i === 0) {
      console.log('[DEBUG] Heatmap: Today is', dateStr)
      console.log('[DEBUG] Heatmap: Today completedCount:', completedCount)
      console.log('[DEBUG] Heatmap: Today completionRate:', completionRate)
      console.log('[DEBUG] Heatmap: Today habits:', habits.map(h => ({
        name: h.name,
        completedDates: h.completedDates?.filter(d => d.startsWith(dateStr))
      })))
    }
    
    data.push([
      dateStr,
      completionRate,
      completedCount,
      habits.length
    ])
  }
  
  console.log('[DEBUG] Heatmap: Generated', data.length, 'data points')
  console.log('[DEBUG] Heatmap: Last 7 days:', data.slice(-7))
  
  return data
})

// Format date display
const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]
  return `${monthNames[date.getMonth()]} ${date.getDate()}`
}

const initChart = () => {
  if (!chartDom.value) return
  
  const existingChart = echarts.getInstanceByDom(chartDom.value)
  if (existingChart) {
    existingChart.dispose()
  }
  
  chartInstance.value = echarts.init(chartDom.value)
  
  // Generate data for the past 365 days
  const days = 365
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - days + 1)
  
  const startYear = startDate.getFullYear()
  const endYear = today.getFullYear()
  
  // Generate heatmap data
  const heatmapData = []
  const habits = props.isAllHabits ? props.habits : (props.habit ? [props.habit] : [])
  const totalHabits = props.isAllHabits ? props.habits.length : 1
  
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
    
    // Calculate completion rate (0-1)
    const completionRate = totalHabits > 0 ? completedCount / totalHabits : 0
    heatmapData.push([dateStr, completionRate])
  }
  
  const option = {
    visualMap: {
      show: false,
      min: 0,
      max: 1,
      calculable: false,
      inRange: {
        color: [
          '#ebedf0',  // 0% - gray
          '#98FB98',  // 30% - light green
          '#3CB371',  // 50% - medium green
          '#2E8B57',  // 70% - dark green
          '#27AE60'   // 100% - full opacity green
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
          // If no data or completion rate is 0, return gray
          if (!params.value || params.value[1] === 0) {
            return '#ebedf0'
          }
          // Otherwise let visualMap decide color based on completion rate
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
  
  chartInstance.value.setOption(option)
}

// Listen for data changes
watch([() => props.habit, () => props.habits, () => props.dateRange, () => props.isAllHabits], () => {
  initChart()
}, { deep: true })

// Listen for window resize
const handleResize = () => {
  if (chartInstance.value) {
    chartInstance.value.resize()
  }
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (chartInstance.value) {
    chartInstance.value.dispose()
    chartInstance.value = null
  }
  window.removeEventListener('resize', handleResize)
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
