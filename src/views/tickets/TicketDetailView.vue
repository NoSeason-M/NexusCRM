<script setup>
/**
 * TicketDetailView — 工单详情页
 *
 * 功能：
 * - 工单基本信息展示
 * - 分配工单（ticket:handle 权限）
 * - 状态流转（按状态机规则）
 * - 跟进记录（备注）时间线
 */
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getTicketDetail, assignTicket, updateTicketStatus, createTicketRecord } from '@/api/ticket'
import { useUserStore } from '@/stores/user'
import { formatDate } from '@/utils/format'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Top } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const ticket = ref(null)
const loading = ref(true)
const errorMessage = ref('')
const opLoading = ref(false)

// ──── 状态映射 ────
const statusMap = {
  pending:               { label: '待处理',     type: 'danger' },
  processing:            { label: '处理中',     type: 'warning' },
  pending_confirmation:  { label: '待确认',     type: 'primary' },
  resolved:              { label: '已解决',     type: 'info' },
  closed:                { label: '已关闭',     type: 'success' }
}

// 状态流转规则（同后端）
const STATUS_TRANSITIONS = {
  pending: [],
  processing: ['pending_confirmation'],
  pending_confirmation: ['resolved'],
  resolved: ['closed'],
  closed: []
}

// 流转动作命名
const TRANSITION_ACTIONS = {
  pending_confirmation: '提交确认',
  resolved: '确认解决',
  closed: '关闭工单'
}

const allowedTransitions = computed(() => {
  if (!ticket.value) return []
  return (STATUS_TRANSITIONS[ticket.value.status] || []).map(s => ({
    status: s,
    label: statusMap[s]?.label || s,
    action: TRANSITION_ACTIONS[s] || s,
    type: s === 'closed' ? 'danger' : 'primary'
  }))
})

const canHandle = computed(() => userStore.hasPermission('ticket:handle'))

// ──── 分配对话框 ────
const assignDialogVisible = ref(false)
const assigneeId = ref('')
const assignSaving = ref(false)

// ──── 跟进记录输入 ────
const recordContent = ref('')
const recordSaving = ref(false)

