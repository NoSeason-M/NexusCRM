<script setup>
/**
 * SystemUserListView — 系统用户管理页
 */
import { ref, onMounted } from 'vue'
import { getSystemUsers, getSystemUserOptions, createSystemUser, updateSystemUser, updateSystemUserStatus } from '@/api/system'
import { formatDate } from '@/utils/format'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import SystemUserFormDialog from './components/SystemUserFormDialog.vue'

const userStore = useUserStore()

const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const error = ref('')

const filters = ref({ keyword: '', role: '', status: '' })
const options = ref({ roles: [] })

// 表单对话框
const formDialogVisible = ref(false)
const editingUser = ref(null)
const formSaving = ref(false)

const statusMap = { active: { label: '活跃', type: 'success' }, disabled: { label: '已禁用', type: 'danger' } }

async function fetchOptions() {
  try {
    const res = await getSystemUserOptions()
    options.value = res.data
  } catch { /* silent */ }
}

async function fetchData() {
  loading.value = true
  error.value = ''
  try {
    const params = { page: page.value, pageSize: pageSize.value, ...filters.value }
    Object.keys(params).forEach(k => { if (params[k] === '' || params[k] === undefined) delete params[k] })
    const res = await getSystemUsers(params)
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
function handleReset() { filters.value = { keyword: '', role: '', status: '' }; page.value = 1; fetchData() }
function handlePageChange(val) { page.value = val; fetchData() }
function handleSizeChange(val) { pageSize.value = val; page.value = 1; fetchData() }

function openCreate() {
  editingUser.value = null
  formDialogVisible.value = true
}

function openEdit(row) {
  editingUser.value = row
  formDialogVisible.value = true
}

async function handleSave(formData) {
  formSaving.value = true
  try {
    if (editingUser.value) {
      await updateSystemUser(editingUser.value.id, formData)
      ElMessage.success('用户已更新')
    } else {
      await createSystemUser(formData)
      ElMessage.success('用户已创建')
    }
    formDialogVisible.value = false
    await fetchData()
  } catch (e) {
    const msg = e.response?.data?.message || e.message || '操作失败'
    ElMessage.error(msg)
  } finally {
    formSaving.value = false
  }
}

async function handleToggleStatus(row) {
  const newStatus = row.status === 'active' ? 'disabled' : 'active'
  const actionLabel = newStatus === 'disabled' ? '禁用' : '启用'
  try {
    await ElMessageBox.confirm(
      `确定要${actionLabel}用户「${row.name}」吗？`,
      '确认',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
  } catch { return }

  try {
    await updateSystemUserStatus(row.id, newStatus)
    ElMessage.success(`用户已${actionLabel}`)
    await fetchData()
  } catch (e) {
    const msg = e.response?.data?.message || e.message || '操作失败'
    ElMessage.error(msg)
  }
}

onMounted(() => { fetchOptions(); fetchData() })
</script>

<template>
  <div class="system-users">
    <div class="page-card">
      <div class="page-card__header">
        <span class="title">用户管理</span>
        <el-button type="primary" :icon="Plus" @click="openCreate">新增用户</el-button>
      </div>
      <div class="page-card__body">
        <el-form :model="filters" label-width="80px" size="small" class="filter-form">
          <el-row :gutter="16">
            <el-col :span="6">
              <el-form-item label="关键词">
                <el-input v-model="filters.keyword" placeholder="用户名/姓名/邮箱" clearable @keyup.enter="handleSearch" />
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item label="角色">
                <el-select v-model="filters.role" placeholder="全部" clearable style="width: 100%">
                  <el-option v-for="r in options.roles" :key="r.value" :label="r.label" :value="r.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item label="状态">
                <el-select v-model="filters.status" placeholder="全部" clearable style="width: 100%">
                  <el-option label="活跃" value="active" />
                  <el-option label="已禁用" value="disabled" />
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

    <div class="page-card">
      <div class="page-card__body">
        <div v-if="loading" class="loading-state"><el-skeleton :rows="6" animated /></div>
        <div v-else-if="error" class="error-state">
          <el-result icon="error" title="加载失败" :sub-title="error">
            <template #extra><el-button type="primary" @click="fetchData">重新加载</el-button></template>
          </el-result>
        </div>
        <div v-else-if="list.length === 0" class="empty-state">
          <el-empty description="暂无用户数据">
            <el-button type="primary" @click="handleReset">重置筛选</el-button>
          </el-empty>
        </div>
        <template v-else>
          <el-table :data="list" stripe style="width: 100%">
            <el-table-column prop="username" label="用户名" width="140" />
            <el-table-column prop="name" label="姓名" width="130" />
            <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
            <el-table-column prop="phone" label="手机" width="140" />
            <el-table-column label="角色" width="100">
              <template #default="{ row }">
                <el-tag size="small" effect="plain">{{ row.roleName }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="statusMap[row.status]?.type || 'info'" size="small">{{ statusMap[row.status]?.label || row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="最近登录" width="170">
              <template #default="{ row }">{{ row.lastLoginAt ? formatDate(row.lastLoginAt) : '从未登录' }}</template>
            </el-table-column>
            <el-table-column label="创建时间" width="170">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="openEdit(row)">编辑</el-button>
                <el-button
                  type="primary"
                  link
                  size="small"
                  :class="row.status === 'active' ? 'text-warning' : 'text-success'"
                  @click="handleToggleStatus(row)"
                >
                  {{ row.status === 'active' ? '禁用' : '启用' }}
                </el-button>
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

    <SystemUserFormDialog
      v-model="formDialogVisible"
      :user="editingUser"
      :saving="formSaving"
      :roles="options.roles"
      @save="handleSave"
    />
  </div>
</template>

<style lang="scss" scoped>
.system-users {
  p { color: $text-regular; }
}
.filter-form { margin-bottom: 0; }
.filter-actions { display: flex; gap: 8px; padding-top: 2px; }
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 16px; }
.loading-state { padding: 20px 0; }
.error-state, .empty-state { display: flex; flex-direction: column; align-items: center; padding: 40px 0; }
.page-card__header { display: flex; align-items: center; justify-content: space-between; }
:deep(.text-warning) { color: $warning-color !important; }
:deep(.text-success) { color: $success-color !important; }
</style>
