<script setup>
/**
 * ContractListView — 合同列表页
 *
 * 功能：
 * - 统计概览卡片（总数/总额/已签署额/待审批/即将到期/已过期）
 * - 关键词搜索、状态/客户/负责人/到期状态/结束日期筛选
 * - 服务端分页表格
 * - 多状态处理
 */
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getContracts, getContractStatistics, getContractOptions, getExpiringContracts, createContract, updateContract, deleteContract } from '@/api/contract'
import { usePagination } from '@/composables/usePagination'
import { formatDate, formatCurrency, formatNumber } from '@/utils/format'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Refresh,
  InfoFilled,
  Document,
  Money,
  Coin,
  WarningFilled,
  Clock,
  Plus,
  Edit,
  Delete
} from '@element-plus/icons-vue'
import ContractFormDialog from './components/ContractFormDialog.vue'

const userStore = useUserStore()
const router = useRouter()

// ─── 统计概览 ───
const statistics = ref(null)
const statisticsLoading = ref(false)

// ─── 到期合同 ───
const expiringContracts = ref([])

// ─── 列表数据 ───
const contracts = ref([])
const loading = ref(false)
const errorMessage = ref('')

// ─── 筛选条件 ───
const filters = reactive({
  keyword: '',
  status: '',
  customerId: '',
  ownerId: '',
  expiryStatus: ''
})
const endDateRange = ref([])

const filterOptions = ref({
  statuses: [],
  customers: [],
  owners: []
})
const filterLoading = ref(false)

// ─── 分页 ───
const pagination = usePagination({ pageSize: 10 })

// ─── 缓存 ───
let lastParams = ''

// ─── 阶段映射 ───
const expiryStatusMap = {
  normal: { label: '正常', type: 'success' },
  expiring: { label: '即将到期', type: 'warning' },
  expired: { label: '已过期', type: 'danger' }
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
  if (filters.status) params.status = filters.status
  if (filters.customerId) params.customerId = filters.customerId
  if (filters.ownerId) params.ownerId = filters.ownerId
  if (filters.expiryStatus) params.expiryStatus = filters.expiryStatus
  if (endDateRange.value && endDateRange.value.length === 2) {
    if (endDateRange.value[0]) params.endDateStart = endDateRange.value[0]
    if (endDateRange.value[1]) params.endDateEnd = endDateRange.value[1]
  }
  return params
}

/**
 * 获取合同列表
 */
async function fetchContracts() {
  const params = buildParams()
  const paramsKey = JSON.stringify(params)
  if (paramsKey === lastParams) return
  lastParams = paramsKey

  loading.value = true
  errorMessage.value = ''
  try {
    const res = await getContracts(params)
    const data = res.data
    contracts.value = data.list || []
    pagination.setTotal(data.total || 0)
    if (data.page) pagination.changePage(data.page)
    if (data.pageSize) pagination.pageSize.value = data.pageSize
  } catch (e) {
    errorMessage.value = e.response?.data?.message || e.message || '加载失败'
    contracts.value = []
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
    const res = await getContractStatistics(params)
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
    const res = await getContractOptions()
    filterOptions.value = res.data
  } catch {
    // 不影响主体
  } finally {
    filterLoading.value = false
  }
}

/**
 * 获取到期合同提醒
 */
async function fetchExpiring() {
  try {
    const res = await getExpiringContracts({ days: 30, limit: 5 })
    expiringContracts.value = res.data || []
  } catch {
    expiringContracts.value = []
  }
}

/**
 * 搜索&刷新
 */
function handleSearch() {
  pagination.resetPage()
  lastParams = ''
  fetchContracts()
  fetchStatistics()
}

/**
 * 重置筛选
 */
function handleReset() {
  filters.keyword = ''
  filters.status = ''
  filters.customerId = ''
  filters.ownerId = ''
  filters.expiryStatus = ''
  endDateRange.value = []
  pagination.resetPage()
  lastParams = ''
  fetchContracts()
  fetchStatistics()
}

function handlePageChange(val) {
  pagination.changePage(val)
  lastParams = ''
  fetchContracts()
}

function handleSizeChange(val) {
  pagination.changePageSize(val)
  lastParams = ''
  fetchContracts()
}

// ──── CRUD ────
const formVisible = ref(false)
const editingContract = ref(null)
const saving = ref(false)
const deletingId = ref('')

