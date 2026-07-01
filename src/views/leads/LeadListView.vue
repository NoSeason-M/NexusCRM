<script setup>
/**
 * LeadListView — 销售线索列表页
 *
 * 功能：
 * - 关键词搜索 + 6 维筛选 + 分页
 * - 表格展示来源/状态/意向/负责人等信息
 * - 新建线索（lead:create）
 * - 批量分配（lead:assign）
 * - 行点击详情
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getLeads, getLeadOptions, createLead, assignLeads } from '@/api/lead'
import { useUserStore } from '@/stores/user'
import { formatDate } from '@/utils/format'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Plus, Top } from '@element-plus/icons-vue'
import LeadFormDialog from './components/LeadFormDialog.vue'
import LeadAssignmentDialog from './components/LeadAssignmentDialog.vue'

const router = useRouter()
const userStore = useUserStore()

const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const error = ref('')

const options = ref({ sources: [], statuses: [], intentionLevels: [], owners: [], campaigns: [] })

const filters = ref({ keyword: '', source: '', status: '', intentionLevel: '', ownerId: '', campaignId: '', createdStart: '', createdEnd: '' })

const statusMap = {
  new: { label: '新线索', type: 'info' },
  contacted: { label: '已联系', type: 'primary' },
  qualified: { label: '已确认', type: 'warning' },
  converted: { label: '已转化', type: 'success' },
  closed: { label: '已关闭', type: 'danger' }
}
const intentionMap = { high: { type: 'danger' }, medium: { type: 'warning' }, low: { type: 'info' } }

// 批量分配
const selectedIds = ref([])
const assignDialogVisible = ref(false)
const assignSaving = ref(false)

// 创建
const formDialogVisible = ref(false)
const formSaving = ref(false)
const editingLead = ref(null)

const canCreate = computed(() => userStore.hasPermission('lead:create'))
const canAssign = computed(() => userStore.hasPermission('lead:assign'))

async function fetchOptions() {
  try { const res = await getLeadOptions(); options.value = res.data } catch { /* silent */ }
}

async function fetchData() {
  loading.value = true; error.value = ''
  try {
    const params = { page: page.value, pageSize: pageSize.value, ...filters.value }
    Object.keys(params).forEach(k => { if (params[k] === '' || params[k] === undefined) delete params[k] })
    const res = await getLeads(params)
    list.value = res.data.list; total.value = res.data.total
    page.value = res.data.page; pageSize.value = res.data.pageSize
  } catch (e) {
    error.value = e.response?.data?.message || e.message || '加载失败'
    list.value = []; total.value = 0
  } finally { loading.value = false }
}

function handleSearch() { page.value = 1; fetchData() }
function handleReset() {
  filters.value = { keyword: '', source: '', status: '', intentionLevel: '', ownerId: '', campaignId: '', createdStart: '', createdEnd: '' }
  selectedIds.value = []; page.value = 1; fetchData()
}
function handlePageChange(val) { page.value = val; fetchData() }
function handleSizeChange(val) { pageSize.value = val; page.value = 1; fetchData() }
function goDetail(id) { router.push(`/leads/${id}`) }

function openCreate() { editingLead.value = null; formDialogVisible.value = true }

async function handleSave(formData) {
  formSaving.value = true
  try {
    await createLead(formData)
    ElMessage.success('线索已创建')
    formDialogVisible.value = false; selectedIds.value = []; await fetchData()
  } catch (e) { ElMessage.error(e.response?.data?.message || e.message || '创建失败') }
  finally { formSaving.value = false }
}

function handleSelectionChange(rows) { selectedIds.value = rows.map(r => r.id) }

function openAssign() {
  if (selectedIds.value.length === 0) { ElMessage.warning('请先选择要分配的线索'); return }
  assignDialogVisible.value = true
}

async function handleAssign(ownerId) {
  assignSaving.value = true
  try {
    const res = await assignLeads({ leadIds: selectedIds.value, ownerId })
    ElMessage.success(res.data.message || '分配成功')
    assignDialogVisible.value = false; selectedIds.value = []; await fetchData()
  } catch (e) { ElMessage.error(e.response?.data?.message || e.message || '分配失败') }
  finally { assignSaving.value = false }
}

onMounted(() => { fetchOptions(); fetchData() })
</script>

