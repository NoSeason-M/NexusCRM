<script setup>
/**
 * MarketingCampaignDetailView — 营销活动详情页
 */
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getMarketingCampaignDetail } from '@/api/marketing'
import { formatDate, formatCurrency } from '@/utils/format'
import { ArrowLeft } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const campaign = ref(null)
const loading = ref(true)
const errorMessage = ref('')

const statusMap = {
  planning: { label: '规划中', type: 'info' },
  active: { label: '进行中', type: 'success' },
  paused: { label: '已暂停', type: 'warning' },
  completed: { label: '已结束', type: 'primary' },
  cancelled: { label: '已取消', type: 'danger' }
}

async function loadDetail() {
  const id = route.params.id
  if (!id) { errorMessage.value = '缺少活动 ID'; loading.value = false; return }

  loading.value = true
  errorMessage.value = ''
  try {
    const res = await getMarketingCampaignDetail(id)
    campaign.value = res.data
  } catch (e) {
    if (e.response?.status === 404) errorMessage.value = '营销活动不存在'
    else errorMessage.value = e.response?.data?.message || e.message || '加载失败'
    campaign.value = null
  } finally {
    loading.value = false
  }
}

function goBack() { router.push('/marketing/campaigns') }

onMounted(loadDetail)
</script>

<template>
  <div class="campaign-detail">
    <div class="page-card">
      <div class="page-card__header detail-header">
        <div class="header-left">
          <el-button text :icon="ArrowLeft" @click="goBack">返回列表</el-button>
          <span class="title" v-if="campaign">{{ campaign.name }}</span>
          <span class="loading-title" v-else-if="loading">加载中...</span>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-section">
      <div class="page-card"><div class="skeleton-block" style="height: 200px" /></div>
    </div>

    <div v-else-if="errorMessage" class="page-card">
      <div class="error-section">
        <el-result icon="error" title="加载失败" :sub-title="errorMessage">
          <template #extra><el-button type="primary" @click="goBack">返回列表</el-button></template>
        </el-result>
      </div>
    </div>

    <template v-if="campaign && !loading && !errorMessage">
      <!-- 基本信息 -->
      <div class="page-card">
        <div class="page-card__header">
          <span class="section-title">基本信息</span>
          <el-tag :type="campaign.statusType || 'info'" size="default" effect="dark">{{ campaign.statusLabel }}</el-tag>
        </div>
        <div class="page-card__body">
          <el-descriptions :column="3" border size="small">
            <el-descriptions-item label="活动名称">{{ campaign.name }}</el-descriptions-item>
            <el-descriptions-item label="活动类型">{{ campaign.typeLabel }}</el-descriptions-item>
            <el-descriptions-item label="营销渠道">{{ campaign.channelLabel }}</el-descriptions-item>
            <el-descriptions-item label="负责人">{{ campaign.ownerName }}</el-descriptions-item>
            <el-descriptions-item label="开始日期">{{ campaign.startDate ? formatDate(campaign.startDate) : '-' }}</el-descriptions-item>
            <el-descriptions-item label="结束日期">{{ campaign.endDate ? formatDate(campaign.endDate) : '-' }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDate(campaign.createdAt) }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ formatDate(campaign.updatedAt) }}</el-descriptions-item>
            <el-descriptions-item label="描述" :span="3">{{ campaign.description || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </div>

      <!-- 财务指标 -->
      <div class="page-card">
        <div class="page-card__header"><span class="section-title">财务指标</span></div>
        <div class="page-card__body">
          <el-descriptions :column="3" border size="small">
            <el-descriptions-item label="预算">{{ formatCurrency(campaign.budget) }}</el-descriptions-item>
            <el-descriptions-item label="实际成本">{{ formatCurrency(campaign.actualCost) }}</el-descriptions-item>
            <el-descriptions-item label="预算使用率">{{ campaign.budgetUsageRate }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </div>

      <!-- 效果指标 -->
      <div class="page-card">
        <div class="page-card__header"><span class="section-title">效果指标</span></div>
        <div class="page-card__body">
          <el-descriptions :column="3" border size="small">
            <el-descriptions-item label="目标线索数">{{ campaign.targetLeadCount?.toLocaleString() || 0 }}</el-descriptions-item>
            <el-descriptions-item label="实际线索数">{{ campaign.leadCount?.toLocaleString() || 0 }}</el-descriptions-item>
            <el-descriptions-item label="转化线索数">{{ campaign.convertedLeadCount?.toLocaleString() || 0 }}</el-descriptions-item>
            <el-descriptions-item label="转化率">{{ campaign.conversionRate }}</el-descriptions-item>
            <el-descriptions-item label="单线索成本">{{ campaign.costPerLead }}</el-descriptions-item>
            <el-descriptions-item label=""></el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.campaign-detail {
  p { color: $text-regular; }
}
.detail-header { display: flex; align-items: center; justify-content: space-between; }
.header-left { display: flex; align-items: center; gap: 12px; }
.header-left .title { font-size: 16px; font-weight: 600; color: $text-primary; }
.header-left .loading-title { font-size: 16px; color: $text-secondary; }
.section-title { font-size: 15px; font-weight: 600; color: $text-primary; }
.loading-section .skeleton-block { background: $bg-page; border-radius: 4px; }
.error-section { display: flex; justify-content: center; padding: 40px 0; }
</style>
