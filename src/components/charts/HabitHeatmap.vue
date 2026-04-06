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

// 将日期转换为本地日期字符串（YYYY-MM-DD 格式）
const formatDateToLocal = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 生成热力图数据
const heatmapData = computed(() => {
  const days = parseInt(props.dateRange) || 365
  const today = new Date()
  const data = []
  const habits = props.isAllHabits ? props.habits : (props.habit ? [props.habit] : [])
  
  // 生成过去 N 天的数据
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = formatDateToLocal(date)
    
    let completedCount = 0
    
    // 计算当天的完成数量
    habits.forEach(habit => {
      if (!habit.completedDates) return
      if (habit.completedDates.some(d => d.startsWith(dateStr))) {
        completedCount++
      }
    })
    
    // 计算完成度（0-1）
    const completionRate = habits.length > 0 ? completedCount / habits.length : 0
    
    data.push([
      dateStr,
      completionRate,
      completedCount,
      habits.length
    ])
  }
  
  return data
})

// 格式化日期显示
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
  
  // 生成过去 365 天的数据
  const days = 365
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - days + 1)
  
  const startYear = startDate.getFullYear()
  const endYear = today.getFullYear()
  
  // 生成热力图数据
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
    
    // 计算完成率（0-1 之间）
    const completionRate = totalHabits > 0 ? completedCount / totalHabits : 0
    heatmapData.push([dateStr, completionRate])
  }
  
  const option = {
    tooltip: {
      position: 'top',
      formatter: function(params) {
        const dateStr = params.value[0]
        const date = new Date(dateStr)
        const monthNames = [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ]
        const dateDisplay = `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
        const rate = params.value[1]
        const percentage = Math.round(rate * 100)
        
        if (props.isAllHabits) {
          return `${date_display}<br/>${percentage}% habits completed`
        } else {
          return `${date_display}<br/>${rate > 0 ? '✓ Completed' : '✗ Not completed'}`
        }
      }
    },
    visualMap: {
      show: false,
      min: 0,
      max: 1,
      inRange: {
        color: [
          '#ebedf0',  // 0% - 灰色
          '#98FB98',  // 30% - 浅绿色
          '#3CB371',  // 50% - 中等绿色
          '#2E8B57',  // 70% - 深绿色
          '#27AE60'   // 100% - 完全不透明绿色
        ]
      }
    },
    calendar: {
      top: 30,
      left: '3%',
      right: '4%',
      bottom: 10,
      cellSize: [8, 8],
      range: [startDate.toISOString().split('T')[0], today.toISOString().split('T')[0]],
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
        borderRadius: 4
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

// 监听数据变化
watch([() => props.habit, () => props.habits, () => props.dateRange, () => props.isAllHabits], () => {
  initChart()
}, { deep: true })

// 监听窗口大小变化
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
