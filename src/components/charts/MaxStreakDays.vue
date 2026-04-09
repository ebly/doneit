<template>
  <div class="chart-wrapper">
    <div ref="chartDom" class="chart-container"></div>
    <div class="chart-title">
      <span class="color-dot" style="background-color: var(--success-color);"></span>
      <span>Max Streak Days</span>
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
    return { categories: [], maxStreakData: [] }
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

  const maxStreakData = []

  monthIndices.forEach(({ year, month }, index) => {
    const monthCompletedDates = []

    props.habit.completedDates.forEach(dateStr => {
      const [y, m, d] = dateStr.split('-').map(Number)
      const completedDate = new Date(y, m - 1, d)
      if (completedDate.getFullYear() === year && completedDate.getMonth() === month) {
        monthCompletedDates.push(completedDate.getDate())
      }
    })

    monthCompletedDates.sort((a, b) => a - b)

    let maxStreak = 0
    let currentStreak = 1

    if (monthCompletedDates.length > 0) {
      maxStreak = 1

      for (let i = 1; i < monthCompletedDates.length; i++) {
        if (monthCompletedDates[i] === monthCompletedDates[i - 1] + 1) {
          currentStreak++
          maxStreak = Math.max(maxStreak, currentStreak)
        } else {
          currentStreak = 1
        }
      }
    } else {
      maxStreak = 0
    }

    maxStreakData[index] = maxStreak
  })

  return { categories, maxStreakData }
})

const option = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: function(params) {
      return params.name + ': ' + params.value + ' days'
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
    max: 35,
    axisLine: {
      show: true,
      lineStyle: {
        color: 'var(--border-light)'
      }
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: 'var(--bg-tertiary)'
      }
    }
  },
  series: [
    {
      name: 'Max Streak',
      type: 'line',
      data: chartData.value.maxStreakData,
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      areaStyle: {
        color: 'rgba(50, 112, 202, 0.15)'
      },
      itemStyle: {
        color: '#3270ca'
      },
      lineStyle: {
        color: '#3270ca',
        width: 2
      },
      emphasis: {
        disabled: true
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
  color: var(--text-light);
  font-weight: normal;
}

.color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}
</style>
