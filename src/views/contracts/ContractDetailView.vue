<script setup>
/**
 * ContractDetailView — 合同详情页
 *
 * 功能：
 * - 合同基本信息展示
 * - 状态流转（根据状态规则显示可流转按钮）
 * - 审批流转历史时间线
 * - 附件列表
 */
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getContract, updateContractStatus, createContractAttachment, deleteContractAttachment } from '@/api/contract'
import { useUserStore } from '@/stores/user'
import { formatDate, formatCurrency } from '@/utils/format'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  Top,
  Edit,
  Refresh,
  Folder,
  Sort,
  Upload,
  Delete
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const contract = ref(null)
const loading = ref(true)
const errorMessage = ref('')
const statusLoading = ref(false)

// 状态映射
const statusMap = {
  draft: { label: '草稿', type: 'info' },
  approving: { label: '审批中', type: 'warning' },
  approved: { label: '已审批', type: 'primary' },
  rejected: { label: '已驳回', type: 'danger' },
  signed: { label: '已签署', type: 'success' },
  archived: { label: '已归档', type: 'info' }
}

// 状态流转规则
const STATUS_TRANSITIONS = {
  draft: ['approving'],
  approving: ['approved', 'rejected'],
  approved: ['signed'],
  rejected: ['approving'],
  signed: ['archived'],
  archived: []
}

// 流转权限对照
const TRANSITION_PERMISSIONS = {
  approving: 'contract:approve',
  approved: 'contract:approve',
  rejected: 'contract:approve',
  signed: 'contract:edit',
  archived: 'contract:edit'
}

// 流转动作命名
const TRANSITION_ACTIONS = {
  approving: '提交审批',
  approved: '审批通过',
  rejected: '驳回',
  signed: '签署合同',
  archived: '归档'
}

// 针对审批中的特殊处理
const isApproving = computed(() => contract.value?.status === 'approving')

const allowedTransitions = computed(() => {
  if (!contract.value) return []
  return (STATUS_TRANSITIONS[contract.value.status] || []).map(s => ({
    status: s,
    label: statusMap[s]?.label || s,
    action: TRANSITION_ACTIONS[s] || s,
    type: s === 'rejected' ? 'danger' : (s === 'approved' ? 'success' : 'primary')
  }))
})

// 权限检查
const canTransition = computed(() => {
  if (!contract.value) return false
  const transitions = STATUS_TRANSITIONS[contract.value.status] || []
  return transitions.some(s => {
    const perm = TRANSITION_PERMISSIONS[s]
    return perm ? userStore.hasPermission(perm) : false
  })
})

// ──── 附件管理 ────

const attachLoading = ref(false)
const deletingAttachmentId = ref('')

/** 是否有权限管理附件（需 contract:attachment + 未归档） */
const canManageAttachments = computed(() => {
  if (!contract.value) return false
  if (contract.value.status === 'archived') return false
  return userStore.hasPermission('contract:attachment')
})

/** 上传附件 */
async function uploadAttachment(file) {
  if (!contract.value || !file) return
  const raw = file.raw || file

  attachLoading.value = true
  try {
    await createContractAttachment(contract.value.id, {
      name: raw.name,
      type: raw.type,
      size: raw.size
    })
    ElMessage.success('附件上传成功')
    await loadContract()
  } catch (e) {
    const msg = e.response?.data?.message || e.message || '上传失败'
    ElMessage.error(msg)
  } finally {
    attachLoading.value = false
  }
}