function goDetail(row) {
  router.push(`/contracts/${row.id}`)
}

function handleCreate() {
  editingContract.value = null
  formVisible.value = true
}

function handleEdit(row, event) {
  if (event) event.stopPropagation()
  editingContract.value = { ...row }
  formVisible.value = true
}

async function handleSave(formData) {
  saving.value = true
  try {
    if (editingContract.value) {
      await updateContract(editingContract.value.id, formData)
      ElMessage.success('合同更新成功')
    } else {
      await createContract(formData)
      ElMessage.success('合同创建成功')
    }
    formVisible.value = false
    pagination.resetPage()
    lastParams = ''
    await fetchContracts()
    await fetchStatistics()
    await fetchExpiring()
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
      `确定要删除合同「${row.name}」吗？该操作不可恢复。`,
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
    await deleteContract(row.id)
    ElMessage.success('合同已删除')
    if (contracts.value.length <= 1 && pagination.page.value > 1) {
      pagination.changePage(pagination.page.value - 1)
    }
    lastParams = ''
    await fetchContracts()
    await fetchStatistics()
    await fetchExpiring()
  } catch (e) {
    const msg = e.response?.data?.message || e.message || '删除失败'
    ElMessage.error(msg)
  } finally {
    deletingId.value = ''
  }
}

onMounted(() => {
  fetchContracts()
  fetchStatistics()
  fetchFilterOptions()
  fetchExpiring()
})
</script>