<template>
  <div class="lead-list">
    <div class="page-card">
      <div class="page-card__header">
        <span class="title">销售线索</span>
        <div class="header-actions">
          <el-button v-if="canAssign" :icon="Top" @click="openAssign" :disabled="selectedIds.length === 0">批量分配 ({{ selectedIds.length }})</el-button>
          <el-button v-if="canCreate" type="primary" :icon="Plus" @click="openCreate">新建线索</el-button>
        </div>
      </div>
      <div class="page-card__body">
        <el-form :model="filters" label-width="80px" size="small">
          <el-row :gutter="16">
            <el-col :span="6">
              <el-form-item label="关键词">
                <el-input v-model="filters.keyword" placeholder="姓名/公司/电话/邮箱" clearable @keyup.enter="handleSearch" />
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item label="来源">
                <el-select v-model="filters.source" placeholder="全部" clearable style="width: 100%">
                  <el-option v-for="s in options.sources" :key="s.value" :label="s.label" :value="s.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="3">
              <el-form-item label="状态">
                <el-select v-model="filters.status" placeholder="全部" clearable style="width: 100%">
                  <el-option v-for="s in options.statuses" :key="s.value" :label="s.label" :value="s.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="3">
              <el-form-item label="意向">
                <el-select v-model="filters.intentionLevel" placeholder="全部" clearable style="width: 100%">
                  <el-option v-for="il in options.intentionLevels" :key="il.value" :label="il.label" :value="il.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item label="负责人">
                <el-select v-model="filters.ownerId" placeholder="全部" clearable style="width: 100%">
                  <el-option label="未分配" value="unassigned" />
                  <el-option v-for="o in options.owners" :key="o.id" :label="o.name" :value="o.id" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item label="活动">
                <el-select v-model="filters.campaignId" placeholder="全部" clearable filterable style="width: 100%">
                  <el-option v-for="c in options.campaigns" :key="c.id" :label="c.name" :value="c.id" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="6">
              <el-form-item label="起始日期">
                <el-date-picker v-model="filters.createdStart" type="date" placeholder="开始" value-format="YYYY-MM-DD" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="截止日期">
                <el-date-picker v-model="filters.createdEnd" type="date" placeholder="结束" value-format="YYYY-MM-DD" style="width: 100%" />
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

    <div class="page-card">
      <div class="page-card__body">
        <div v-if="loading" class="loading-state"><el-skeleton :rows="6" animated /></div>
        <div v-else-if="error" class="error-state">
          <el-result icon="error" title="加载失败" :sub-title="error">
            <template #extra><el-button type="primary" @click="fetchData">重新加载</el-button></template>
          </el-result>
        </div>
        <div v-else-if="list.length === 0" class="empty-state">
          <el-empty description="暂无销售线索">
            <el-button type="primary" @click="handleReset">重置筛选</el-button>
          </el-empty>
        </div>
        <template v-else>
          <el-table :data="list" stripe @row-click="(row) => goDetail(row.id)" @selection-change="handleSelectionChange" style="width: 100%">
            <el-table-column type="selection" width="40" @click.stop />
            <el-table-column prop="name" label="联系人" width="120" />
            <el-table-column prop="company" label="公司" width="160" show-overflow-tooltip />
            <el-table-column prop="phone" label="电话" width="130" />
            <el-table-column label="来源" width="90">
              <template #default="{ row }">{{ row.sourceLabel }}</template>
            </el-table-column>
            <el-table-column label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.statusType || 'info'" size="small">{{ row.statusLabel }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="意向" width="60" align="center">
              <template #default="{ row }">
                <el-tag :type="intentionMap[row.intentionLevel]?.type || 'info'" size="small" effect="plain">
                  {{ row.intentionLabel }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="ownerName" label="负责人" width="100">
              <template #default="{ row }">
                <span v-if="row.ownerName">{{ row.ownerName }}</span>
                <el-tag v-else type="info" size="small">未分配</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="最近跟进" width="150">
              <template #default="{ row }">{{ row.lastFollowAt ? formatDate(row.lastFollowAt) : '未跟进' }}</template>
            </el-table-column>
            <el-table-column label="创建时间" width="150">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
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

    <LeadFormDialog v-model="formDialogVisible" :saving="formSaving" :options="options" @save="handleSave" />
    <LeadAssignmentDialog v-model="assignDialogVisible" :saving="assignSaving" :owners="options.owners" :selected-count="selectedIds.length" @assign="handleAssign" />
  </div>
</template>

<style lang="scss" scoped>
.lead-list {
  p { color: $text-regular; }
}
.page-card__header { display: flex; align-items: center; justify-content: space-between; }
.header-actions { display: flex; gap: 8px; }
.filter-actions { display: flex; gap: 8px; padding-top: 2px; }
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 16px; }
.loading-state { padding: 20px 0; }
.error-state, .empty-state { display: flex; flex-direction: column; align-items: center; padding: 40px 0; }
.el-table ::v-deep(.el-table__row) { cursor: pointer; }
</style>
