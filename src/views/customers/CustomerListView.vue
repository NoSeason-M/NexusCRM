<script setup>
/**
 * CustomerListView — 客户列表页
 *
 * 功能：
 * - 关键词搜索（名称/联系人/电话/地址）
 * - 多维筛选（行业/级别/状态/负责人）
 * - 分页查询
 * - 新增/编辑/删除客户
 */
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getCustomers, getCustomerFilterOptions, createCustomer, updateCustomer, deleteCustomer } from '@/api/customer'
import { usePagination } from '@/composables/usePagination'
import { formatDate } from '@/utils/format'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Refresh,
  Plus,
  Edit,
  Delete
} from '@element-plus/icons-vue'
import CustomerFormDialog from './CustomerFormDialog.vue'

const userStore = useUserStore()
const router = useRouter()

// ─── 列表数据 ───
const customers = ref([])
const loading = ref(false)
const errorMessage = ref('')

// ─── 筛选条件 ───
const filters = reactive({
  keyword: '',
  industry: '',
  level: '',
  status: '',
  ownerId: ''
})

const filterOptions = ref({
  industries: [],
  levels: [],
  statuses: [],
  owners: []
})
const filterLoading = ref(false)

// ─── 分页 ───
const pagination = usePagination({ pageSize: 10 })

// ─── 缓存上次有效搜索参数（避免重复请求） ───
let lastParams = ''

// ─── 弹窗状态 ───
const editorVisible = ref(false)
const editingCustomer = ref(null)
const saving = ref(false)

// ─── 删除状态 ───
const deletingId = ref('')

/**
 * 组装请求参数
 */
function buildParams() {
  const params = {
    page: pagination.page.value,
    pageSize: pagination.pageSize.value
  }
  if (filters.keyword) params.keyword = filters.keyword.trim()
  if (filters.industry) params.industry = filters.industry
  if (filters.level) params.level = filters.level
  if (filters.status) params.status = filters.status
  if (filters.ownerId) params.ownerId = filters.ownerId
  return params
}

/**
 * 获取客户列表
 */
async function fetchCustomers() {
  const params = buildParams()
  const paramsKey = JSON.stringify(params)
  if (paramsKey === lastParams) return
  lastParams = paramsKey

  loading.value = true
  errorMessage.value = ''
  try {
    const res = await getCustomers(params)
    const data = res.data
    customers.value = data.list || []
    pagination.setTotal(data.total || 0)
    if (data.page) pagination.changePage(data.page)
    if (data.pageSize) pagination.pageSize.value = data.pageSize
  } catch (e) {
    errorMessage.value = e.response?.data?.message || e.message || '加载失败'
    customers.value = []
    pagination.setTotal(0)
  } finally {
    loading.value = false
  }
}

/**
 * 获取筛选选项
 */
async function fetchFilterOptions() {
  filterLoading.value = true
  try {
    const res = await getCustomerFilterOptions()
    filterOptions.value = res.data
  } catch {
    // 加载筛选选项失败不影响页面主体
  } finally {
    filterLoading.value = false
  }
}

/**
 * 搜索（点搜索按钮或回车触发）
 */
function handleSearch() {
  pagination.resetPage()
  lastParams = ''
  fetchCustomers()
}

/**
 * 重置筛选
 */
function handleReset() {
  filters.keyword = ''
  filters.industry = ''
  filters.level = ''
  filters.status = ''
  filters.ownerId = ''
  pagination.resetPage()
  lastParams = ''
  fetchCustomers()
}

/**
 * 分页变更
 */
function handlePageChange(val) {
  pagination.changePage(val)
  lastParams = ''
  fetchCustomers()
}

function handleSizeChange(val) {
  pagination.changePageSize(val)
  lastParams = ''
  fetchCustomers()
}

// ──── CRUD 操作 ────

/** 打开新建弹窗 */
function handleCreate() {
  editingCustomer.value = null
  editorVisible.value = true
}

