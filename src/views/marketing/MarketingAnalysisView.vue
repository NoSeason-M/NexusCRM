<script setup>
/**
 * MarketingAnalysisView — 营销 ROI 分析页
 *
 * 功能：
 * - 概览统计卡片（总预算、总成本、总线索数、总转化数）
 * - 按活动类型的预算/成本对比柱状图
 * - 按渠道的线索转化分布图
 * - ROI 明细表格（含转化率、成本等指标）
 */
import { ref, computed, onMounted } from 'vue'
import { getMarketingAnalysisData } from '@/api/marketing'
import { formatCurrency } from '@/utils/format'
import { Refresh } from '@element-plus/icons-vue'
import BaseChart from '@/views/dashboard/components/BaseChart.vue'

const userStore = useUserStore()

const loading = ref(false)
const error = ref('')
const data = ref(null)
const filters = ref({ keyword: '', type: '' })
const typeOptions = ref([])

const filteredCampaigns = computed(() => {
  if (!data.value?.campaigns) return []
  let list = data.value.campaigns
  if (filters.value.keyword) {
    const kw = filters.value.keyword.toLowerCase()
    list = list.filter(c => c.name.toLowerCase().includes(kw))
  }
  if (filters.value.type) {
    list = list.filter(c => c.type === filters.value.type)
  }
  return list
})

// 类型分布柱状图
const typeChartOption = computed(() => {
  const byType = data.value?.byType || []
  if (!byType.length) return null

  const types = byType.map(t => t.typeLabel)
  return {
    tooltip: {
      trigger: 'axis',
      formatter: function (params) {
        let s = params[0].axisValue + '<br/>'
        params.forEach(p => {
          const val = typeof p.value === 'number' ? formatCurrency(p.value) : p.value
          s += p.marker + ' ' + p.seriesName + '：' + val + '<br/>'
        })
        return s
      }
    },
    legend: { data: ['预算', '实际成本'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '50px', top: 10, containLabel: true },
    xAxis: { type: 'category', data: types, axisLabel: { fontSize: 11 } },
    yAxis: {
      type: 'value',
      name: '金额 (¥)',
      axisLabel: { formatter: v => v >= 10000 ? (v / 10000).toFixed(0) + '万' : v }
    },
    series: [
      {
        name: '预算',
        type: 'bar',
        barWidth: '30%',
        itemStyle: { color: '#409eff' },
        data: byType.map(t => t.budget)
      },
      {
        name: '实际成本',
        type: 'bar',
        barWidth: '30%',
        itemStyle: { color: '#e6a23c' },
        data: byType.map(t => t.actualCost)
      }
    ]
  }
})

// 渠道对比饼图
const channelPieOption = computed(() => {
  const byChannel = data.value?.byChannel || []
  if (!byChannel.length) return null

  const colorMap = {
    online: '#409eff',
    offline: '#67c23a',
    hybrid: '#e6a23c'
  }

  return {
    tooltip: { trigger: 'item', formatter: '{b}：{c}（{d}%）' },
    legend: { data: byChannel.map(c => c.channelLabel), bottom: 0 },
    series: [
      {
        type: 'pie',
        radius: ['40%', '65%'],
        center: ['50%', '45%'],
        label: { show: true, formatter: '{b}\n{d}%', fontSize: 11 },
        emphasis: { label: { fontSize: 14, fontWeight: 'bold' } },
        data: byChannel.map(c => ({
          name: c.channelLabel,
          value: c.convertedLeadCount || c.leadCount || c.count,
          itemStyle: { color: colorMap[c.channel] || '#909399' }
        }))
      }
    ]
  }
})

// 渠道对比柱状图（线索数 + 转化数）
const channelBarOption = computed(() => {
  const byChannel = data.value?.byChannel || []
  if (!byChannel.length) return null

  const channels = byChannel.map(c => c.channelLabel)
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['线索数', '转化数'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '50px', top: 10, containLabel: true },
    xAxis: { type: 'category', data: channels },
    yAxis: { type: 'value' },
    series: [
      {
        name: '线索数',
        type: 'bar',
        barWidth: '30%',
        itemStyle: { color: '#409eff' },
        data: byChannel.map(c => c.leadCount)
      },
      {
        name: '转化数',
        type: 'bar',
        barWidth: '30%',
        itemStyle: { color: '#67c23a' },
        data: byChannel.map(c => c.convertedLeadCount)
      }
    ]
  }
})

async function fetchData() {
  loading.value = true
  error.value = ''
  try {
    const res = await getMarketingAnalysisData()
    data.value = res.data
    // 提取类型选项
    const types = [...new Set((res.data.campaigns || []).map(c => c.type))]
    typeOptions.value = types.map(t => ({
      value: t,
      label: (res.data.campaigns.find(c => c.type === t)?.typeLabel) || t
    }))
  } catch (e) {
    error.value = e.response?.data?.message || e.message || '加载失败'
    data.value = null
  } finally {
    loading.value = false
  }
}

function handleReset() {
  filters.value = { keyword: '', type: '' }
}

onMounted(fetchData)
</script>

