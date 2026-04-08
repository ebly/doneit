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
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useChart } from '../../composables/useChart'

const props = defineProps({
  habit: {
    type: Object,
    default: null
  }
})

const chartDom = ref(null)
const { initChart } = useChart(chartDom)

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
      const [y, m, d] = dateStr.split('-').map(Number)
      const completedDate = new Date(y, m - 1, d)
      if (completedDate.getFullYear() === year && completedDate.getMonth() === month) {
        completedDays++
      }
    })

    completionRateData[index] = completedDays / daysInMonth
  })

  return { categories, completionRateData }
})

const option = computed(() => ({
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
}))

watch(() => props.habit, () => {
  initChart(option.value)
}, { deep: true })

onMounted(async () => {
  await nextTick()
  initChart(option.value)
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