/** 打开编辑弹窗（阻止行点击事件冒泡） */
function handleEdit(row, event) {
  if (event) event.stopPropagation()
  editingCustomer.value = { ...row }
  editorVisible.value = true
}

/** 跳转到客户详情页 */
function goDetail(row) {
  router.push(`/customers/${row.id}`)
}

/** 保存（新建/编辑） */
async function handleSave(formData) {
  saving.value = true
  try {
    if (editingCustomer.value) {
      // 编辑
      await updateCustomer(editingCustomer.value.id, formData)
      ElMessage.success('客户更新成功')
    } else {
      // 新建
      await createCustomer(formData)
      ElMessage.success('客户创建成功')
    }
    editorVisible.value = false
    // 刷新列表并回到第一页
    pagination.resetPage()
    lastParams = ''
    await fetchCustomers()
  } catch (e) {
    const msg = e.response?.data?.message || e.message || '操作失败'
    ElMessage.error(msg)
  } finally {
    saving.value = false
  }
}

/** 删除客户（确认弹窗） */
async function handleDelete(row, event) {
  if (event) event.stopPropagation()
  try {
    await ElMessageBox.confirm(
      `确定要删除客户「${row.name}」吗？该操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
  } catch {
    // 用户取消删除
    return
  }

  deletingId.value = row.id
  try {
    await deleteCustomer(row.id)
    ElMessage.success('客户已删除')
    // 如果当前页只剩最后一条且不是第一页，则回退一页
    if (customers.value.length <= 1 && pagination.page.value > 1) {
      pagination.changePage(pagination.page.value - 1)
    }
    lastParams = ''
    await fetchCustomers()
  } catch (e) {
    const msg = e.response?.data?.message || e.message || '删除失败'
    ElMessage.error(msg)
  } finally {
    deletingId.value = ''
  }
}

// ─── 状态/级别映射 ───
const statusMap = {
  active: { label: '活跃', type: 'success' },
  potential: { label: '潜在', type: 'primary' },
  inactive: { label: '已流失', type: 'info' },
  at_risk: { label: '风险', type: 'danger' },
  lead: { label: '线索', type: 'warning' }
}

const levelMap = {
  platinum: { label: '铂金', type: 'danger' },
  gold: { label: '黄金', type: 'warning' },
  silver: { label: '白银', type: '' },
  regular: { label: '普通', type: 'info' }
}

onMounted(() => {
  fetchCustomers()
  fetchFilterOptions()
})
</script>

<template>
  <div class="customer-list">
    <!-- 页头：标题 + 操作按钮 -->
    <div class="page-card">
      <div class="page-card__header">
        <span class="title">客户管理</span>
        <div class="header-actions">
          <el-button
            v-if="userStore.hasPermission('customer:create')"
            type="primary"
            :icon="Plus"
            @click="handleCreate"
          >
            新建客户
          </el-button>
        </div>
      </div>
    </div>

    <!-- 筛选区域 -->
    <div class="page-card">
      <div class="page-card__body">
        <el-form :model="filters" label-width="auto" size="default" @keyup.enter="handleSearch">
          <el-row :gutter="16">
            <!-- 关键词搜索 -->
            <el-col :xs="24" :sm="12" :md="6">
              <el-form-item label="关键词">
                <el-input
                  v-model="filters.keyword"
                  placeholder="名称 / 联系人 / 电话 / 地址"
                  clearable
                  :prefix-icon="Search"
                />
              </el-form-item>
            </el-col>

            <!-- 行业筛选 -->
            <el-col :xs="12" :sm="8" :md="4">
              <el-form-item label="行业">
                <el-select
                  v-model="filters.industry"
                  placeholder="全部行业"
                  clearable
                  :loading="filterLoading"
                  class="full-width"
                >
                  <el-option
                    v-for="item in filterOptions.industries"
                    :key="item"
                    :label="item"
                    :value="item"
                  />
                </el-select>
              </el-form-item>
            </el-col>

            <!-- 客户级别 -->
            <el-col :xs="12" :sm="8" :md="4">
              <el-form-item label="级别">
                <el-select
                  v-model="filters.level"
                  placeholder="全部级别"
                  clearable
                  class="full-width"
                >
                  <el-option label="铂金" value="platinum" />
                  <el-option label="黄金" value="gold" />
                  <el-option label="白银" value="silver" />
                  <el-option label="普通" value="regular" />
                </el-select>
              </el-form-item>
            </el-col>

            <!-- 客户状态 -->
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

            <!-- 操作按钮 -->
            <el-col :xs="24" :sm="12" :md="2">
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
        <!-- 加载状态：700px 骨架占位 -->
        <div v-if="loading && customers.length === 0" class="loading-placeholder">
          <div class="skeleton-row" v-for="n in 5" :key="n">
            <div class="skeleton-cell" style="width: 20%"><div class="skeleton-bar" /></div>
            <div class="skeleton-cell" style="width: 15%"><div class="skeleton-bar" /></div>
            <div class="skeleton-cell" style="width: 10%"><div class="skeleton-bar" /></div>
            <div class="skeleton-cell" style="width: 10%"><div class="skeleton-bar" /></div>
            <div class="skeleton-cell" style="width: 15%"><div class="skeleton-bar" /></div>
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

        <!-- 空数据状态 -->
        <el-empty
          v-else-if="!loading && customers.length === 0"
          description="暂无匹配的客户数据"
        >
          <el-button type="primary" @click="handleReset">重置筛选</el-button>
        </el-empty>

        <!-- 正常表格 -->
        <template v-else>
          <el-table
            :data="customers"
            stripe
            highlight-current-row
            class="customer-table"
            @row-click="goDetail"
          >
            <el-table-column prop="name" label="客户名称" min-width="140" show-overflow-tooltip />
            <el-table-column prop="industry" label="行业" width="110" />
            <el-table-column prop="contactName" label="联系人" width="100" />
            <el-table-column prop="contactPhone" label="联系电话" width="130" />
            <el-table-column label="级别" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="levelMap[row.level]?.type || 'info'" size="small" effect="plain">
                  {{ levelMap[row.level]?.label || row.level }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="statusMap[row.status]?.type || 'info'" size="small">
                  {{ statusMap[row.status]?.label || row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="province" label="省份" width="90" />
            <el-table-column prop="ownerName" label="负责人" width="90" />
            <el-table-column prop="source" label="来源" width="100" />
            <el-table-column label="最后跟进" width="110" align="center">
              <template #default="{ row }">
                <span class="date-cell">{{ formatDate(row.lastFollowAt) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button
                  v-if="userStore.hasPermission('customer:edit') || (userStore.role === 'sales' && row.ownerId === userStore.user?.id)"
                  type="primary"
                  size="small"
                  :icon="Edit"
                  text
                  @click="handleEdit(row, $event)"
                >
                  编辑
                </el-button>
                <el-button
                  v-if="userStore.hasPermission('customer:delete')"
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

    <!-- 客户新增/编辑弹窗 -->
    <CustomerFormDialog
      v-model="editorVisible"
      :customer="editingCustomer"
      :options="filterOptions"
      :saving="saving"
      @save="handleSave"
    />
  </div>
</template>

<style lang="scss" scoped>
.customer-list {
  // 确保内部 p 标签不受全局影响
  p { color: $text-regular; }
}

.page-card + .page-card {
  margin-top: 16px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

// 筛选表单
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

// 骨架屏加载占位
.loading-placeholder {
  min-height: 700px;
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

// 客户表格
.customer-table {
  cursor: pointer;
}

.date-cell {
  font-size: 12px;
  color: $text-secondary;
}

// 分页
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding-top: 20px;
}
</style>