/** 删除附件 */
async function handleDeleteAttachment(attachmentId, name) {
  if (!contract.value) return

  try {
    await ElMessageBox.confirm(
      `确定要删除附件「${name}」吗？`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    return
  }

  deletingAttachmentId.value = attachmentId
  try {
    await deleteContractAttachment(contract.value.id, attachmentId)
    ElMessage.success('附件已删除')
    await loadContract()
  } catch (e) {
    const msg = e.response?.data?.message || e.message || '删除失败'
    ElMessage.error(msg)
  } finally {
    deletingAttachmentId.value = ''
  }
}

async function loadContract() {
  const id = route.params.id
  if (!id) {
    errorMessage.value = '缺少合同 ID'
    loading.value = false
    return
  }

  loading.value = true
  errorMessage.value = ''
  try {
    const res = await getContract(id)
    contract.value = res.data
  } catch (e) {
    if (e.response?.status === 404) {
      errorMessage.value = '合同不存在'
    } else {
      errorMessage.value = e.response?.data?.message || e.message || '加载失败'
    }
    contract.value = null
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push('/contracts')
}

/** 状态流转 */
async function handleStatusTransition(toStatus) {
  const c = contract.value
  if (!c || !toStatus) return

  const targetLabel = statusMap[toStatus]?.label || toStatus
  const actionName = TRANSITION_ACTIONS[toStatus] || toStatus

  // 驳回需要确认
  if (toStatus === 'rejected') {
    try {
      await ElMessageBox.confirm(
        `确定要将合同「${c.name}」驳回吗？`,
        '驳回确认',
        {
          confirmButtonText: '确定驳回',
          cancelButtonText: '取消',
          type: 'warning',
          confirmButtonClass: 'el-button--danger'
        }
      )
    } catch {
      return
    }
  }

  // 归档需要确认
  if (toStatus === 'archived') {
    try {
      await ElMessageBox.confirm(
        `确定要将合同「${c.name}」归档吗？归档后不可再流转。`,
        '归档确认',
        {
          confirmButtonText: '确定归档',
          cancelButtonText: '取消',
          type: 'info'
        }
      )
    } catch {
      return
    }
  }

  statusLoading.value = true
  try {
    await updateContractStatus(route.params.id, { toStatus })
    ElMessage.success(`合同已${actionName}`)
    await loadContract()
  } catch (e) {
    const msg = e.response?.data?.message || e.message || '操作失败'
    ElMessage.error(msg)
  } finally {
    statusLoading.value = false
  }
}

onMounted(() => {
  loadContract()
})
</script>

<template>
  <div class="contract-detail">
    <!-- 页头 -->
    <div class="page-card">
      <div class="page-card__header detail-header">
        <div class="header-left">
          <el-button text :icon="ArrowLeft" @click="goBack">返回列表</el-button>
          <span class="title" v-if="contract">{{ contract.name }}</span>
          <span class="loading-title" v-else-if="loading">加载中...</span>
        </div>
        <div class="header-meta" v-if="contract">
          <span class="contract-no">{{ contract.contractNo }}</span>
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
    <template v-if="contract && !loading && !errorMessage">
      <!-- 基本信息 -->
      <div class="page-card">
        <div class="page-card__header">
          <span class="section-title">基本信息</span>
          <el-tag :type="contract.statusType || 'info'" size="default" effect="dark">
            {{ contract.statusLabel }}
          </el-tag>
        </div>
        <div class="page-card__body">
          <el-descriptions :column="3" border size="small">
            <el-descriptions-item label="合同名称" :span="1">
              {{ contract.name }}
            </el-descriptions-item>
            <el-descriptions-item label="合同编号" :span="1">
              {{ contract.contractNo }}
            </el-descriptions-item>
            <el-descriptions-item label="客户名称" :span="1">
              {{ contract.customerName }}
            </el-descriptions-item>
            <el-descriptions-item label="商机名称" :span="1">
              {{ contract.opportunityName || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="负责人" :span="1">
              {{ contract.ownerName }}
            </el-descriptions-item>
            <el-descriptions-item label="合同金额" :span="1">
              <span class="amount-text">{{ formatCurrency(contract.amount) }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="开始日期" :span="1">
              {{ formatDate(contract.startDate) }}
            </el-descriptions-item>
            <el-descriptions-item label="结束日期" :span="1">
              {{ formatDate(contract.endDate) }}
            </el-descriptions-item>
            <el-descriptions-item label="签署日期" :span="1">
              {{ contract.signedAt ? formatDate(contract.signedAt) : '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="创建时间" :span="1">
              {{ formatDate(contract.createdAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="更新时间" :span="1">
              {{ formatDate(contract.updatedAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="描述" :span="3">
              {{ contract.description || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>

      <!-- 状态流转 -->
      <div class="page-card" v-if="canTransition && allowedTransitions.length > 0">
        <div class="page-card__header">
          <span class="section-title">状态流转</span>
        </div>
        <div class="page-card__body">
          <div class="status-flow">
            <div class="current-status">
              <span class="current-status-label">当前状态</span>
              <el-tag
                :type="statusMap[contract.status]?.type || 'info'"
                size="large"
                effect="dark"
              >
                {{ contract.statusLabel }}
              </el-tag>
            </div>
            <div class="transition-actions">
              <span class="transition-label">可操作</span>
              <div class="transition-buttons">
                <el-button
                  v-for="item in allowedTransitions"
                  :key="item.status"
                  :type="item.type"
                  :icon="item.status === 'approved' ? Top : (item.status === 'rejected' ? Sort : (item.status === 'archived' ? Folder : Edit))"
                  :loading="statusLoading"
                  @click="handleStatusTransition(item.status)"
                >
                  {{ item.action }}
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 审批记录时间线 -->
      <div class="page-card">
        <div class="page-card__header">
          <span class="section-title">审批记录</span>
        </div>
        <div class="page-card__body">
          <div
            v-if="!contract.approvalRecords || contract.approvalRecords.length === 0"
            class="empty-timeline"
          >
            <el-empty description="暂无审批记录" />
          </div>
          <div v-else class="timeline">
            <div
              v-for="(record, index) in contract.approvalRecords"
              :key="record.id"
              class="timeline-item"
            >
              <div class="timeline-dot" :class="record.toStatus" />
              <div
                v-if="index < contract.approvalRecords.length - 1"
                class="timeline-line"
              />
              <div class="timeline-content">
                <div class="timeline-header">
                  <el-tag
                    :type="statusMap[record.toStatus]?.type || 'info'"
                    size="small"
                    effect="plain"
                  >
                    {{ record.toStatusLabel }}
                  </el-tag>
                  <template v-if="record.fromStatus">
                    <span class="timeline-arrow">
                      <el-icon><Top /></el-icon>
                    </span>
                    <el-tag
                      :type="statusMap[record.fromStatus]?.type || 'info'"
                      size="small"
                      effect="plain"
                    >
                      {{ record.fromStatusLabel }}
                    </el-tag>
                  </template>
                  <span class="timeline-owner">{{ record.operatorName }}</span>
                  <span class="timeline-time">{{ formatDate(record.operatedAt) }}</span>
                </div>
                <div v-if="record.comment" class="timeline-body">
                  {{ record.comment }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 附件列表 -->
      <div class="page-card">
        <div class="page-card__header">
          <span class="section-title">附件（{{ contract.attachments?.length || 0 }}）</span>
          <div class="header-actions" v-if="canManageAttachments">
            <el-upload
              :auto-upload="false"
              :show-file-list="false"
              :accept="'.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg'"
              :on-change="uploadAttachment"
            >
              <el-button type="primary" :icon="Upload" :loading="attachLoading">
                上传附件
              </el-button>
            </el-upload>
          </div>
        </div>
        <div class="page-card__body">
          <div
            v-if="!contract.attachments || contract.attachments.length === 0"
            class="empty-attachments"
          >
            <el-empty description="暂无附件" :image-size="80" />
          </div>
          <div v-else class="attachment-list">
            <div
              v-for="att in contract.attachments"
              :key="att.id"
              class="attachment-item"
            >
              <div class="attachment-info">
                <span class="attachment-name">{{ att.name }}</span>
                <el-tag size="small" type="info">{{ att.type }}</el-tag>
                <span class="attachment-size">{{ (att.size / 1024).toFixed(0) }}KB</span>
              </div>
              <el-button
                v-if="canManageAttachments"
                type="danger"
                size="small"
                text
                :icon="Delete"
                :loading="deletingAttachmentId === att.id"
                @click="handleDeleteAttachment(att.id, att.name)"
              >
                删除
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.contract-detail {
  p { color: $text-regular; }
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
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

.header-meta {
  .contract-no {
    font-size: 13px;
    color: $text-secondary;
    font-family: monospace;
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
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

// 状态流转
.status-flow {
  display: flex;
  align-items: center;
  gap: 32px;
  flex-wrap: wrap;
}

.current-status {
  display: flex;
  align-items: center;
  gap: 12px;
}

.current-status-label {
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

  &.draft { background: $info-color; }
  &.approving { background: $warning-color; }
  &.approved { background: $success-color; }
  &.rejected { background: $danger-color; }
  &.signed { background: $success-color; }
  &.archived { background: $border-base; }
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

// 附件列表
.attachment-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attachment-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: $bg-white;
  border: 1px solid $border-lighter;
  border-radius: 6px;
}

.attachment-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.attachment-name {
  font-size: 14px;
  color: $text-primary;
  font-weight: 500;
}

.attachment-size {
  font-size: 12px;
  color: $text-secondary;
}

.empty-attachments {
  padding: 10px 0;
}
</style>