<template>
  <div class="contract-list">
    <!-- 页头 -->
    <div class="page-card">
      <div class="page-card__header">
        <span class="title">合同管理</span>
        <div class="header-actions">
          <el-button
            v-if="userStore.hasPermission('contract:create')"
            type="primary"
            :icon="Plus"
            @click="handleCreate"
          >
            新建合同
          </el-button>
        </div>
      </div>
    </div>

    <!-- 到期提醒 -->
    <div class="page-card" v-if="expiringContracts.length > 0">
      <div class="page-card__body">
        <div class="expiring-header">
          <el-icon :size="18" color="#e6a23c"><Clock /></el-icon>
          <span class="expiring-title">到期提醒</span>
          <span class="expiring-count">近期有 {{ expiringContracts.length }} 份合同即将到期或已过期</span>
        </div>
        <div class="expiring-list">
          <div
            v-for="c in expiringContracts"
            :key="c.id"
            class="expiring-item"
            :class="{ expired: c.expiryStatus === 'expired' }"
          >
            <span class="expiring-name">{{ c.name }}</span>
            <span class="expiring-customer">{{ c.customerName }}</span>
            <span class="expiring-date">{{ formatDate(c.endDate) }}</span>
            <el-tag
              :type="c.expiryStatus === 'expired' ? 'danger' : 'warning'"
              size="small"
            >
              {{ c.expiryStatus === 'expired' ? '已过期' + Math.abs(c.daysRemaining) + '天' : '剩' + c.daysRemaining + '天' }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- 统计概览 -->
    <div class="page-card" v-if="statistics">
      <div class="page-card__body">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon total">
              <el-icon :size="24"><Document /></el-icon>
            </div>
            <div class="stat-body">
              <div class="stat-value">{{ formatNumber(statistics.totalCount) }}</div>
              <div class="stat-label">合同总数</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon amount">
              <el-icon :size="24"><Money /></el-icon>
            </div>
            <div class="stat-body">
              <div class="stat-value">{{ formatCurrency(statistics.totalAmount) }}</div>
              <div class="stat-label">合同总额</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon signed">
              <el-icon :size="24"><Coin /></el-icon>
            </div>
            <div class="stat-body">
              <div class="stat-value">{{ formatCurrency(statistics.signedAmount) }}</div>
              <div class="stat-label">已签署金额</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon pending">
              <el-icon :size="24"><InfoFilled /></el-icon>
            </div>
            <div class="stat-body">
              <div class="stat-value">{{ statistics.approvalPendingCount }}</div>
              <div class="stat-label">待审批</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon expiring">
              <el-icon :size="24"><WarningFilled /></el-icon>
            </div>
            <div class="stat-body">
              <div class="stat-value">{{ statistics.expiringCount }}</div>
              <div class="stat-label">即将到期</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon expired">
              <el-icon :size="24"><WarningFilled /></el-icon>
            </div>
            <div class="stat-body">
              <div class="stat-value">{{ statistics.expiredCount }}</div>
              <div class="stat-label">已过期</div>
            </div>
          </div>
        </div>

        <!-- 状态分布 -->
        <div class="status-bar-wrapper" v-if="statistics.byStatus && statistics.byStatus.length > 0">
          <div class="status-bar-title">
            <el-icon><InfoFilled /></el-icon>
            状态分布
          </div>
          <div class="status-bar-list">
            <div
              v-for="item in statistics.byStatus"
              :key="item.status"
              class="status-bar-item"
            >
              <div class="status-bar-label">{{ item.label }}</div>
              <div class="status-bar-track">
                <div
                  class="status-bar-fill"
                  :style="{ width: statistics.totalCount > 0 ? (item.count / statistics.totalCount * 100) + '%' : '0%' }"
                  :class="item.status"
                />
              </div>
              <div class="status-bar-count">{{ item.count }}个</div>
              <div class="status-bar-amount">{{ formatCurrency(item.amount) }}</div>
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
                  placeholder="合同名称 / 编号 / 客户"
                  clearable
                  :prefix-icon="Search"
                />
              </el-form-item>
            </el-col>

            <!-- 状态 -->
            <el-col :xs="12" :sm="8" :md="4">
              <el-form-item label="状态">
                <el-select
                  v-model="filters.status"
                  placeholder="全部状态"
                  clearable
                  class="full-width"
                >
                  <el-option
                    v-for="item in filterOptions.statuses"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>

            <!-- 客户 -->
            <el-col :xs="12" :sm="8" :md="4">
              <el-form-item label="客户">
                <el-select
                  v-model="filters.customerId"
                  placeholder="全部客户"
                  clearable
                  :loading="filterLoading"
                  class="full-width"
                >
                  <el-option
                    v-for="item in filterOptions.customers"
                    :key="item.id"
                    :label="item.name"
                    :value="item.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>

            <!-- 负责人 -->
            <el-col :xs="12" :sm="8" :md="3">
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

            <!-- 到期状态 -->
            <el-col :xs="12" :sm="8" :md="3">
              <el-form-item label="到期状态">
                <el-select
                  v-model="filters.expiryStatus"
                  placeholder="全部"
                  clearable
                  class="full-width"
                >
                  <el-option label="正常" value="normal" />
                  <el-option label="即将到期" value="expiring" />
                  <el-option label="已过期" value="expired" />
                </el-select>
              </el-form-item>
            </el-col>

            <!-- 结束日期 -->
            <el-col :xs="24" :sm="12" :md="6">
              <el-form-item label="结束日期">
                <el-date-picker
                  v-model="endDateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始"
                  end-placeholder="结束"
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
        <div v-if="loading && contracts.length === 0" class="loading-placeholder">
          <div class="skeleton-row" v-for="n in 5" :key="n">
            <div class="skeleton-cell" style="width: 20%"><div class="skeleton-bar" /></div>
            <div class="skeleton-cell" style="width: 12%"><div class="skeleton-bar" /></div>
            <div class="skeleton-cell" style="width: 10%"><div class="skeleton-bar" /></div>
            <div class="skeleton-cell" style="width: 10%"><div class="skeleton-bar" /></div>
            <div class="skeleton-cell" style="width: 12%"><div class="skeleton-bar" /></div>
            <div class="skeleton-cell" style="width: 8%"><div class="skeleton-bar" /></div>
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
          v-else-if="!loading && contracts.length === 0"
          description="暂无匹配的合同数据"
        >
          <el-button type="primary" @click="handleReset">重置筛选</el-button>
        </el-empty>

        <!-- 正常表格 -->
        <template v-else>
          <el-table
            :data="contracts"
            stripe
            class="contract-table"
            @row-click="goDetail"
          >
            <el-table-column prop="contractNo" label="合同编号" width="140" />
            <el-table-column prop="name" label="合同名称" min-width="200" show-overflow-tooltip />
            <el-table-column prop="customerName" label="客户" width="130" show-overflow-tooltip />
            <el-table-column label="状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="row.statusType || 'info'" size="small">
                  {{ row.statusLabel }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="金额" width="130" align="right">
              <template #default="{ row }">
                <span class="amount-cell">{{ formatCurrency(row.amount) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="到期状态" width="110" align="center">
              <template #default="{ row }">
                <el-tag
                  :type="expiryStatusMap[row.expiryStatus]?.type || 'info'"
                  size="small"
                  effect="plain"
                >
                  <template v-if="row.expiryStatus === 'expired'">
                    已过期{{ Math.abs(row.daysRemaining) }}天
                  </template>
                  <template v-else-if="row.expiryStatus === 'expiring'">
                    剩{{ row.daysRemaining }}天
                  </template>
                  <template v-else>
                    正常
                  </template>
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="结束日期" width="105" align="center">
              <template #default="{ row }">
                <span :class="{ 'date-expired': row.expiryStatus === 'expired', 'date-expiring': row.expiryStatus === 'expiring' }">
                  {{ formatDate(row.endDate) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="ownerName" label="负责人" width="80" />
            <el-table-column label="附件" width="60" align="center">
              <template #default="{ row }">
                <span v-if="row.attachmentCount > 0">{{ row.attachmentCount }}</span>
                <span v-else class="no-attach">-</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button
                  v-if="userStore.hasPermission('contract:edit')"
                  type="primary"
                  size="small"
                  :icon="Edit"
                  text
                  @click="handleEdit(row, $event)"
                >
                  编辑
                </el-button>
                <el-button
                  v-if="userStore.hasPermission('contract:delete')"
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

    <!-- 合同新增/编辑弹窗 -->
    <ContractFormDialog
      v-model="formVisible"
      :contract="editingContract"
      :saving="saving"
      @save="handleSave"
    />
  </div>
</template>

<style lang="scss" scoped>
.contract-list {
  p { color: $text-regular; }
}

.page-card + .page-card {
  margin-top: 16px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

// ─── 到期提醒 ───
.expiring-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.expiring-title {
  font-size: 14px;
  font-weight: 600;
  color: $text-primary;
}

.expiring-count {
  font-size: 12px;
  color: $text-secondary;
}

.expiring-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.expiring-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 8px;
  background: $bg-white;
  border-radius: 4px;
  font-size: 13px;

  &.expired {
    background: rgba($danger-color, 0.04);
  }
}

.expiring-name {
  font-weight: 500;
  color: $text-primary;
  min-width: 180px;
}

.expiring-customer {
  color: $text-regular;
  min-width: 100px;
}

.expiring-date {
  color: $text-secondary;
  min-width: 100px;
}

// ─── 统计概览 ───
.stats-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  margin-bottom: 20px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
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
  &.signed { background: rgba($success-color, 0.1); color: $success-color; }
  &.pending { background: rgba($warning-color, 0.1); color: $warning-color; }
  &.expiring { background: rgba($warning-color, 0.1); color: $warning-color; }
  &.expired { background: rgba($danger-color, 0.1); color: $danger-color; }
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

// ─── 状态分布条 ───
.status-bar-wrapper {
  border-top: 1px solid $border-lighter;
  padding-top: 16px;
}

.status-bar-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: $text-secondary;
  margin-bottom: 12px;
}

.status-bar-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-bar-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
}

.status-bar-label {
  width: 60px;
  text-align: right;
  color: $text-regular;
  flex-shrink: 0;
}

.status-bar-track {
  flex: 1;
  height: 18px;
  background: $border-extra-light;
  border-radius: 9px;
  overflow: hidden;
}

.status-bar-fill {
  height: 100%;
  border-radius: 9px;
  transition: width 0.4s ease;

  &.draft { background: $info-color; }
  &.approving { background: $warning-color; }
  &.approved { background: $brand-color; }
  &.rejected { background: $danger-color; }
  &.signed { background: $success-color; }
  &.archived { background: $border-base; }
}

.status-bar-count {
  width: 36px;
  text-align: center;
  color: $text-primary;
  font-weight: 500;
  flex-shrink: 0;
}

.status-bar-amount {
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
.contract-table {
  cursor: pointer;
}

.amount-cell {
  font-weight: 500;
  color: $text-primary;
}

.date-expired {
  color: $danger-color;
  font-weight: 500;
}

.date-expiring {
  color: $warning-color;
  font-weight: 500;
}

.no-attach {
  color: $text-placeholder;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding-top: 20px;
}
</style>
