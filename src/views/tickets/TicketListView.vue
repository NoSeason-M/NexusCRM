<script setup>
/**
 * TicketListView — 工单列表页
 *
 * 功能：
 * - 关键词搜索（标题/编号/客户名称）
 * - 多维筛选（工单类型、状态、优先级、负责人、客户、创建日期范围）
 * - 分页表格（编号、标题、客户、类型、优先级标签、状态标签、负责人、创建时间、操作）
 * - 行点击跳转详情
 * - 多状态处理：loading / error / empty / normal
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getTickets, getTicketOptions, createTicket } from '@/api/ticket'
import { useUserStore } from '@/stores/user'
import { formatDate } from '@/utils/format'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import TicketFormDialog from './components/TicketFormDialog.vue'

const router = useRouter()
const userStore = useUserStore()

// 筛选选项
const options = ref({ statuses: [], priorities: [], issueTypes: [], customers: [], assignees: [] })
const optionsLoading = ref(false)

// 创建工单
const formDialogVisible = ref(false)
const formSaving = ref(false)

function openCreateDialog() {
  formDialogVisible.value = true
}

async function handleCreate(data) {
  formSaving.value = true
  try {
    await createTicket(data)
    ElMessage.success('工单创建成功')
    formDialogVisible.value = false
    await fetchData()
  } catch (e) {
    const msg = e.response?.data?.message || e.message || '创建失败'
    ElMessage.error(msg)
  } finally {
    formSaving.value = false
  }
}

const canCreate = computed(() => userStore.hasPermission('ticket:create'))

async function fetchOptions() {
  optionsLoading.value = true
  try {
    const res = await getTicketOptions()
    options.value = res.data
  } catch {
    // 静默失败
  } finally {
    optionsLoading.value = false
  }
}

// 筛选条件
const filters = ref({
  keyword: '',
  issueType: '',
  status: '',
  priority: '',
  assigneeId: '',
  customerId: '',
  createdStart: '',
  createdEnd: ''
})

// 列表数据
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const error = ref('')

async function fetchData() {
  loading.value = true
  error.value = ''
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      ...filters.value
    }
    // 移除空值
    Object.keys(params).forEach(k => {
      if (params[k] === '' || params[k] === undefined) delete params[k]
    })
    const res = await getTickets(params)
    list.value = res.data.list
    total.value = res.data.total
    page.value = res.data.page
    pageSize.value = res.data.pageSize
  } catch (e) {
    error.value = e.response?.data?.message || e.message || '加载失败'
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  fetchData()
}

function handleReset() {
  filters.value = {
    keyword: '',
    issueType: '',
    status: '',
    priority: '',
    assigneeId: '',
    customerId: '',
    createdStart: '',
    createdEnd: ''
  }
  page.value = 1
  fetchData()
}

function handlePageChange(val) {
  page.value = val
  fetchData()
}

function handleSizeChange(val) {
  pageSize.value = val
  page.value = 1
  fetchData()
}

function goDetail(id) {
  router.push(`/tickets/${id}`)
}

// 状态/优先级映射
const statusMap = {
  pending: { label: '待处理', type: 'danger' },
  processing: { label: '处理中', type: 'warning' },
  pending_confirmation: { label: '待确认', type: 'primary' },
  resolved: { label: '已解决', type: 'info' },
  closed: { label: '已关闭', type: 'success' }
}

const priorityMap = {
  low: { label: '低', type: 'info' },
  medium: { label: '中', type: '' },
  high: { label: '高', type: 'warning' },
  urgent: { label: '紧急', type: 'danger' }
}

onMounted(() => {
  fetchOptions()
  fetchData()
})
</script>

<template>
  <div class="ticket-list">
    <div class="page-card">
      <div class="page-card__header">
        <span class="title">工单管理</span>
        <el-button v-if="canCreate" type="primary" :icon="Plus" @click="openCreateDialog">新建工单</el-button>
      </div>

      <!-- 搜索/筛选区 -->
      <div class="page-card__body">
        <el-form :model="filters" label-width="80px" size="small">
          <el-row :gutter="16">
            <el-col :span="6">
              <el-form-item label="关键词">
                <el-input
                  v-model="filters.keyword"
                  placeholder="标题/编号/客户"
                  clearable
                  @keyup.enter="handleSearch"
                />
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item label="工单类型">
                <el-select v-model="filters.issueType" placeholder="全部" clearable>
                  <el-option
                    v-for="item in options.issueTypes"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item label="状态">
                <el-select v-model="filters.status" placeholder="全部" clearable>
                  <el-option
                    v-for="item in options.statuses"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item label="优先级">
                <el-select v-model="filters.priority" placeholder="全部" clearable>
                  <el-option label="低" value="low" />
                  <el-option label="中" value="medium" />
                  <el-option label="高" value="high" />
                  <el-option label="紧急" value="urgent" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="负责人">
                <el-select v-model="filters.assigneeId" placeholder="全部" clearable>
                  <el-option label="未分配" value="unassigned" />
                  <el-option
                    v-for="item in options.assignees"
                    :key="item.id"
                    :label="item.name"
                    :value="item.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="6">
              <el-form-item label="创建起始">
                <el-date-picker
                  v-model="filters.createdStart"
                  type="date"
                  placeholder="开始日期"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="创建截止">
                <el-date-picker
                  v-model="filters.createdEnd"
                  type="date"
                  placeholder="结束日期"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="客户">
                <el-select v-model="filters.customerId" placeholder="全部" clearable filterable>
                  <el-option
                    v-for="item in options.customers"
                    :key="item.id"
                    :label="item.name"
                    :value="item.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <div class="filter-actions">
                <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
                <el-button :icon="Refresh" @click="handleReset">重置</el-button>
              </div>
            </el-col>
          </el-row>
        </el-form>
      </div>
    </div>

    <!-- 表格区域 -->
    <div class="page-card">
      <div class="page-card__body">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <el-skeleton :rows="6" animated />
        </div>

        <!-- 错误状态 -->
        <div v-else-if="error" class="error-state">
          <el-result icon="error" title="加载失败" :sub-title="error">
            <template #extra>
              <el-button type="primary" @click="fetchData">重新加载</el-button>
            </template>
          </el-result>
        </div>

        <!-- 空数据状态 -->
        <div v-else-if="list.length === 0 && !loading" class="empty-state">
          <el-empty description="暂无工单数据">
            <el-button type="primary" @click="handleReset">重置筛选</el-button>
          </el-empty>
        </div>

        <!-- 正常表格 -->
        <template v-else>
          <el-table
            :data="list"
            stripe
            highlight-current-row
            @row-click="(row) => goDetail(row.id)"
            style="width: 100%"
          >
            <el-table-column prop="ticketNo" label="编号" width="140" fixed />
            <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
            <el-table-column prop="customerName" label="客户" width="140" show-overflow-tooltip />
            <el-table-column prop="issueTypeLabel" label="类型" width="100" />
            <el-table-column label="优先级" width="80" align="center">
              <template #default="{ row }">
                <el-tag
                  :type="priorityMap[row.priority]?.type || 'info'"
                  size="small"
                  effect="plain"
                >
                  {{ priorityMap[row.priority]?.label || row.priority }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag
                  :type="statusMap[row.status]?.type || 'info'"
                  size="small"
                >
                  {{ row.statusLabel }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="assigneeName" label="负责人" width="120">
              <template #default="{ row }">
                <span v-if="row.assigneeName">{{ row.assigneeName }}</span>
                <el-tag v-else type="info" size="small">未分配</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="创建时间" width="170">
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click.stop="goDetail(row.id)">
                  详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination-wrap">
            <el-pagination
              v-model:current-page="page"
              v-model:page-size="pageSize"
              :total="total"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              background
              @current-change="handlePageChange"
              @size-change="handleSizeChange"
            />
          </div>
        </template>
      </div>
    </div>
  </div>

  <!-- 新建工单对话框 -->
  <TicketFormDialog
    v-model="formDialogVisible"
    :saving="formSaving"
    :options="options"
    @save="handleCreate"
  />
</template>

<style lang="scss" scoped>
.ticket-list {
  p { color: $text-regular; }
}

.filter-actions {
  display: flex;
  gap: 8px;
  padding-top: 2px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.loading-state {
  padding: 20px 0;
}

.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
}

.el-table ::v-deep(.el-table__row) {
  cursor: pointer;
}

.page-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
