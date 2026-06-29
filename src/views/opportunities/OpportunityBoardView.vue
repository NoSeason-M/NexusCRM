<script setup>
/**
 * OpportunityBoardView — 销售阶段看板
 *
 * 看板模式下按阶段分为 6 列（lead→lost），每列展示该阶段的商机卡片。
 * 支持：
 * - 拖拽式阶段流转（点击卡片上的阶段按钮）
 * - 点击卡片打开详情
 * - 列表/看板双视图切换
 * - 多状态（加载/空/错误）
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getOpportunityBoard, updateOpportunityStage } from '@/api/opportunity'
import { useUserStore } from '@/stores/user'
import { formatCurrency, formatNumber } from '@/utils/format'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Refresh,
  Collection,
  List
} from '@element-plus/icons-vue'
import OpportunityCard from './components/OpportunityCard.vue'

const router = useRouter()
const userStore = useUserStore()

// ─── 数据状态 ───
const boardData = ref([])
const loading = ref(false)
const errorMessage = ref('')
const stageLoading = ref(false)

// ─── 阶段映射（纯 UI 样式） ───
const stageStyles = {
  lead: { color: '#909399' },
  qualified: { color: '#409eff' },
  proposal: { color: '#e6a23c' },
  negotiation: { color: '#f56c6c' },
  won: { color: '#67c23a' },
  lost: { color: '#909399' }
}

const canChangeStage = userStore.hasPermission('opportunity:stage')

/**
 * 加载看板数据
 */
async function fetchBoard() {
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await getOpportunityBoard()
    boardData.value = res.data || []
  } catch (e) {
    errorMessage.value = e.response?.data?.message || e.message || '加载失败'
    boardData.value = []
  } finally {
    loading.value = false
  }
}

/**
 * 点击卡片 → 跳转到商机详情
 */
function handleOpenCard(id) {
  if (!id) return
  router.push(`/opportunities/${id}`)
}

/**
 * 卡片阶段流转
 */
async function handleChangeStage(opportunity) {
  if (!opportunity || !canChangeStage) return

  const stage = opportunity.stage
  let toStage = ''
  let confirmMsg = ''
  let confirmType = ''

  switch (stage) {
    case 'lead':
      toStage = 'qualified'
      break
    case 'qualified':
      toStage = 'proposal'
      break
    case 'proposal':
      toStage = 'negotiation'
      break
    case 'negotiation':
      // 需要用户选择赢单/输单
      try {
        await ElMessageBox.confirm(
          '确定将商机标记为「赢单」吗？',
          '阶段流转确认',
          {
            confirmButtonText: '赢单',
            cancelButtonText: '输单',
            distinguishCancelAndClose: true,
            type: 'success',
            confirmButtonClass: 'el-button--success'
          }
        )
        toStage = 'won'
      } catch (action) {
        // 区分取消和关闭
        if (action === 'cancel') {
          // 点击"输单"按钮
          try {
            await ElMessageBox.confirm(
              `确定将商机「${opportunity.title}」标记为输单吗？`,
              '阶段流转确认',
              {
                confirmButtonText: '确定输单',
                cancelButtonText: '取消',
                type: 'warning',
                confirmButtonClass: 'el-button--danger'
              }
            )
            toStage = 'lost'
          } catch {
            return
          }
        } else {
          return
        }
      }
      break
    default:
      return
  }

  if (!toStage) return

  stageLoading.value = true
  try {
    await updateOpportunityStage(opportunity.id, { toStage })
    ElMessage.success('阶段流转成功')
    await fetchBoard()
  } catch (e) {
    const msg = e.response?.data?.message || e.message || '流转失败'
    ElMessage.error(msg)
  } finally {
    stageLoading.value = false
  }
}

onMounted(() => {
  fetchBoard()
})
</script>

