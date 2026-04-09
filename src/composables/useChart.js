import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'

export const useChart = (chartDomRef, options = {}) => {
  const chartInstance = ref(null)
  const { autoInit = true, debounceTime = 100 } = options

  const getChartBackgroundColor = () => {
    if (document.body.classList.contains('dark-mode')) {
      return '#2b2b2b'
    }
    return 'transparent'
  }

  const refreshChartTheme = () => {
    if (chartInstance.value) {
      chartInstance.value.setOption({
        backgroundColor: getChartBackgroundColor()
      })
    }
  }

  let themeObserver = null

  const initChart = (option) => {
    if (!chartDomRef.value) return

    const existingChart = echarts.getInstanceByDom(chartDomRef.value)
    if (existingChart) {
      existingChart.dispose()
    }

    chartInstance.value = echarts.init(chartDomRef.value)
    
    const mergedOption = {
      ...option,
      backgroundColor: getChartBackgroundColor()
    }
    
    chartInstance.value.setOption(mergedOption)

    if (!themeObserver) {
      themeObserver = new MutationObserver(() => {
        refreshChartTheme()
      })
      themeObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ['class']
      })
    }
  }

  const updateChart = (option) => {
    if (chartInstance.value) {
      const mergedOption = {
        ...option,
        backgroundColor: getChartBackgroundColor()
      }
      chartInstance.value.setOption(mergedOption)
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
    if (themeObserver) {
      themeObserver.disconnect()
      themeObserver = null
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
  })

  return {
    chartInstance,
    initChart,
    updateChart,
    resizeChart,
    disposeChart,
    refreshChartTheme
  }
}
