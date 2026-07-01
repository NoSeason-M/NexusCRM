<script setup>
/**
 * MarketingCampaignListView — 营销活动列表页
 *
 * 功能：
 * - 关键词搜索
 * - 多维筛选（类型、状态、渠道、负责人、日期范围）
 * - 指标展示（转化率、预算使用率、单线索成本）
 * - 新建活动（campaign:create）、编辑（campaign:edit）
 * - 统计概览卡片
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMarketingCampaigns, getMarketingCampaignOptions, getMarketingStatistics, createMarketingCampaign, updateMarketingCampaign } from '@/api/marketing'
import { useUserStore } from '@/stores/user'
import { formatDate, formatCurrency } from '@/utils/format'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import MarketingCampaignFormDialog from './components/MarketingCampaignFormDialog.vue'

const router = useRouter()
const userStore = useUserStore()

const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const error = ref('')

const stats = ref(null)
const statsLoading = ref(false)

const options = ref({ types: [], statuses: [], channels: [], owners: [] })
const filters = ref({ keyword: '', type: '', status: '', channel: '', ownerId: '', startDate: '', endDate: '' })

// 表单
const formDialogVisible = ref(false)
const editingCampaign = ref(null)
const formSaving = ref(false)

const statusMap = {
  planning: { label: '规划中', type: 'info' },
  active: { label: '进行中', type: 'success' },
  paused: { label: '已暂停', type: 'warning' },
  completed: { label: '已结束', type: 'primary' },
  cancelled: { label: '已取消', type: 'danger' }
}

async function fetchOptions() {
  try {
    const res = await getMarketingCampaignOptions()
    options.value = res.data
  } catch { /* silent */ }
}

async function fetchStats() {
  statsLoading.value = true
  try {
    const res = await getMarketingStatistics()
    stats.value = res.data
  } catch { /* silent */ }
  finally { statsLoading.value = false }
}

