<script setup>
/**
 * OpportunityListView — 商机列表页
 *
 * 功能：
 * - 统计概览卡片（总数/总额/赢单额/平均概率/逾期数/阶段分布）
 * - 关键词搜索、阶段/负责人/预计关闭日期筛选
 * - 服务端分页表格
 * - 多状态处理
 */
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getOpportunities, getOpportunityStatistics, getOpportunityFilterOptions, createOpportunity, updateOpportunity, deleteOpportunity } from '@/api/opportunity'
import { usePagination } from '@/composables/usePagination'
import { formatDate, formatCurrency, formatPercent, formatNumber } from '@/utils/format'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Refresh,
  InfoFilled,
  Edit,
  Delete,
  Plus,
  Money,
  Coin,
  Aim,
  TrendCharts,
  WarningFilled,
  Collection
} from '@element-plus/icons-vue'
import OpportunityFormDialog from './OpportunityFormDialog.vue'

const userStore = useUserStore()
const router = useRouter()

// ─── 统计概览 ───
const statistics = ref(null)
const statisticsLoading = ref(false)

// ─── 列表数据 ───
const opportunities = ref([])
const loading = ref(false)
const errorMessage = ref('')

// ─── 筛选条件 ───
const filters = reactive({
  keyword: '',
  stage: '',
  ownerId: ''
})
// 日期范围需要单独处理
const expectedCloseRange = ref([])

const filterOptions = ref({
  stages: [],
  owners: []
})
const filterLoading = ref(false)

// ─── 分页 ───
const pagination = usePagination({ pageSize: 10 })

// ─── 缓存 ───
let lastParams = ''

// ─── 弹窗状态 ───
const formVisible = ref(false)
const editingOpportunity = ref(null)
const saving = ref(false)
const deletingId = ref('')

// ─── 阶段映射 ───
const stageMap = {
  lead: { label: '初步接触', type: 'info' },
  qualified: { label: '需求确认', type: 'primary' },
  proposal: { label: '方案报价', type: 'warning' },
  negotiation: { label: '商务谈判', type: 'danger' },
  won: { label: '赢单', type: 'success' },
  lost: { label: '输单', type: 'info' }
}

/**
 * 组装请求参数
 */
function buildParams() {
  const params = {
    page: pagination.page.value,
    pageSize: pagination.pageSize.value
  }
  if (filters.keyword) params.keyword = filters.keyword.trim()
  if (filters.stage) params.stage = filters.stage
  if (filters.ownerId) params.ownerId = filters.ownerId
  if (expectedCloseRange.value && expectedCloseRange.value.length === 2) {
    if (expectedCloseRange.value[0]) params.expectedCloseStart = expectedCloseRange.value[0]
    if (expectedCloseRange.value[1]) params.expectedCloseEnd = expectedCloseRange.value[1]
  }
  return params
}

/**
 * 获取商机列表
 */
async function fetchOpportunities() {
  const params = buildParams()
  const paramsKey = JSON.stringify(params)
  if (paramsKey === lastParams) return
  lastParams = paramsKey

  loading.value = true
  errorMessage.value = ''
  try {
    const res = await getOpportunities(params)
    const data = res.data
    opportunities.value = data.list || []
    pagination.setTotal(data.total || 0)
    if (data.page) pagination.changePage(data.page)
    if (data.pageSize) pagination.pageSize.value = data.pageSize
  } catch (e) {
    errorMessage.value = e.response?.data?.message || e.message || '加载失败'
    opportunities.value = []
    pagination.setTotal(0)
  } finally {
    loading.value = false
  }
}

/**
 * 获取统计概览
 */
async function fetchStatistics() {
  const params = buildParams()
  delete params.page
  delete params.pageSize

  statisticsLoading.value = true
  try {
    const res = await getOpportunityStatistics(params)
    statistics.value = res.data
  } catch {
    statistics.value = null
  } finally {
    statisticsLoading.value = false
  }
}

/**
 * 获取筛选选项
 */
async function fetchFilterOptions() {
  filterLoading.value = true
  try {
    const res = await getOpportunityFilterOptions()
    filterOptions.value = res.data
  } catch {
    // 不影响主体
  } finally {
    filterLoading.value = false
  }
}

/**
 * 搜索&刷新
 */
function handleSearch() {
  pagination.resetPage()
  lastParams = ''
  fetchOpportunities()
  fetchStatistics()
}

/**
 * 重置筛选
 */
function handleReset() {
  filters.keyword = ''
  filters.stage = ''
  filters.ownerId = ''
  expectedCloseRange.value = []
  pagination.resetPage()
  lastParams = ''
  fetchOpportunities()
  fetchStatistics()
}