async function loadTicket() {
  const id = route.params.id
  if (!id) {
    errorMessage.value = '缺少工单 ID'
    loading.value = false
    return
  }

  loading.value = true
  errorMessage.value = ''
  try {
    const res = await getTicketDetail(id)
    ticket.value = res.data
  } catch (e) {
    if (e.response?.status === 404) {
      errorMessage.value = '工单不存在'
    } else {
      errorMessage.value = e.response?.data?.message || e.message || '加载失败'
    }
    ticket.value = null
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push('/tickets')
}

// ──── 分配操作 ────
function openAssignDialog() {
  assigneeId.value = ticket.value?.assigneeId || ''
  assignDialogVisible.value = true
}

async function handleAssign() {
  if (!assigneeId.value) {
    ElMessage.warning('请选择处理人')
    return
  }
  assignSaving.value = true
  try {
    await assignTicket(route.params.id, assigneeId.value)
    ElMessage.success('分配成功')
    assignDialogVisible.value = false
    await loadTicket()
  } catch (e) {
    const msg = e.response?.data?.message || e.message || '分配失败'
    ElMessage.error(msg)
  } finally {
    assignSaving.value = false
  }
}

// ──── 状态流转 ────
async function handleStatusTransition(toStatus) {
  const t = ticket.value
  if (!t || !toStatus) return

  const targetLabel = statusMap[toStatus]?.label || toStatus

  // 关闭工单需确认
  if (toStatus === 'closed') {
    try {
      await ElMessageBox.confirm(
        `确定要关闭工单「${t.ticketNo}」吗？关闭后不可再变更。`,
        '关闭确认',
        {
          confirmButtonText: '确定关闭',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
    } catch {
      return
    }
  }

  opLoading.value = true
  try {
    await updateTicketStatus(route.params.id, { toStatus })
    ElMessage.success(`工单已${targetLabel}`)
    await loadTicket()
  } catch (e) {
    const msg = e.response?.data?.message || e.message || '操作失败'
    ElMessage.error(msg)
  } finally {
    opLoading.value = false
  }
}

// ──── 跟进记录 ────
async function handleAddRecord() {
  const content = recordContent.value?.trim()
  if (!content) {
    ElMessage.warning('请输入跟进内容')
    return
  }
  recordSaving.value = true
  try {
    await createTicketRecord(route.params.id, content)
    ElMessage.success('跟进记录已添加')
    recordContent.value = ''
    await loadTicket()
  } catch (e) {
    const msg = e.response?.data?.message || e.message || '操作失败'
    ElMessage.error(msg)
  } finally {
    recordSaving.value = false
  }
}

// ──── 补充选项数据 ────
import { getTicketOptions } from '@/api/ticket'
const assigneeOptions = ref([])

async function fetchOptions() {
  try {
    const res = await getTicketOptions()
    assigneeOptions.value = res.data.assignees || []
  } catch {
    // 静默失败
  }
}

onMounted(() => {
  loadTicket()
  fetchOptions()
})
</script>

<template>
  <div class="ticket-detail">
    <!-- 页头 -->
    <div class="page-card">
      <div class="page-card__header detail-header">
        <div class="header-left">
          <el-button text :icon="ArrowLeft" @click="goBack">返回列表</el-button>
          <span class="title" v-if="ticket">{{ ticket.ticketNo }} - {{ ticket.title }}</span>
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
    <template v-if="ticket && !loading && !errorMessage">
      <!-- 基本信息 -->
      <div class="page-card">
        <div class="page-card__header">
          <span class="section-title">基本信息</span>
          <div style="display: flex; align-items: center; gap: 8px;">
            <el-tag :type="ticket.statusType || 'info'" size="default" effect="dark">
              {{ ticket.statusLabel }}
            </el-tag>
          </div>
        </div>
        <div class="page-card__body">
          <el-descriptions :column="3" border size="small">
            <el-descriptions-item label="工单编号">{{ ticket.ticketNo }}</el-descriptions-item>
            <el-descriptions-item label="标题">{{ ticket.title }}</el-descriptions-item>
            <el-descriptions-item label="关联客户">{{ ticket.customerName }}</el-descriptions-item>
            <el-descriptions-item label="工单类型">{{ ticket.issueTypeLabel }}</el-descriptions-item>
            <el-descriptions-item label="优先级">
              <el-tag
                :type="ticket.priorityType || 'info'"
                size="small"
                effect="plain"
              >
                {{ ticket.priorityLabel }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="状态">{{ ticket.statusLabel }}</el-descriptions-item>
            <el-descriptions-item label="创建人">{{ ticket.creatorName }}</el-descriptions-item>
            <el-descriptions-item label="负责人">
              <span v-if="ticket.assigneeName">{{ ticket.assigneeName }}</span>
              <el-tag v-else type="info" size="small">未分配</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDate(ticket.createdAt) }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ formatDate(ticket.updatedAt) }}</el-descriptions-item>
            <el-descriptions-item label="解决时间" v-if="ticket.resolvedAt">{{ formatDate(ticket.resolvedAt) }}</el-descriptions-item>
            <el-descriptions-item label="关闭时间" v-if="ticket.closedAt">{{ formatDate(ticket.closedAt) }}</el-descriptions-item>
            <el-descriptions-item label="描述" :span="3">
              {{ ticket.description || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>

      <!-- 操作区 -->
      <div class="page-card" v-if="canHandle">
        <div class="page-card__header">
          <span class="section-title">工单处理</span>
        </div>
        <div class="page-card__body">
          <div class="action-bar">
            <!-- 分配按钮 -->
            <el-button
              v-if="ticket.status !== 'closed'"
              type="primary"
              plain
              :icon="Top"
              @click="openAssignDialog"
              :disabled="opLoading"
            >
              {{ ticket.assigneeId ? '重新分配' : '分配处理人' }}
            </el-button>

            <!-- 状态流转按钮 -->
            <el-button
              v-for="item in allowedTransitions"
              :key="item.status"
              :type="item.type"
              :loading="opLoading"
              @click="handleStatusTransition(item.status)"
            >
              {{ item.action }}
            </el-button>
          </div>
        </div>
      </div>

      <!-- 跟进记录时间线 -->
      <div class="page-card">
        <div class="page-card__header">
          <span class="section-title">跟进记录</span>
        </div>
        <div class="page-card__body">
          <!-- 新增记录 -->
          <div class="record-input" v-if="canHandle && ticket.status !== 'closed'">
            <el-input
              v-model="recordContent"
              type="textarea"
              :rows="2"
              placeholder="输入跟进内容..."
              maxlength="1000"
              show-word-limit
            />
            <div class="record-input-actions">
              <el-button
                type="primary"
                size="small"
                :loading="recordSaving"
                :disabled="!recordContent.trim()"
                @click="handleAddRecord"
              >
                添加记录
              </el-button>
            </div>
          </div>

          <!-- 时间线 -->
          <div class="timeline" v-if="ticket.records && ticket.records.length > 0">
            <div
              v-for="(r) in ticket.records"
              :key="r.id"
              class="timeline-item"
            >
              <div class="timeline-dot" :class="r.type">
                <span v-if="r.type === 'create'">+</span>
                <span v-else-if="r.type === 'assign'">→</span>
                <span v-else-if="r.type === 'status'">●</span>
                <span v-else>·</span>
              </div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <span class="timeline-type">
                    <el-tag
                      size="small"
                      :type="r.type === 'create' ? 'success' : (r.type === 'assign' ? 'warning' : (r.type === 'status' ? 'primary' : 'info'))"
                      effect="plain"
                    >
                      {{ r.type === 'create' ? '创建' : (r.type === 'assign' ? '分配' : (r.type === 'status' ? '状态变更' : '备注')) }}
                    </el-tag>
                  </span>
                  <span class="timeline-operator">{{ r.operatorName }}</span>
                  <span class="timeline-time">{{ formatDate(r.createdAt) }}</span>
                </div>
                <div class="timeline-body">
                  <template v-if="r.type === 'status' && r.fromStatusLabel && r.toStatusLabel">
                    <el-tag size="small" :type="statusMap[r.fromStatus]?.type || 'info'" effect="plain">
                      {{ r.fromStatusLabel }}
                    </el-tag>
                    <span class="timeline-arrow">→</span>
                    <el-tag size="small" :type="statusMap[r.toStatus]?.type || 'info'" effect="plain">
                      {{ r.toStatusLabel }}
                    </el-tag>
                  </template>
                  <span v-else>{{ r.content }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="empty-records">
            <el-empty description="暂无跟进记录" :image-size="80" />
          </div>
        </div>
      </div>
    </template>

    <!-- 分配对话框 -->
    <el-dialog
      v-model="assignDialogVisible"
      title="分配处理人"
      width="420px"
      :close-on-click-modal="false"
    >
      <el-form label-width="80px" size="small">
        <el-form-item label="处理人">
          <el-select
            v-model="assigneeId"
            placeholder="请选择处理人"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="a in assigneeOptions"
              :key="a.id"
              :label="a.name"
              :value="a.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignDialogVisible = false" :disabled="assignSaving">取消</el-button>
        <el-button type="primary" @click="handleAssign" :loading="assignSaving">确认分配</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.ticket-detail {
  p { color: $text-regular; }
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;

  .title {
    font-size: 16px;
    font-weight: 600;
    color: $text-primary;
  }

  .loading-title {
    font-size: 16px;
    color: $text-secondary;
  }
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: $text-primary;
}

.loading-section {
  .skeleton-block {
    background: $bg-page;
    border-radius: 4px;
  }
}

.error-section {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

// 操作栏
.action-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

// 跟进记录
.record-input {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid $border-lighter;
}

.record-input-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.timeline {
  position: relative;
  padding-left: 24px;

  &::before {
    content: '';
    position: absolute;
    left: 8px;
    top: 4px;
    bottom: 4px;
    width: 1px;
    background: $border-lighter;
  }
}

.timeline-item {
  position: relative;
  padding-bottom: 20px;

  &:last-child {
    padding-bottom: 0;
  }
}

.timeline-dot {
  position: absolute;
  left: -20px;
  top: 4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
  color: #fff;
  z-index: 1;

  &.create {
    background: $success-color;
  }

  &.assign {
    background: $warning-color;
  }

  &.status {
    background: $brand-color;
  }

  &.note {
    background: $text-secondary;
  }
}

.timeline-content {
  background: $bg-page;
  border-radius: 6px;
  padding: 10px 14px;
}

.timeline-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.timeline-operator {
  font-size: 13px;
  font-weight: 500;
  color: $text-primary;
}

.timeline-time {
  font-size: 12px;
  color: $text-secondary;
  margin-left: auto;
}

.timeline-body {
  font-size: 13px;
  color: $text-regular;
  display: flex;
  align-items: center;
  gap: 6px;
}

.timeline-arrow {
  color: $text-secondary;
  font-weight: bold;
}

.empty-records {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}
</style>
