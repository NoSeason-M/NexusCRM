<script setup>
import { ref, computed, onMounted } from 'vue'
import { getDashboardSummary, getSalesFunnel, getContractTrend, getTicketStatus } from '@/api/dashboard'
import { formatNumber, formatCurrency } from '@/utils/format'
import MetricCard from './components/MetricCard.vue'
import TodoList from './components/TodoList.vue'
import RecentFollowList from './components/RecentFollowList.vue'
import BaseChart from './components/BaseChart.vue'
import { buildFunnelOption, buildTrendOption, buildPieOption } from './chartOptions'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

// ─── 概览指标 ───
const summary = ref(null)
const summaryLoading = ref(false)
const summaryError = ref('')

async function fetchSummary() {
  summaryLoading.value = true
  summaryError.value = ''
  try {
    const res = await getDashboardSummary()
    summary.value = res.data
  } catch (e) {
    summaryError.value = e.response?.data?.message || e.message || '加载失败'
  } finally {
    summaryLoading.value = false
  }
}

// ─── 图表数据 ───
const funnelData = ref(null)
const funnelLoading = ref(false)
const trendData = ref(null)
const trendLoading = ref(false)
const ticketData = ref(null)
const ticketLoading = ref(false)

async function fetchCharts() {
  // 销售漏斗
  funnelLoading.value = true
  try {
    const res = await getSalesFunnel()
    funnelData.value = res.data
  } catch {
    funnelData.value = []
  } finally {
    funnelLoading.value = false
  }

  // 合同趋势
  trendLoading.value = true
  try {
    const res = await getContractTrend()
    trendData.value = res.data
  } catch {
    trendData.value = []
  } finally {
    trendLoading.value = false
  }

  // 工单状态
  ticketLoading.value = true
  try {
    const res = await getTicketStatus()
    ticketData.value = res.data
  } catch {
    ticketData.value = []
  } finally {
    ticketLoading.value = false
  }
}

// 图表 option（ computed ）
const funnelOption = computed(() => {
  if (!funnelData.value || funnelData.value.length === 0) return null
  return buildFunnelOption(funnelData.value)
})

const trendOption = computed(() => {
  if (!trendData.value || trendData.value.length === 0) return null
  return buildTrendOption(trendData.value)
})

const ticketOption = computed(() => {
  if (!ticketData.value || ticketData.value.length === 0) return null
  return buildPieOption(ticketData.value)
})

onMounted(() => {
  fetchSummary()
  fetchCharts()
})
</script>