function handlePageChange(val) {
  pagination.changePage(val)
  lastParams = ''
  fetchOpportunities()
}

function handleSizeChange(val) {
  pagination.changePageSize(val)
  lastParams = ''
  fetchOpportunities()
}

// ──── CRUD ────

function goDetail(row) {
  router.push(`/opportunities/${row.id}`)
}

function handleCreate() {
  editingOpportunity.value = null
  formVisible.value = true
}

function handleEdit(row, event) {
  if (event) event.stopPropagation()
  editingOpportunity.value = { ...row }
  formVisible.value = true
}

async function handleSave(formData) {
  saving.value = true
  try {
    if (editingOpportunity.value) {
      await updateOpportunity(editingOpportunity.value.id, formData)
      ElMessage.success('商机更新成功')
    } else {
      await createOpportunity(formData)
      ElMessage.success('商机创建成功')
    }
    formVisible.value = false
    pagination.resetPage()
    lastParams = ''
    await fetchOpportunities()
    await fetchStatistics()
  } catch (e) {
    const msg = e.response?.data?.message || e.message || '操作失败'
    ElMessage.error(msg)
  } finally {
    saving.value = false
  }
}

async function handleDelete(row, event) {
  if (event) event.stopPropagation()
  try {
    await ElMessageBox.confirm(
      `确定要删除商机「${row.title}」吗？该操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
  } catch {
    return
  }

  deletingId.value = row.id
  try {
    await deleteOpportunity(row.id)
    ElMessage.success('商机已删除')
    if (opportunities.value.length <= 1 && pagination.page.value > 1) {
      pagination.changePage(pagination.page.value - 1)
    }
    lastParams = ''
    await fetchOpportunities()
    await fetchStatistics()
  } catch (e) {
    const msg = e.response?.data?.message || e.message || '删除失败'
    ElMessage.error(msg)
  } finally {
    deletingId.value = ''
  }
}

onMounted(() => {
  fetchOpportunities()
  fetchStatistics()
  fetchFilterOptions()
})
</script>

<template>
  <div class="opportunity-list">
    <!-- 页头 -->
    <div class="page-card">
      <div class="page-card__header">
        <span class="title">商机管理</span>
        <div class="header-actions">
          <el-button
            v-if="userStore.hasPermission('opportunity:create')"
            type="primary"
            :icon="Plus"
            @click="handleCreate"
          >
            新建商机
          </el-button>
          <el-button :icon="Collection" @click="$router.push('/opportunities/board')">
            看板视图
          </el-button>
        </div>
      </div>
    </div>

    <!-- 统计概览 -->
    <div class="page-card" v-if="statistics">
      <div class="page-card__body">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon total">
              <el-icon :size="24"><TrendCharts /></el-icon>
            </div>
            <div class="stat-body">
              <div class="stat-value">{{ formatNumber(statistics.totalCount) }}</div>
              <div class="stat-label">商机总数</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon amount">
              <el-icon :size="24"><Money /></el-icon>
            </div>
            <div class="stat-body">
              <div class="stat-value">{{ formatCurrency(statistics.totalAmount) }}</div>
              <div class="stat-label">商机总额</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon won">
              <el-icon :size="24"><Coin /></el-icon>
            </div>
            <div class="stat-body">
              <div class="stat-value">{{ formatCurrency(statistics.wonAmount) }}</div>
              <div class="stat-label">赢单金额</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon prob">
              <el-icon :size="24"><Aim /></el-icon>
            </div>
            <div class="stat-body">
              <div class="stat-value">{{ formatPercent(statistics.averageProbability) }}</div>
              <div class="stat-label">平均概率</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon overdue">
              <el-icon :size="24"><WarningFilled /></el-icon>
            </div>
            <div class="stat-body">
              <div class="stat-value">{{ statistics.overdueCount }}</div>
              <div class="stat-label">逾期商机</div>
            </div>
          </div>
        </div>

        <!-- 阶段分布 -->
        <div class="stage-bar-wrapper" v-if="statistics.byStage && statistics.byStage.length > 0">
          <div class="stage-bar-title">
            <el-icon><InfoFilled /></el-icon>
            阶段分布
          </div>
          <div class="stage-bar-list">
            <div
              v-for="item in statistics.byStage"
              :key="item.stage"
              class="stage-bar-item"
            >
              <div class="stage-bar-label">{{ item.label }}</div>
              <div class="stage-bar-track">
                <div
                  class="stage-bar-fill"
                  :style="{ width: statistics.totalCount > 0 ? (item.count / statistics.totalCount * 100) + '%' : '0%' }"
                  :class="item.stage"
                />
              </div>
              <div class="stage-bar-count">{{ item.count }}个</div>
              <div class="stage-bar-amount">{{ formatCurrency(item.amount) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选区域 -->
    <div class="page-card">
      <div class="page-card__body">
        <el-form :model="filters" label-width="auto" size="default" @keyup.enter="handleSearch">
          <el-row :gutter="16">
            <!-- 关键词 -->
            <el-col :xs="24" :sm="12" :md="6">
              <el-form-item label="关键词">
                <el-input
                  v-model="filters.keyword"
                  placeholder="商机名称 / 客户名称"
                  clearable
                  :prefix-icon="Search"
                />
              </el-form-item>
            </el-col>

            <!-- 阶段 -->
            <el-col :xs="12" :sm="8" :md="4">
              <el-form-item label="阶段">
                <el-select
                  v-model="filters.stage"
                  placeholder="全部阶段"
                  clearable
                  class="full-width"
                >
                  <el-option
                    v-for="item in filterOptions.stages"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>

            <!-- 负责人 -->
            <el-col :xs="12" :sm="8" :md="4">
              <el-form-item label="负责人">
                <el-select
                  v-model="filters.ownerId"
                  placeholder="全部负责人"
                  clearable
                  :loading="filterLoading"
                  class="full-width"
                >
                  <el-option
                    v-for="item in filterOptions.owners"
                    :key="item.id"
                    :label="item.name"
                    :value="item.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>

            <!-- 预计关闭日期 -->
            <el-col :xs="24" :sm="12" :md="6">
              <el-form-item label="预计关闭日期">
                <el-date-picker
                  v-model="expectedCloseRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                  clearable
                />
              </el-form-item>
            </el-col>

            <!-- 操作按钮 -->
            <el-col :xs="24" :sm="12" :md="4">
              <div class="filter-actions">
                <el-button type="primary" :icon="Search" @click="handleSearch">
                  搜索
                </el-button>
                <el-button :icon="Refresh" @click="handleReset">
                  重置
                </el-button>
              </div>
            </el-col>
          </el-row>
        </el-form>
      </div>
    </div>

    <!-- 列表区域 -->
    <div class="page-card">
      <div class="page-card__body">
        <!-- 加载状态 -->
        <div v-if="loading && opportunities.length === 0" class="loading-placeholder">
          <div class="skeleton-row" v-for="n in 5" :key="n">
            <div class="skeleton-cell" style="width: 25%"><div class="skeleton-bar" /></div>
            <div class="skeleton-cell" style="width: 15%"><div class="skeleton-bar" /></div>
            <div class="skeleton-cell" style="width: 10%"><div class="skeleton-bar" /></div>
            <div class="skeleton-cell" style="width: 10%"><div class="skeleton-bar" /></div>
            <div class="skeleton-cell" style="width: 10%"><div class="skeleton-bar" /></div>
            <div class="skeleton-cell" style="width: 15%"><div class="skeleton-bar" /></div>
          </div>
        </div>

        <!-- 错误状态 -->
        <el-result
          v-else-if="errorMessage"
          icon="error"
          title="加载失败"
          :sub-title="errorMessage"
        >
          <template #extra>
            <el-button type="primary" @click="handleSearch">重新加载</el-button>
          </template>
        </el-result>

        <!-- 空数据 -->
        <el-empty
          v-else-if="!loading && opportunities.length === 0"
          description="暂无匹配的商机数据"
        >
          <el-button type="primary" @click="handleReset">重置筛选</el-button>
        </el-empty>

        <!-- 正常表格 -->
        <template v-else>
          <el-table
            :data="opportunities"
            stripe
            class="opp-table"
            @row-click="goDetail"
          >
            <el-table-column prop="title" label="商机名称" min-width="200" show-overflow-tooltip />
            <el-table-column prop="customerName" label="客户名称" width="140" show-overflow-tooltip />
            <el-table-column label="阶段" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="stageMap[row.stage]?.type || 'info'" size="small">
                  {{ row.stageLabel || stageMap[row.stage]?.label || row.stage }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="金额" width="130" align="right">
              <template #default="{ row }">
                <span class="amount-cell">{{ formatCurrency(row.amount) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="概率" width="70" align="center">
              <template #default="{ row }">
                <span>{{ formatPercent(row.probability) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="预计关闭日期" width="115" align="center">
              <template #default="{ row }">
                <span class="date-cell" :class="{ overdue: row.overdue }">
                  <el-icon v-if="row.overdue" :size="12"><WarningFilled /></el-icon>
                  {{ formatDate(row.expectedCloseDate) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="ownerName" label="负责人" width="80" />
            <el-table-column prop="nextStep" label="下一步" min-width="140" show-overflow-tooltip />
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button
                  v-if="userStore.hasPermission('opportunity:edit')"
                  type="primary"
                  size="small"
                  :icon="Edit"
                  text
                  @click="handleEdit(row, $event)"
                >
                  编辑
                </el-button>
                <el-button
                  v-if="userStore.hasPermission('opportunity:delete')"
                  type="danger"
                  size="small"
                  :icon="Delete"
                  text
                  :loading="deletingId === row.id"
                  @click="handleDelete(row, $event)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="pagination.page.value"
              v-model:page-size="pagination.pageSize.value"
              :page-sizes="[10, 20, 50, 100]"
              :total="pagination.total.value"
              layout="total, sizes, prev, pager, next, jumper"
              background
              @current-change="handlePageChange"
              @size-change="handleSizeChange"
            />
          </div>
        </template>
      </div>
    </div>

    <!-- 商机新增/编辑弹窗 -->
    <OpportunityFormDialog
      v-model="formVisible"
      :opportunity="editingOpportunity"
      :saving="saving"
      @save="handleSave"
    />
  </div>
</template>

<style lang="scss" scoped>
.opportunity-list {
  p { color: $text-regular; }
}

.page-card + .page-card {
  margin-top: 16px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

// ─── 统计概览 ───
.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 20px;

  @media (max-width: 960px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: $bg-white;
  border-radius: 6px;
  border: 1px solid $border-lighter;
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;

  &.total { background: rgba($brand-color, 0.1); color: $brand-color; }
  &.amount { background: rgba($success-color, 0.1); color: $success-color; }
  &.won { background: rgba($success-color, 0.1); color: $success-color; }
  &.prob { background: rgba($warning-color, 0.1); color: $warning-color; }
  &.overdue { background: rgba($danger-color, 0.1); color: $danger-color; }
}

.stat-body {
  .stat-value {
    font-size: 20px;
    font-weight: 700;
    color: $text-primary;
    line-height: 1.2;
  }
  .stat-label {
    font-size: 12px;
    color: $text-secondary;
    margin-top: 2px;
  }
}

// ─── 阶段分布条 ───
.stage-bar-wrapper {
  border-top: 1px solid $border-lighter;
  padding-top: 16px;
}

.stage-bar-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: $text-secondary;
  margin-bottom: 12px;
}

.stage-bar-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stage-bar-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
}

.stage-bar-label {
  width: 60px;
  text-align: right;
  color: $text-regular;
  flex-shrink: 0;
}

.stage-bar-track {
  flex: 1;
  height: 18px;
  background: $border-extra-light;
  border-radius: 9px;
  overflow: hidden;
}

.stage-bar-fill {
  height: 100%;
  border-radius: 9px;
  transition: width 0.4s ease;

  &.lead { background: $info-color; }
  &.qualified { background: $brand-color; }
  &.proposal { background: $warning-color; }
  &.negotiation { background: $danger-color; }
  &.won { background: $success-color; }
  &.lost { background: $border-base; }
}

.stage-bar-count {
  width: 36px;
  text-align: center;
  color: $text-primary;
  font-weight: 500;
  flex-shrink: 0;
}

.stage-bar-amount {
  width: 100px;
  text-align: right;
  color: $text-secondary;
  font-size: 12px;
  flex-shrink: 0;
}

// ─── 筛选 ───
.full-width {
  width: 100%;
}

.filter-actions {
  display: flex;
  gap: 8px;
  height: 100%;
  align-items: flex-start;
  padding-top: 0;
}

// ─── 加载占位 ───
.loading-placeholder {
  min-height: 500px;
  padding: 16px 0;
}

.skeleton-row {
  display: flex;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid $border-lighter;
}

.skeleton-cell {
  padding: 0 4px;
}

.skeleton-bar {
  height: 20px;
  background: linear-gradient(90deg, $border-lighter 25%, #e8e8e8 50%, $border-lighter 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 4px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

// ─── 表格 ───
.opp-table {
  cursor: pointer;
}

.amount-cell {
  font-weight: 500;
  color: $text-primary;
}

.date-cell {
  font-size: 12px;
  color: $text-secondary;

  &.overdue {
    color: $danger-color;
    font-weight: 500;

    .el-icon {
      margin-right: 2px;
      vertical-align: middle;
    }
  }
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding-top: 20px;
}
</style>