<template>
  <div class="analysis-page">
    <!-- 概览统计 -->
    <div class="page-card" v-if="data && !loading">
      <div class="page-card__header"><span class="title">营销 ROI 概览</span></div>
      <div class="page-card__body">
        <el-row :gutter="16">
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-value">{{ data.campaigns.length }}</div>
              <div class="stat-label">活动总数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-value">{{ formatCurrency(data.byType.reduce((s, t) => s + t.budget, 0)) }}</div>
              <div class="stat-label">总预算</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-value">{{ formatCurrency(data.byType.reduce((s, t) => s + t.actualCost, 0)) }}</div>
              <div class="stat-label">实际总成本</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-value">{{ data.byType.reduce((s, t) => s + t.leadCount, 0).toLocaleString() }}</div>
              <div class="stat-label">总线索数</div>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="page-card" v-if="data && !loading">
      <div class="page-card__header"><span class="title">费用投入分析</span></div>
      <div class="page-card__body">
        <el-row :gutter="16">
          <el-col :span="12">
            <div class="chart-box">
              <h4 class="chart-title">按活动类型预算 vs 成本</h4>
              <BaseChart :option="typeChartOption" :height="280" :loading="false" :empty="!typeChartOption" />
            </div>
          </el-col>
          <el-col :span="12">
            <div class="chart-box">
              <h4 class="chart-title">按渠道转化分布</h4>
              <BaseChart :option="channelPieOption" :height="280" :loading="false" :empty="!channelPieOption" />
            </div>
          </el-col>
        </el-row>
      </div>
    </div>

    <!-- 渠道线索对比 -->
    <div class="page-card" v-if="data && !loading">
      <div class="page-card__header"><span class="title">渠道线索分析</span></div>
      <div class="page-card__body">
        <div class="chart-box">
          <h4 class="chart-title">各渠道线索获取 vs 转化</h4>
          <BaseChart :option="channelBarOption" :height="300" :loading="false" :empty="!channelBarOption" />
        </div>
      </div>
    </div>

    <!-- 搜索/筛选 -->
    <div class="page-card">
      <div class="page-card__header">
        <span class="title">活动 ROI 明细</span>
      </div>
      <div class="page-card__body">
        <el-form :model="filters" label-width="80px" size="small">
          <el-row :gutter="16">
            <el-col :span="8">
              <el-form-item label="关键词">
                <el-input v-model="filters.keyword" placeholder="活动名称" clearable />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="类型">
                <el-select v-model="filters.type" placeholder="全部" clearable style="width: 100%">
                  <el-option v-for="t in typeOptions" :key="t.value" :label="t.label" :value="t.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="10">
              <div class="filter-actions">
                <el-button :icon="Refresh" @click="handleReset">重置</el-button>
              </div>
            </el-col>
          </el-row>
        </el-form>
      </div>
    </div>

    <!-- 表格 -->
    <div class="page-card">
      <div class="page-card__body">
        <div v-if="loading" class="loading-state"><el-skeleton :rows="6" animated /></div>
        <div v-else-if="error" class="error-state">
          <el-result icon="error" title="加载失败" :sub-title="error">
            <template #extra><el-button type="primary" @click="fetchData">重新加载</el-button></template>
          </el-result>
        </div>
        <div v-else-if="!data" class="empty-state">
          <el-empty description="暂无数据">
            <el-button type="primary" @click="fetchData">重新加载</el-button>
          </el-empty>
        </div>
        <template v-else>
          <el-table :data="filteredCampaigns" stripe style="width: 100%">
            <el-table-column prop="name" label="活动名称" min-width="160" show-overflow-tooltip />
            <el-table-column label="类型" width="80">
              <template #default="{ row }">{{ row.typeLabel }}</template>
            </el-table-column>
            <el-table-column label="状态" width="70" align="center">
              <template #default="{ row }">
                <el-tag :type="row.statusType || 'info'" size="small">{{ row.statusLabel }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="预算" width="110" align="right">
              <template #default="{ row }">{{ formatCurrency(row.budget) }}</template>
            </el-table-column>
            <el-table-column label="实际成本" width="110" align="right">
              <template #default="{ row }">{{ formatCurrency(row.actualCost) }}</template>
            </el-table-column>
            <el-table-column label="线索数" width="80" align="center">
              <template #default="{ row }">{{ row.leadCount }}</template>
            </el-table-column>
            <el-table-column label="转化数" width="80" align="center">
              <template #default="{ row }">{{ row.convertedLeadCount }}</template>
            </el-table-column>
            <el-table-column label="转化率" width="80" align="center">
              <template #default="{ row }">{{ row.conversionRate }}</template>
            </el-table-column>
            <el-table-column label="预算使用率" width="100" align="center">
              <template #default="{ row }">{{ row.budgetUsageRate }}</template>
            </el-table-column>
            <el-table-column label="单线索成本" width="100" align="right">
              <template #default="{ row }">{{ row.costPerLead }}</template>
            </el-table-column>
            <el-table-column prop="ownerName" label="负责人" width="80" />
          </el-table>
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.analysis-page {
  p { color: $text-regular; }
}
.filter-actions { display: flex; gap: 8px; padding-top: 2px; }
.page-card__header { display: flex; align-items: center; justify-content: space-between; }
.loading-state { padding: 20px 0; }
.error-state, .empty-state { display: flex; flex-direction: column; align-items: center; padding: 40px 0; }
.stat-card {
  text-align: center; padding: 12px 0;
  .stat-value { font-size: 20px; font-weight: 700; color: $text-primary; }
  .stat-label { font-size: 12px; color: $text-secondary; margin-top: 4px; }
}
.chart-box {
  .chart-title { font-size: 13px; color: $text-secondary; margin: 0 0 8px; font-weight: 500; }
}
</style>