<template>
  <div class="board-page">
    <!-- 页头 -->
    <div class="page-card">
      <div class="page-card__header">
        <div class="header-left">
          <span class="title">销售阶段看板</span>
          <span class="title-subtitle">按阶段查看所有商机</span>
        </div>
        <div class="header-actions">
          <el-button :icon="Refresh" @click="fetchBoard" :loading="loading">
            刷新
          </el-button>
          <el-button type="primary" :icon="List" @click="router.push('/opportunities')">
            列表视图
          </el-button>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading && boardData.length === 0" class="loading-section">
      <div class="page-card">
        <div class="skeleton-board">
          <div class="skeleton-column" v-for="n in 6" :key="n">
            <div class="skeleton-header" />
            <div class="skeleton-card" v-for="m in 3" :key="m" />
          </div>
        </div>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="errorMessage" class="page-card">
      <div class="error-section">
        <el-result icon="error" title="加载失败" :sub-title="errorMessage">
          <template #extra>
            <el-button type="primary" @click="fetchBoard">重新加载</el-button>
          </template>
        </el-result>
      </div>
    </div>

    <!-- 空数据 -->
    <div v-else-if="!loading && boardData.length === 0" class="page-card">
      <el-empty description="暂无商机数据" />
    </div>

    <!-- 看板本体 -->
    <div v-else class="board-container">
      <div
        v-for="column in boardData"
        :key="column.stage"
        class="board-column"
      >
        <!-- 列头 -->
        <div class="column-header">
          <div class="column-title">
            <span
              class="stage-dot"
              :style="{ background: stageStyles[column.stage]?.color || '#909399' }"
            />
            <span class="stage-label">{{ column.label }}</span>
            <el-tag size="small" round>{{ column.count }}</el-tag>
          </div>
          <div class="column-amount">{{ formatCurrency(column.amount) }}</div>
        </div>

        <!-- 卡片列表 -->
        <div class="column-body">
          <template v-if="column.opportunities && column.opportunities.length > 0">
            <OpportunityCard
              v-for="opp in column.opportunities"
              :key="opp.id"
              :opportunity="opp"
              :can-change-stage="canChangeStage"
              @open="handleOpenCard"
              @change-stage="handleChangeStage"
            />
          </template>
          <div v-else class="column-empty">
            <span>暂无商机</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.board-page {
  p { color: $text-regular; }
}

.page-card + .page-card {
  margin-top: 16px;
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 12px;

  .title {
    font-size: 18px;
    font-weight: 600;
    color: $text-primary;
  }

  .title-subtitle {
    font-size: 13px;
    color: $text-secondary;
  }
}

.header-actions {
  display: flex;
  gap: 8px;
}

// ─── 加载骨架 ───
.skeleton-board {
  display: flex;
  gap: 16px;
  overflow: hidden;
  min-height: 500px;
}

.skeleton-column {
  flex: 1;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-header {
  height: 48px;
  background: linear-gradient(90deg, $border-lighter 25%, #e8e8e8 50%, $border-lighter 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 6px;
}

.skeleton-card {
  height: 140px;
  background: linear-gradient(90deg, $border-lighter 25%, #e8e8e8 50%, $border-lighter 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 8px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

// ─── 看板容器 ───
.board-container {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 8px;
  min-height: 500px;
  align-items: flex-start;
}

.board-column {
  flex: 1;
  min-width: 260px;
  max-width: 320px;
  background: $bg-page;
  border: 1px solid $border-lighter;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 240px);
}

// ─── 列头 ───
.column-header {
  padding: 12px 14px;
  border-bottom: 1px solid $border-lighter;
  flex-shrink: 0;
}

.column-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.stage-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.stage-label {
  font-size: 14px;
  font-weight: 600;
  color: $text-primary;
  flex: 1;
}

.column-amount {
  font-size: 13px;
  font-weight: 500;
  color: $text-regular;
  padding-left: 16px;
}

// ─── 列体 ───
.column-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.column-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100px;
  color: $text-placeholder;
  font-size: 13px;
}
</style>
