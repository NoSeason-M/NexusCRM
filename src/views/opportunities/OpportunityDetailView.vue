<script setup>
/**
 * OpportunityDetailView — 商机详情页
 *
 * 功能：
 * - 商机基本信息展示
 * - 阶段流转（根据阶段规则显示可流转按钮）
 * - 阶段流转历史时间线
 */
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getOpportunity, updateOpportunityStage, updateOpportunity } from '@/api/opportunity'
import { useUserStore } from '@/stores/user'
import { formatDate, formatCurrency, formatPercent } from '@/utils/format'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  Top,
  Right,
  Bottom,
  Sort
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const opportunity = ref(null)
const loading = ref(true)
const errorMessage = ref('')
const stageLoading = ref(false)

// 阶段映射
const stageMap = {
  lead: { label: '初步接触', type: 'info', color: '#909399' },
  qualified: { label: '需求确认', type: 'primary', color: '#409eff' },
  proposal: { label: '方案报价', type: 'warning', color: '#e6a23c' },
  negotiation: { label: '商务谈判', type: 'danger', color: '#f56c6c' },
  won: { label: '赢单', type: 'success', color: '#67c23a' },
  lost: { label: '输单', type: 'info', color: '#909399' }
}

// 阶段流转规则
const STAGE_TRANSITIONS = {
  lead: ['qualified', 'lost'],
  qualified: ['proposal', 'lost'],
  proposal: ['negotiation', 'lost'],
  negotiation: ['won', 'lost'],
  won: [],
  lost: []
}

// 权限检查
const canStage = computed(() => userStore.hasPermission('opportunity:stage'))

const allowedTransitions = computed(() => {
  if (!opportunity.value) return []
  return (STAGE_TRANSITIONS[opportunity.value.stage] || []).map(s => ({
    stage: s,
    label: stageMap[s]?.label || s,
    type: s === 'lost' ? 'danger' : (s === 'won' ? 'success' : 'primary'),
    icon: s === 'lost' ? Bottom : (s === 'won' ? Top : Right)
  }))
})

async function loadOpportunity() {
  const id = route.params.id
  if (!id) {
    errorMessage.value = '缺少商机 ID'
    loading.value = false
    return
  }

  loading.value = true
  errorMessage.value = ''
  try {
    const res = await getOpportunity(id)
    opportunity.value = res.data
  } catch (e) {
    if (e.response?.status === 404) {
      errorMessage.value = '商机不存在'
    } else {
      errorMessage.value = e.response?.data?.message || e.message || '加载失败'
    }
    opportunity.value = null
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push('/opportunities')
}

/** 阶段流转 */
async function handleStageTransition(toStage) {
  const opp = opportunity.value
  if (!opp || !toStage) return

  const targetLabel = stageMap[toStage]?.label || toStage

  // 输单需要确认
  if (toStage === 'lost') {
    try {
      await ElMessageBox.confirm(
        `确定将商机「${opp.title}」标记为输单吗？`,
        '阶段流转确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
          confirmButtonClass: 'el-button--danger'
        }
      )
    } catch {
      return
    }
  }

  // 赢单需要确认
  if (toStage === 'won') {
    try {
      await ElMessageBox.confirm(
        `确定将商机「${opp.title}」标记为赢单吗？`,
        '阶段流转确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'success'
        }
      )
    } catch {
      return
    }
  }

  stageLoading.value = true
  try {
    await updateOpportunityStage(route.params.id, { toStage })
    ElMessage.success(`商机已流转至「${targetLabel}」`)
    await loadOpportunity()
  } catch (e) {
    const msg = e.response?.data?.message || e.message || '流转失败'
    ElMessage.error(msg)
  } finally {
    stageLoading.value = false
  }
}

onMounted(() => {
  loadOpportunity()
})
</script>

