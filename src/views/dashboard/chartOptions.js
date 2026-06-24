/**
 * 图表 option 工厂函数
 *
 * 将 API 返回的原始数据转换为 ECharts option 配置。
 */

/**
 * 生成销售漏斗 option
 * @param {Array} data - [{ stage, label, count, amount }]
 */
export function buildFunnelOption(data) {
  return {
    tooltip: {
      trigger: 'item',
      formatter: function (params) {
        const amount = Number(params.data?.amount) || 0
        return `${params.name}<br/>数量：${params.value}<br/>金额：¥${amount.toLocaleString('zh-CN')}`
      }
    },
    legend: {
      data: data.map(d => d.label),
      bottom: 0
    },
    series: [
      {
        type: 'funnel',
        left: '10%',
        right: '15%',
        top: 10,
        bottom: 40,
        minSize: '10%',
        maxSize: '100%',
        sort: 'descending',
        gap: 2,
        label: {
          show: true,
          formatter: function (params) {
            return `${params.name}（${params.value}）`
          }
        },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 1
        },
        emphasis: {
          label: { fontSize: 14 }
        },
        data: data.map(d => ({
          name: d.label,
          value: d.count,
          amount: d.amount
        }))
      }
    ]
  }
}

/**
 * 生成合同签约趋势 option
 * @param {Array} data - [{ month, count, amount }]
 */
export function buildTrendOption(data) {
  return {
    tooltip: {
      trigger: 'axis',
      formatter: function (params) {
        const bar = params[0]
        const line = params[1]
        const amount = line ? Number(line.data) || 0 : 0
        return `${bar.axisValue}<br/>${bar.marker} 合同数：${bar.value}<br/>${line.marker} 金额：¥${amount.toLocaleString('zh-CN')}`
      }
    },
    legend: {
      data: ['合同数', '合同金额'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '50px',
      top: 10,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(d => d.month),
      axisLabel: { fontSize: 11 }
    },
    yAxis: [
      {
        type: 'value',
        name: '合同数',
        splitLine: { lineStyle: { type: 'dashed' } }
      },
      {
        type: 'value',
        name: '金额 (¥)',
        splitLine: { show: false },
        axisLabel: {
          formatter: function (value) {
            return value >= 10000 ? (value / 10000).toFixed(0) + '万' : value
          }
        }
      }
    ],
    series: [
      {
        name: '合同数',
        type: 'bar',
        barWidth: '40%',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#409eff' },
              { offset: 1, color: '#79bbff' }
            ]
          }
        },
        data: data.map(d => d.count)
      },
      {
        name: '合同金额',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3 },
        itemStyle: { color: '#e6a23c' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(230, 162, 60, 0.25)' },
              { offset: 1, color: 'rgba(230, 162, 60, 0.02)' }
            ]
          }
        },
        data: data.map(d => d.amount)
      }
    ]
  }
}

/**
 * 生成工单状态分布 option
 * @param {Array} data - [{ status, label, count }]
 */
export function buildPieOption(data) {
  const colorMap = {
    open: '#409eff',
    in_progress: '#e6a23c',
    pending: '#909399',
    resolved: '#67c23a',
    closed: '#c0c4cc'
  }

  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}：{c}（{d}%）'
    },
    legend: {
      data: data.map(d => d.label),
      bottom: 0
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '65%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        label: {
          show: true,
          formatter: '{b}\n{d}%',
          fontSize: 11
        },
        emphasis: {
          label: { fontSize: 14, fontWeight: 'bold' }
        },
        labelLine: { show: true },
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 2
        },
        data: data.map(d => ({
          name: d.label,
          value: d.count,
          itemStyle: { color: colorMap[d.status] || '#909399' }
        }))
      }
    ]
  }
}
