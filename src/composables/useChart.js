import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'

export const useChart = (chartDomRef, options = {}) => {
  const chartInstance = ref(null)
  const { autoInit = true, debounceTime = 100, enableResizeObserver = false } = options

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
  let resizeObserver = null
  let resizeTimer = null

  const initChart = (option) => {
    if (!chartDomRef.value) return

    const existingChart = echarts.getInstanceByDom(chartDomRef.value)
    if (existingChart) {
      existingChart.dispose()
    }

    // 确保容器有正确的尺寸
    const width = chartDomRef.value.clientWidth
    const height = chartDomRef.value.clientHeight
    
    console.log('initChart - 容器尺寸:', { width, height })

    chartInstance.value = echarts.init(chartDomRef.value, null, {
      width: width,
      height: height,
      devicePixelRatio: window.devicePixelRatio
    })
    
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

  // 监听容器宽度变化
  const setupResizeObserver = (getOption) => {
    if (!enableResizeObserver || !chartDomRef.value) return

    let lastWidth = chartDomRef.value.clientWidth
    let hasInit = false

    resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      const currentWidth = entry.contentRect.width

      // 跳过前两次触发（页面加载时的连续触发）
      if (!hasInit) {
        hasInit = true
        return
      }

      // 清除之前的定时器
      if (resizeTimer) {
        clearTimeout(resizeTimer)
      }

      // 等待 500ms，尺寸稳定后再重新 init
      resizeTimer = setTimeout(() => {
        // 检查尺寸是否真的改变了
        if (currentWidth !== lastWidth) {
          lastWidth = currentWidth
          // 使用最新的 option
          const option = typeof getOption === 'function' ? getOption() : getOption
          initChart(option)
        }
      }, 500)
    })

    resizeObserver.observe(chartDomRef.value)
  }

  // 清理资源
  const dispose = () => {
    if (themeObserver) {
      themeObserver.disconnect()
      themeObserver = null
    }
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
    if (resizeTimer) {
      clearTimeout(resizeTimer)
      resizeTimer = null
    }
    if (chartInstance.value) {
      chartInstance.value.dispose()
      chartInstance.value = null
    }
  }

  onMounted(() => {
    if (autoInit && chartDomRef.value) {
      // 需要在外部的 onMounted 中调用 initChart
    }
  })

  onUnmounted(() => {
    dispose()
  })

  return {
    chartInstance,
    initChart,
    refreshChartTheme,
    setupResizeObserver,
    dispose
  }
}
