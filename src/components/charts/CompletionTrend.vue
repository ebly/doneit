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
    default: '30'
  },
  isAllHabits: {
    type: Boolean,
    default: false
  }
})

const chartDom = ref(null)
const chartInstance = ref(null)

// 生成图表数据
const chartData = computed(() => {
  const days = parseInt(props.dateRange) || 30
  const today = new Date()
  const dates = []
  const data = []

  // 生成过去 N 天的数据
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    dates.push(dateStr)

    if (props.isAllHabits) {
      // All Habits 模式：计算当天完成度（完成的天数 / 总习惯数）
      const completedCount = props.habits.filter(habit => {
        if (!habit.completedDates) return false
        return habit.completedDates.some(d => d.startsWith(dateStr))
      }).length

      const completionRate = props.habits.length > 0
        ? (completedCount / props.habits.length) * 100
        : 0
      data.push(completionRate.toFixed(0))
    } else {
      // 单个习惯模式
      if (!props.habit || !props.habit.completedDates) {
        data.push(0)
        continue
      }

      const isCompleted = props.habit.completedDates.some(d => d.startsWith(dateStr))
      data.push(isCompleted ? 100 : 0)
    }
  }

  return { dates, data }
})

const initChart = () => {
  if (!chartDom.value) return
  
  const existingChart = echarts.getInstanceByDom(chartDom.value)
  if (existingChart) {
    existingChart.dispose()
  }
  
  chartInstance.value = echarts.init(chartDom.value)
  
  const option = {
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
        interval: Math.floor(chartData.value.dates.length / 7)
      }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: {
        formatter: '{value}%',
        fontSize: 10
      },
      splitLine: {
        lineStyle: {
          color: '#e0e0e0',
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
              { offset: 0, color: 'rgba(50, 112, 202, 0.3)' },
              { offset: 1, color: 'rgba(50, 112, 202, 0.05)' }
            ]
          }
        }
      }
    ]
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
  <div ref="chartDom" class="completion-trend-chart"></div>
</template>

<style scoped>
.completion-trend-chart {
  width: 100%;
  height: 180px;
}
</style>
