<template>
  <div class="chart-wrapper">
    <div ref="chartDom" class="chart-container"></div>
    <div class="chart-title">
      <span class="color-dot" style="background-color: #409EFF;"></span>
      <span>Complete Rate</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  habit: {
    type: Object,
    default: null
  }
})

const chartInstance = ref(null)
const chartDom = ref(null)

const chartData = computed(() => {
  if (!props.habit || !props.habit.completedDates) {
    return { categories: [], completionRateData: [] }
  }

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  const categories = []
  const monthIndices = []

  for (let i = 5; i >= 0; i--) {
    let targetMonth = currentMonth - i
    let targetYear = currentYear

    if (targetMonth < 0) {
      targetMonth += 12
      targetYear -= 1
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    categories.push(monthNames[targetMonth])
    monthIndices.push({ year: targetYear, month: targetMonth })
  }

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const completionRateData = []

  monthIndices.forEach(({ year, month }, index) => {
    const daysInMonth = getDaysInMonth(year, month)
    let completedDays = 0

    props.habit.completedDates.forEach(dateStr => {
      const completedDate = new Date(dateStr)
      if (completedDate.getFullYear() === year && completedDate.getMonth() === month) {
        completedDays++
      }
    })

    completionRateData[index] = completedDays / daysInMonth
  })

  return { categories, completionRateData }
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
      trigger: 'item',
      formatter: function(params) {
        const percentage = (params.value * 100).toFixed(1)
        return params.name + ': ' + percentage + '%'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      top: '5%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: chartData.value.categories
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 1,
      axisLine: {
        show: true,
        lineStyle: {
          color: '#e0e0e0'
        }
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#f0f0f0'
        }
      }
    },
    series: [
      {
        name: 'Complete Rate',
        type: 'line',
        data: chartData.value.completionRateData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        areaStyle: {
          color: 'rgba(64, 158, 255, 0.3)'
        },
        itemStyle: {
          color: '#409EFF'
        },
        emphasis: {
          focus: 'series',
          itemStyle: {
            symbolSize: 8
          }
        }
      }
    ]
  }
  
  chartInstance.value.setOption(option)
  
  window.addEventListener('resize', () => {
    chartInstance.value.resize()
  })
}

const updateChart = () => {
  if (chartInstance.value) {
    chartInstance.value.setOption({
      xAxis: {
        data: chartData.value.categories
      },
      series: [
        {
          data: chartData.value.completionRateData
        }
      ]
    })
  }
}

watch(() => props.habit, () => {
  if (chartInstance.value) {
    initChart()
  }
}, { deep: true })

onMounted(() => {
  setTimeout(() => {
    initChart()
  }, 100)
})

onUnmounted(() => {
  if (chartInstance.value) {
    chartInstance.value.dispose()
  }
})
</script>

<style scoped>
.chart-wrapper {
  width: 100%;
  min-height: 220px;
  display: flex;
  flex-direction: column;
}

.chart-container {
  flex: 1;
  width: 100%;
  min-height: 180px;
}

.chart-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding-top: 8px;
  font-size: 14px;
  color: #999999;
  font-weight: normal;
}

.color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}
</style>
