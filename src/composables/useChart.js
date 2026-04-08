import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'

export const useChart = (chartDomRef, options = {}) => {
  const chartInstance = ref(null)
  const { autoInit = true, debounceTime = 100 } = options

  const initChart = (option) => {
    if (!chartDomRef.value) return

    const existingChart = echarts.getInstanceByDom(chartDomRef.value)
    if (existingChart) {
      existingChart.dispose()
    }

    chartInstance.value = echarts.init(chartDomRef.value)
    chartInstance.value.setOption(option)
  }

  const updateChart = (option) => {
    if (chartInstance.value) {
      chartInstance.value.setOption(option)
    }
  }

  const resizeChart = () => {
    if (chartInstance.value) {
      chartInstance.value.resize()
    }
  }

  const disposeChart = () => {
    if (chartInstance.value) {
      chartInstance.value.dispose()
      chartInstance.value = null
    }
  }

  let resizeTimer = null
  const handleResize = () => {
    if (debounceTime > 0) {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(resizeChart, debounceTime)
    } else {
      resizeChart()
    }
  }

  onMounted(() => {
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    disposeChart()
  })

  watch(chartDomRef, (newVal) => {
    if (newVal && autoInit) {
      resizeChart()
    }
  }, { immediate: true })

  return {
    chartInstance,
    initChart,
    updateChart,
    resizeChart,
    disposeChart
  }
}