<template>
  <div class="dashboard">
    <!-- 加载状态 -->
    <template v-if="summaryLoading">
      <div class="page-card">
        <div class="page-card__body">
          <div class="loading-state">
            <div class="spinner" />
            <p>数据加载中...</p>
          </div>
        </div>
      </div>
    </template>

    <!-- 错误状态 -->
    <template v-else-if="summaryError">
      <div class="page-card">
        <div class="page-card__body">
          <div class="error-state">
            <el-result
              icon="error"
              title="加载失败"
              :sub-title="summaryError"
            >
              <template #extra>
                <el-button type="primary" @click="fetchSummary">重新加载</el-button>
              </template>
            </el-result>
          </div>
        </div>
      </div>
    </template>

    <!-- 空数据状态 -->
    <template v-else-if="summary && summary.customerCount === 0 && summary.activeOpportunityCount === 0">
      <div class="page-card">
        <div class="page-card__header">
          <span class="title">工作台</span>
        </div>
        <div class="page-card__body">
          <div class="empty-state">
            <el-empty description="暂无数据，请先初始化模拟数据" />
            <el-button type="primary" @click="fetchSummary">刷新数据</el-button>
          </div>
        </div>
      </div>
    </template>

    <!-- 正常数据展示 -->
    <template v-else-if="summary">
      <!-- 指标卡区域 -->
      <div class="page-card">
        <div class="page-card__header">
          <span class="title">工作台概览</span>
        </div>
        <div class="page-card__body">
          <div class="metric-grid">
            <MetricCard
              label="客户总数"
              :value="formatNumber(summary.customerCount)"
              description="全部注册客户"
              tone="primary"
            />
            <MetricCard
              label="活跃客户"
              :value="formatNumber(summary.activeCustomerCount)"
              :description="`占比 ${summary.customerCount ? Math.round(summary.activeCustomerCount / summary.customerCount * 100) : 0}%`"
              tone="success"
            />
            <MetricCard
              label="进行中商机"
              :value="formatNumber(summary.activeOpportunityCount)"
              description="未关闭的商机项目"
              tone="primary"
            />
            <MetricCard
              label="商机总额"
              :value="formatCurrency(summary.opportunityAmount)"
              description="所有商机金额合计"
              tone="warning"
            />
            <MetricCard
              label="合同总额"
              :value="formatCurrency(summary.contractAmount)"
              description="已签约合同金额合计"
              tone="success"
            />
            <MetricCard
              label="待处理工单"
              :value="formatNumber(summary.pendingTicketCount)"
              :description="summary.pendingTicketCount > 0 ? '需要尽快处理' : '暂无待办'"
              :tone="summary.pendingTicketCount > 0 ? 'danger' : 'info'"
            />
          </div>
        </div>
      </div>

      <!-- 待办与跟进双栏布局 -->
      <div class="activity-section">
        <div class="activity-col">
          <TodoList />
        </div>
        <div class="activity-col">
          <RecentFollowList />
        </div>
      </div>

      <!-- 图表区域 — 3 栏布局 -->
      <div class="charts-section">
        <div class="page-card chart-card">
          <div class="page-card__header">
            <span class="title">销售漏斗</span>
          </div>
          <div class="page-card__body">
            <BaseChart
              :option="funnelOption"
              :loading="funnelLoading"
              :empty="!funnelData || funnelData.length === 0"
              :height="320"
            />
          </div>
        </div>

        <div class="page-card chart-card">
          <div class="page-card__header">
            <span class="title">合同签约趋势</span>
          </div>
          <div class="page-card__body">
            <BaseChart
              :option="trendOption"
              :loading="trendLoading"
              :empty="!trendData || trendData.length === 0"
              :height="320"
            />
          </div>
        </div>

        <div class="page-card chart-card">
          <div class="page-card__header">
            <span class="title">工单状态分布</span>
          </div>
          <div class="page-card__body">
            <BaseChart
              :option="ticketOption"
              :loading="ticketLoading"
              :empty="!ticketData || ticketData.length === 0"
              :height="320"
            />
          </div>
        </div>
      </div>

      <!-- 权限演示区域 -->
      <div class="page-card">
        <div class="page-card__body">
          <el-divider />

          <h4 class="perm-title">按钮权限测试（{{ userStore.roleName }}）</h4>
          <div class="perm-buttons">
            <el-button
              v-if="userStore.hasPermission('customer:create')"
              type="primary"
            >
              新建客户 (customer:create)
            </el-button>

            <el-button
              v-if="userStore.hasPermission('opportunity:create')"
              type="success"
            >
              新建商机 (opportunity:create)
            </el-button>

            <el-button
              v-if="userStore.hasPermission('contract:approve')"
              type="warning"
            >
              审批合同 (contract:approve)
            </el-button>

            <el-button
              v-if="userStore.hasPermission('ticket:handle')"
              type="danger"
            >
              处理工单 (ticket:handle)
            </el-button>
          </div>

          <el-alert
            class="perm-info"
            title="由于 admin 拥有 * 通配权限，所以能看见所有按钮。可用其他账号登录对比"
            type="info"
            show-icon
            :closable="false"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.dashboard {
  p {
    color: $text-regular;
    font-size: 16px;
  }
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.activity-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 16px;

  // 小屏幕下切换为单列
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
}

.activity-col {
  min-width: 0;
}

.charts-section {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
  margin-top: 16px;

  @media (max-width: 1400px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

.chart-card {
  min-width: 0;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid $border-lighter;
  border-top-color: $brand-color;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.perm-title {
  font-size: 14px;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 12px;
}

.perm-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.perm-info {
  margin-top: 8px;
}
</style>
