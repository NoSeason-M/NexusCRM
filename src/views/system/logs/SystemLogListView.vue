<script setup>
/**
 * SystemLogListView — 操作日志页
 */
import { ref, onMounted } from 'vue'
import { getSystemLogs, getSystemLogOptions } from '@/api/system'
import { formatDate } from '@/utils/format'
import { Search, Refresh } from '@element-plus/icons-vue'

const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const error = ref('')

const filters = ref({ keyword: '', module: '', operatorId: '', result: '', operatedStart: '', operatedEnd: '' })
const options = ref({ modules: [], operators: [] })

const resultMap = {
  success: { label: '成功', type: 'success' },
  fail: { label: '失败', type: 'danger' }
}

async function fetchOptions() {
  try {
    const res = await getSystemLogOptions()
    options.value = res.data
  } catch { /* silent */ }
}

async function fetchData() {
  loading.value = true
  error.value = ''
  try {
    const params = { page: page.value, pageSize: pageSize.value, ...filters.value }
    Object.keys(params).forEach(k => { if (params[k] === '' || params[k] === undefined) delete params[k] })
    const res = await getSystemLogs(params)
    list.value = res.data.list
    total.value = res.data.total
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
  filters.value = { keyword: '', module: '', operatorId: '', result: '', operatedStart: '', operatedEnd: '' }
  page.value = 1; fetchData()
}
function handlePageChange(val) { page.value = val; fetchData() }
function handleSizeChange(val) { pageSize.value = val; page.value = 1; fetchData() }

onMounted(() => { fetchOptions(); fetchData() })
</script>

<template>
  <div class="system-logs">
    <div class="page-card">
      <div class="page-card__header">
        <span class="title">操作日志</span>
      </div>
      <div class="page-card__body">
        <el-form :model="filters" label-width="80px" size="small">
          <el-row :gutter="16">
            <el-col :span="6">
              <el-form-item label="关键词">
                <el-input v-model="filters.keyword" placeholder="内容/操作人/模块" clearable @keyup.enter="handleSearch" />
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item label="模块">
                <el-select v-model="filters.module" placeholder="全部" clearable style="width: 100%">
                  <el-option v-for="m in options.modules" :key="m.value" :label="m.label" :value="m.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item label="操作人">
                <el-select v-model="filters.operatorId" placeholder="全部" clearable filterable style="width: 100%">
                  <el-option v-for="o in options.operators" :key="o.id" :label="o.name" :value="o.id" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="3">
              <el-form-item label="结果">
                <el-select v-model="filters.result" placeholder="全部" clearable style="width: 100%">
                  <el-option label="成功" value="success" />
                  <el-option label="失败" value="fail" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="7">
              <el-form-item label="操作时间" label-width="70px">
                <div class="date-range">
                  <el-date-picker
                    v-model="filters.operatedStart" type="date" placeholder="开始" value-format="YYYY-MM-DD" style="width: 120px"
                  />
                  <span class="date-separator">~</span>
                  <el-date-picker
                    v-model="filters.operatedEnd" type="date" placeholder="结束" value-format="YYYY-MM-DD" style="width: 120px"
                  />
                </div>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="6" :offset="18">
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
          <el-empty description="暂无操作日志">
            <el-button type="primary" @click="handleReset">重置筛选</el-button>
          </el-empty>
        </div>
        <template v-else>
          <el-table :data="list" stripe style="width: 100%">
            <el-table-column prop="operatorName" label="操作人" width="120" />
            <el-table-column label="模块" width="100">
              <template #default="{ row }">{{ row.moduleLabel || row.module }}</template>
            </el-table-column>
            <el-table-column prop="action" label="动作" width="100" />
            <el-table-column prop="content" label="操作内容" min-width="250" show-overflow-tooltip />
            <el-table-column label="结果" width="70" align="center">
              <template #default="{ row }">
                <el-tag :type="row.resultType || 'info'" size="small">{{ row.resultLabel }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="ipAddress" label="IP 地址" width="140" />
            <el-table-column label="操作时间" width="170">
              <template #default="{ row }">{{ formatDate(row.operatedAt) }}</template>
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
  </div>
</template>

<style lang="scss" scoped>
.system-logs {
  p { color: $text-regular; }
}
.filter-actions { display: flex; gap: 8px; padding-top: 2px; justify-content: flex-end; }
.date-range { display: flex; align-items: center; gap: 6px; }
.date-separator { color: $text-secondary; }
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 16px; }
.loading-state { padding: 20px 0; }
.error-state, .empty-state { display: flex; flex-direction: column; align-items: center; padding: 40px 0; }
.page-card__header { display: flex; align-items: center; justify-content: space-between; }
</style>