<template>
  <div class="opportunity-detail">
    <!-- 页头 -->
    <div class="page-card">
      <div class="page-card__header detail-header">
        <div class="header-left">
          <el-button text :icon="ArrowLeft" @click="goBack">返回列表</el-button>
          <span class="title" v-if="opportunity">{{ opportunity.title }}</span>
          <span class="loading-title" v-else-if="loading">加载中...</span>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-section">
      <div class="page-card"><div class="skeleton-block" style="height: 200px" /></div>
    </div>

    <!-- 错误/404 -->
    <div v-else-if="errorMessage" class="page-card">
      <div class="error-section">
        <el-result icon="error" title="加载失败" :sub-title="errorMessage">
          <template #extra>
            <el-button type="primary" @click="goBack">返回列表</el-button>
          </template>
        </el-result>
      </div>
    </div>

    <!-- 正常内容 -->
    <template v-if="opportunity && !loading && !errorMessage">
      <!-- 基本信息 -->
      <div class="page-card">
        <div class="page-card__header">
          <span class="section-title">基本信息</span>
        </div>
        <div class="page-card__body">
          <el-descriptions :column="3" border size="small">
            <el-descriptions-item label="商机名称" :span="1">
              {{ opportunity.title }}
            </el-descriptions-item>
            <el-descriptions-item label="客户名称" :span="1">
              {{ opportunity.customerName }}
            </el-descriptions-item>
            <el-descriptions-item label="负责人" :span="1">
              {{ opportunity.ownerName }}
            </el-descriptions-item>
            <el-descriptions-item label="当前阶段" :span="1">
              <el-tag :type="stageMap[opportunity.stage]?.type || 'info'" size="small">
                {{ opportunity.stageLabel }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="商机金额" :span="1">
              <span class="amount-text">{{ formatCurrency(opportunity.amount) }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="成交概率" :span="1">
              {{ formatPercent(opportunity.probability) }}
            </el-descriptions-item>
            <el-descriptions-item label="预计关闭日期" :span="1">
              {{ formatDate(opportunity.expectedCloseDate) }}
            </el-descriptions-item>
            <el-descriptions-item label="创建时间" :span="1">
              {{ formatDate(opportunity.createdAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="更新时间" :span="1">
              {{ formatDate(opportunity.updatedAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="下一步计划" :span="3">
              {{ opportunity.nextStep || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="项目描述" :span="3">
              {{ opportunity.description || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>

      <!-- 阶段流转 -->
      <div class="page-card" v-if="canStage && allowedTransitions.length > 0">
        <div class="page-card__header">
          <span class="section-title">阶段流转</span>
        </div>
        <div class="page-card__body">
          <div class="stage-flow">
            <!-- 当前阶段 -->
            <div class="current-stage">
              <span class="current-stage-label">当前阶段</span>
              <el-tag
                :type="stageMap[opportunity.stage]?.type || 'info'"
                size="large"
                effect="dark"
              >
                {{ opportunity.stageLabel }}
              </el-tag>
            </div>

            <!-- 可流转目标 -->
            <div class="transition-actions">
              <span class="transition-label">可流转至</span>
              <div class="transition-buttons">
                <el-button
                  v-for="item in allowedTransitions"
                  :key="item.stage"
                  :type="item.type"
                  :icon="item.icon"
                  :loading="stageLoading"
                  @click="handleStageTransition(item.stage)"
                >
                  标记为「{{ item.label }}」
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 阶段流转历史 -->
      <div class="page-card">
        <div class="page-card__header">
          <span class="section-title">流转记录</span>
        </div>
        <div class="page-card__body">
          <div
            v-if="!opportunity.stageRecords || opportunity.stageRecords.length === 0"
            class="empty-timeline"
          >
            <el-empty description="暂无流转记录" />
          </div>
          <div v-else class="timeline">
            <div
              v-for="(record, index) in opportunity.stageRecords"
              :key="record.id"
              class="timeline-item"
            >
              <div class="timeline-dot" :class="record.toStage" />
              <div
                v-if="index < opportunity.stageRecords.length - 1"
                class="timeline-line"
              />
              <div class="timeline-content">
                <div class="timeline-header">
                  <el-tag
                    :type="stageMap[record.toStage]?.type || 'info'"
                    size="small"
                    effect="plain"
                  >
                    {{ stageMap[record.toStage]?.label || record.toStage }}
                  </el-tag>
                  <template v-if="record.fromStage">
                    <span class="timeline-arrow">
                      <el-icon><Right /></el-icon>
                    </span>
                    <el-tag
                      :type="stageMap[record.fromStage]?.type || 'info'"
                      size="small"
                      effect="plain"
                    >
                      {{ stageMap[record.fromStage]?.label || record.fromStage }}
                    </el-tag>
                  </template>
                  <span class="timeline-owner">{{ record.changedByName }}</span>
                  <span class="timeline-time">{{ formatDate(record.changedAt) }}</span>
                </div>
                <div v-if="record.note" class="timeline-body">
                  {{ record.note }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.opportunity-detail {
  p { color: $text-regular; }
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;

  .title {
    font-size: 18px;
    font-weight: 600;
    color: $text-primary;
  }

  .loading-title {
    font-size: 16px;
    color: $text-secondary;
  }
}

.page-card + .page-card {
  margin-top: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: $text-primary;
}

.amount-text {
  font-weight: 600;
  color: $text-primary;
}

// 加载骨架
.loading-section {
  .skeleton-block {
    height: 200px;
    background: linear-gradient(90deg, $border-lighter 25%, #e8e8e8 50%, $border-lighter 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
    border-radius: 4px;
  }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

// 阶段流转
.stage-flow {
  display: flex;
  align-items: center;
  gap: 32px;
  flex-wrap: wrap;
}

.current-stage {
  display: flex;
  align-items: center;
  gap: 12px;
}

.current-stage-label {
  font-size: 14px;
  color: $text-secondary;
}

.transition-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.transition-label {
  font-size: 14px;
  color: $text-secondary;
}

.transition-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

// 时间线
.timeline {
  position: relative;
  padding-left: 32px;
}

.timeline-item {
  position: relative;
  padding-bottom: 24px;

  &:last-child { padding-bottom: 0; }
}

.timeline-dot {
  position: absolute;
  left: -32px;
  top: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: $brand-color;
  border: 3px solid $border-extra-light;
  z-index: 1;

  &.won { background: $success-color; }
  &.lost { background: $info-color; }
  &.negotiation { background: $danger-color; }
  &.proposal { background: $warning-color; }
  &.qualified { background: $brand-color; }
  &.lead { background: $info-color; }
}

.timeline-line {
  position: absolute;
  left: -23px;
  top: 24px;
  bottom: 0;
  width: 2px;
  background: $border-lighter;
}

.timeline-content {
  background: $bg-page;
  border-radius: 8px;
  padding: 10px 14px;
  border: 1px solid $border-lighter;
}

.timeline-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.timeline-arrow {
  color: $text-placeholder;
  display: flex;
  align-items: center;
}

.timeline-owner {
  font-size: 13px;
  font-weight: 500;
  color: $text-primary;
}

.timeline-time {
  font-size: 12px;
  color: $text-secondary;
}

.timeline-body {
  font-size: 13px;
  color: $text-regular;
  margin-top: 4px;
}

.empty-timeline {
  padding: 20px 0;
}
</style>
