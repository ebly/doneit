<script setup>
import { ref, computed, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  habit: {
    type: Object,
    required: true
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

// 生成最近 6 周的日期范围标签
const generateWeekLabels = () => {
  const today = new Date()
  const currentDayOfWeek = today.getDay()
  // 获取本周日的日期
  const thisWeekSunday = new Date(today)
  thisWeekSunday.setDate(today.getDate() - currentDayOfWeek)
  
  const labels = []
  for (let i = 5; i >= 0; i--) {
    const weekSunday = new Date(thisWeekSunday)
    weekSunday.setDate(thisWeekSunday.getDate() - (i * 7))
    
    const weekSaturday = new Date(weekSunday)
    weekSaturday.setDate(weekSunday.getDate() + 6)
    
    const startMonth = String(weekSunday.getMonth() + 1).padStart(2, '0')
    const startDay = String(weekSunday.getDate()).padStart(2, '0')
    const endMonth = String(weekSaturday.getMonth() + 1).padStart(2, '0')
    const endDay = String(weekSaturday.getDate()).padStart(2, '0')
    
    labels.push(`${startMonth}${startDay}-${endMonth}${endDay}`)
  }
  
  return labels
}

// 获取最近 6 周的打卡数据
const getWeeklyData = () => {
  if (!props.habit || !props.habit.completedDates) {
    return [[], [], [], [], [], []]
  }
  
  const today = new Date()
  const currentDayOfWeek = today.getDay()
  // 获取本周日的日期
  const thisWeekSunday = new Date(today)
  thisWeekSunday.setDate(today.getDate() - currentDayOfWeek)
  
  // 获取 6 周前的周日
  const sixWeeksAgoSunday = new Date(thisWeekSunday)
  sixWeeksAgoSunday.setDate(thisWeekSunday.getDate() - (6 * 7))
  
  const weeklyData = [[], [], [], [], [], []]
  
  // 遍历打卡记录
  props.habit.completedDates.forEach(dateStr => {
    const datePart = dateStr.split(' ')[0]
    // 使用本地时间解析日期，避免时区问题
    const [year, month, day] = datePart.split('-').map(Number)
    const completedDate = new Date(year, month - 1, day)
    
    // 检查是否在 6 周内
    if (completedDate < sixWeeksAgoSunday || completedDate > today) {
      return
    }
    
    // 计算这是第几周（0-5，0 表示最早的一周）
    const daysDiff = Math.floor((completedDate - sixWeeksAgoSunday) / (1000 * 60 * 60 * 24))
    const weekIndex = Math.floor(daysDiff / 7)
    
    if (weekIndex >= 0 && weekIndex < 6) {
      // 获取是周几（0-6）
      const dayOfWeek = completedDate.getDay()
      // 存储该天的打卡状态（1 表示打卡，null 表示未打卡）
      weeklyData[weekIndex][dayOfWeek] = 1
    }
  })
  
  return weeklyData
}

const chartData = computed(() => {
  const weekLabels = generateWeekLabels()
  const weeklyData = getWeeklyData()
  
  // 为每一周生成 Sun-Sat 的数据点
  const seriesData = []
  for (let weekIndex = 0; weekIndex < 6; weekIndex++) {
    const weekPoints = weeklyData[weekIndex]
    const dataForWeek = [null, null, null, null, null, null, null]
    
    weekPoints.forEach((value, dayIndex) => {
      if (value !== undefined) {
        dataForWeek[dayIndex] = value
      }
    })
    
    seriesData.push({
      name: weekLabels[weekIndex],
      type: 'scatter',
      data: dataForWeek,
      symbolSize: 12,
      itemStyle: {
        color: function(params) {
          // 检查这一天是否在该习惯的 daysPerWeek 中
          const dayIndex = params.dataIndex
          const isDayEnabled = !props.habit.daysPerWeek || 
                               props.habit.daysPerWeek.length === 0 || 
                               props.habit.daysPerWeek.includes(dayIndex.toString())
          
          // 如果没有配置这一天，返回灰色
          if (!isDayEnabled) {
            return '#cccccc'
          }
          
          // 如果配置了这一天，返回绿色
          return '#42b983'
        }
      }
    })
  }
  
  return { weekLabels, seriesData }
})

const initChart = () => {
  if (!chartDom.value) return
  
  const existingChart = echarts.getInstanceByDom(chartDom.value)
  if (existingChart) {
    existingChart.dispose()
  }
  
  chartInstance.value = echarts.init(chartDom.value)
  
  // 创建 Y 轴标签的颜色数组
  const yAxisColors = ['Sat', 'Fri', 'Thu', 'Wed', 'Tue', 'Mon', 'Sun'].map((dayLabel, index) => {
    const dayIndex = 6 - index // 转换为 0-6（Sun=0, Sat=6）
    const isDayEnabled = !props.habit.daysPerWeek || 
                         props.habit.daysPerWeek.length === 0 || 
                         props.habit.daysPerWeek.includes(dayIndex.toString())
    return isDayEnabled ? '#333' : '#cccccc'
  })
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: function(params) {
        if (params.value === null || params.value === undefined) {
          return params.seriesName + ' - ' + params.name + ': No check-in'
        }
        return params.seriesName + ' - ' + params.name + ': Checked in'
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
      data: chartData.value.weekLabels,
      axisLabel: {
        rotate: 0,
        fontSize: 10
      }
    },
    yAxis: {
      type: 'category',
      data: ['Sat', 'Fri', 'Thu', 'Wed', 'Tue', 'Mon', 'Sun'],
      inverse: false,
      axisLabel: {
        color: function(value, index) {
          return yAxisColors[index]
        }
      }
    },
    series: chartData.value.seriesData
  }
  
  chartInstance.value.setOption(option)
}

// 监听窗口大小变化
const handleResize = () => {
  if (chartInstance.value) {
    chartInstance.value.resize()
  }
}

// 监听数据变化
watch(() => props.habit, () => {
  initChart()
}, { deep: true })

// 生命周期
import { onMounted, onBeforeUnmount } from 'vue'

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (chartInstance.value) {
    chartInstance.value.dispose()
  }
})
</script>

<template>
  <div class="weekly-trend-chart">
    <h3 class="chart-title">Weekly Trend</h3>
    <div ref="chartDom" class="chart-container"></div>
  </div>
</template>

<style scoped>
.weekly-trend-chart {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
}

.dark-mode .weekly-trend-chart {
  background: #2d2d2d;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.chart-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.dark-mode .chart-title {
  color: #e0e0e0;
}

.chart-container {
  width: 100%;
  height: 300px;
}
</style>
