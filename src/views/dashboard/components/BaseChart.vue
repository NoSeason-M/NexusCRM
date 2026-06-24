<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { echarts } from '@/utils/echarts'

const props = defineProps({
  option: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  empty: { type: Boolean, default: false },
  emptyText: { type: String, default: '暂无数据' },
  height: { type: [String, Number], default: 300 },
  theme: { type: String, default: '' },
  renderer: { type: String, default: 'canvas' },
  notMerge: { type: Boolean, default: false }
})

const chartRef = ref(null)
let chartInstance = null
let resizeObserver = null

function initChart() {
  if (!chartRef.value) return

  // 如果已存在实例，先销毁
  if (chartInstance) {
    chartInstance.dispose()
  }

  chartInstance = echarts.init(chartRef.value, props.theme, {
    renderer: props.renderer
  })

  applyOption()
}

function applyOption() {
  if (!chartInstance) return

  if (props.option) {
    chartInstance.setOption(props.option, { notMerge: props.notMerge })
  }
}

function handleResize() {
  chartInstance?.resize()
}

// DOM 挂载后初始化
onMounted(() => {
  nextTick(() => {
    initChart()

    // ResizeObserver 监听容器尺寸变化
    if (chartRef.value) {
      resizeObserver = new ResizeObserver(() => {
        handleResize()
      })
      resizeObserver.observe(chartRef.value)
    }

    // 兼容 window resize
    window.addEventListener('resize', handleResize)
  })
})

// 销毁
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  resizeObserver?.disconnect()
  chartInstance?.dispose()
  chartInstance = null
})

// 监听 option 变化
watch(() => props.option, (val) => {
  if (chartInstance && val) {
    chartInstance.setOption(val, { notMerge: props.notMerge })
  }
}, { deep: true })

// 监听 loading 变化
watch(() => props.loading, (val) => {
  if (!chartInstance) return
  if (val) {
    chartInstance.showLoading()
  } else {
    chartInstance.hideLoading()
  }
})

// 监听高度变化
watch(() => props.height, () => {
  nextTick(() => handleResize())
})
</script>

<template>
  <div class="base-chart">
    <!-- 加载状态 -->
    <div v-if="loading" class="chart-placeholder">
      <div class="spinner-sm" />
      <span>图表加载中...</span>
    </div>

    <!-- 空数据状态 -->
    <div v-else-if="empty" class="chart-placeholder">
      <el-empty :image-size="60" :description="emptyText" />
    </div>

    <!-- ECharts 容器 -->
    <div
      v-show="!loading && !empty"
      ref="chartRef"
      class="chart-container"
      :style="{ height: typeof height === 'number' ? height + 'px' : height }"
    />
  </div>
</template>

<style lang="scss" scoped>
.base-chart {
  width: 100%;
  position: relative;
}

.chart-container {
  width: 100%;
  min-height: 200px;
}

.chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 200px;
  color: $text-secondary;
  font-size: 14px;
  gap: 12px;
}

.spinner-sm {
  width: 20px;
  height: 20px;
  border: 2px solid $border-lighter;
  border-top-color: $brand-color;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
