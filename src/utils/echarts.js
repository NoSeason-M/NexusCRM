/**
 * ECharts 按需引入
 *
 * 只注册实际使用的图表类型和组件，减少打包体积。
 */
import { use, init, dispose, connect, disconnect, getInstanceByDom } from 'echarts/core'
import { FunnelChart, LineChart, BarChart, PieChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([
  FunnelChart,
  LineChart,
  BarChart,
  PieChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  CanvasRenderer
])

/**
 * 封装 echarts 核心方法，保持与旧 API 兼容
 */
const echarts = {
  init,
  dispose,
  connect,
  disconnect,
  getInstanceByDom
}

export { echarts }