async function fetchData() {
  loading.value = true
  error.value = ''
  try {
    const params = { page: page.value, pageSize: pageSize.value, ...filters.value }
    Object.keys(params).forEach(k => { if (params[k] === '' || params[k] === undefined) delete params[k] })
    const res = await getMarketingCampaigns(params)
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

function handleSearch() { page.value = 1; fetchData() }
function handleReset() {
  filters.value = { keyword: '', type: '', status: '', channel: '', ownerId: '', startDate: '', endDate: '' }
  page.value = 1; fetchData()
}
function handlePageChange(val) { page.value = val; fetchData() }
function handleSizeChange(val) { pageSize.value = val; page.value = 1; fetchData() }

const canCreate = computed(() => userStore.hasPermission('campaign:create'))
const canEdit = computed(() => userStore.hasPermission('campaign:edit'))

function openCreate() {
  editingCampaign.value = null
  formDialogVisible.value = true
}

function openEdit(row, e) {
  e.stopPropagation()
  if (!canEdit.value) return
  editingCampaign.value = row
  formDialogVisible.value = true
}

async function handleSave(formData) {
  formSaving.value = true
  try {
    if (editingCampaign.value) {
      await updateMarketingCampaign(editingCampaign.value.id, formData)
      ElMessage.success('活动已更新')
    } else {
      await createMarketingCampaign(formData)
      ElMessage.success('活动已创建')
    }
    formDialogVisible.value = false
    await fetchData()
    await fetchStats()
  } catch (e) {
    const msg = e.response?.data?.message || e.message || '操作失败'
    ElMessage.error(msg)
  } finally {
    formSaving.value = false
  }
}

function goDetail(id) {
  router.push(`/marketing/campaigns/${id}`)
}

import { computed } from 'vue'

onMounted(() => { fetchOptions(); fetchStats(); fetchData() })
</script>

<template>
  <div class="campaign-list">
    <!-- 统计概览 -->
    <div class="page-card" v-if="stats">
      <div class="page-card__header"><span class="title">活动概览</span></div>
      <div class="page-card__body">
        <el-row :gutter="16">
          <el-col :span="4">
            <div class="stat-card">
              <div class="stat-value">{{ stats.campaignCount }}</div>
              <div class="stat-label">活动总数</div>
            </div>
          </el-col>
          <el-col :span="5">
            <div class="stat-card">
              <div class="stat-value">{{ formatCurrency(stats.totalBudget) }}</div>
              <div class="stat-label">总预算</div>
            </div>
          </el-col>
          <el-col :span="5">
            <div class="stat-card">
              <div class="stat-value">{{ formatCurrency(stats.totalActualCost) }}</div>
              <div class="stat-label">实际总成本</div>
            </div>
          </el-col>
          <el-col :span="5">
            <div class="stat-card">
              <div class="stat-value">{{ stats.totalLeadCount.toLocaleString() }}</div>
              <div class="stat-label">总线索数</div>
            </div>
          </el-col>
          <el-col :span="5">
            <div class="stat-card">
              <div class="stat-value">{{ stats.totalConvertedLeadCount.toLocaleString() }}</div>
              <div class="stat-label">转化线索数</div>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>

    <!-- 搜索/筛选 -->
    <div class="page-card">
      <div class="page-card__header">
        <span class="title">营销活动</span>
        <el-button v-if="canCreate" type="primary" :icon="Plus" @click="openCreate">新建活动</el-button>
      </div>
      <div class="page-card__body">
        <el-form :model="filters" label-width="80px" size="small">
          <el-row :gutter="16">
            <el-col :span="6">
              <el-form-item label="关键词">
                <el-input v-model="filters.keyword" placeholder="名称/类型/渠道" clearable @keyup.enter="handleSearch" />
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item label="类型">
                <el-select v-model="filters.type" placeholder="全部" clearable style="width: 100%">
                  <el-option v-for="t in options.types" :key="t.value" :label="t.label" :value="t.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item label="状态">
                <el-select v-model="filters.status" placeholder="全部" clearable style="width: 100%">
                  <el-option v-for="s in options.statuses" :key="s.value" :label="s.label" :value="s.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item label="渠道">
                <el-select v-model="filters.channel" placeholder="全部" clearable style="width: 100%">
                  <el-option v-for="c in options.channels" :key="c.value" :label="c.label" :value="c.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="负责人">
                <el-select v-model="filters.ownerId" placeholder="全部" clearable filterable style="width: 100%">
                  <el-option v-for="o in options.owners" :key="o.id" :label="o.name" :value="o.id" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="6">
              <el-form-item label="创建起始">
                <el-date-picker v-model="filters.startDate" type="date" placeholder="开始日期" value-format="YYYY-MM-DD" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="创建截止">
                <el-date-picker v-model="filters.endDate" type="date" placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <div class="filter-actions">
                <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
                <el-button :icon="Refresh" @click="handleReset">重置</el-button>
              </div>
            </el-col>
          </el-row>
        </el-form>
      </div>
    </div>

    <!-- 表格 -->
    <div class="page-card">
      <div class="page-card__body">
        <div v-if="loading" class="loading-state"><el-skeleton :rows="6" animated /></div>
        <div v-else-if="error" class="error-state">
          <el-result icon="error" title="加载失败" :sub-title="error">
            <template #extra><el-button type="primary" @click="fetchData">重新加载</el-button></template>
          </el-result>
        </div>
        <div v-else-if="list.length === 0" class="empty-state">
          <el-empty description="暂无营销活动">
            <el-button type="primary" @click="handleReset">重置筛选</el-button>
          </el-empty>
        </div>
        <template v-else>
          <el-table :data="list" stripe highlight-current-row @row-click="(row) => goDetail(row.id)" style="width: 100%">
            <el-table-column prop="name" label="活动名称" min-width="160" show-overflow-tooltip />
            <el-table-column label="类型" width="100">
              <template #default="{ row }">{{ row.typeLabel }}</template>
            </el-table-column>
            <el-table-column label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.statusType || 'info'" size="small">{{ row.statusLabel }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="渠道" width="100">
              <template #default="{ row }">{{ row.channelLabel }}</template>
            </el-table-column>
            <el-table-column label="预算" width="120" align="right">
              <template #default="{ row }">{{ formatCurrency(row.budget) }}</template>
            </el-table-column>
            <el-table-column label="转化率" width="80" align="center">
              <template #default="{ row }">{{ row.conversionRate }}</template>
            </el-table-column>
            <el-table-column label="预算使用率" width="100" align="center">
              <template #default="{ row }">{{ row.budgetUsageRate }}</template>
            </el-table-column>
            <el-table-column label="单线索成本" width="100" align="right">
              <template #default="{ row }">{{ row.costPerLead }}</template>
            </el-table-column>
            <el-table-column prop="ownerName" label="负责人" width="100" />
            <el-table-column label="创建时间" width="150">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="60" fixed="right">
              <template #default="{ row }">
                <el-button v-if="canEdit" type="primary" link size="small" @click.stop="openEdit(row, $event)">编辑</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-wrap">
            <el-pagination
              v-model:current-page="page" v-model:page-size="pageSize"
              :total="total" :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper" background
              @current-change="handlePageChange" @size-change="handleSizeChange"
            />
          </div>
        </template>
      </div>
    </div>

    <MarketingCampaignFormDialog
      v-model="formDialogVisible"
      :campaign="editingCampaign"
      :saving="formSaving"
      :options="options"
      @save="handleSave"
    />
  </div>
</template>

<style lang="scss" scoped>
.campaign-list {
  p { color: $text-regular; }
}
.filter-actions { display: flex; gap: 8px; padding-top: 2px; }
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 16px; }
.loading-state { padding: 20px 0; }
.error-state, .empty-state { display: flex; flex-direction: column; align-items: center; padding: 40px 0; }
.page-card__header { display: flex; align-items: center; justify-content: space-between; }
.stat-card {
  text-align: center;
  padding: 12px 0;
  .stat-value { font-size: 20px; font-weight: 700; color: $text-primary; }
  .stat-label { font-size: 12px; color: $text-secondary; margin-top: 4px; }
}
.el-table ::v-deep(.el-table__row) { cursor: pointer; }
</style>
