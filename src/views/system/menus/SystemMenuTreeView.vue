<script setup>
/**
 * SystemMenuTreeView — 菜单管理页
 */
import { ref, onMounted } from 'vue'
import { getSystemMenus } from '@/api/system'

const menuTree = ref([])
const loading = ref(false)
const error = ref('')

async function fetchData() {
  loading.value = true
  error.value = ''
  try {
    const res = await getSystemMenus()
    menuTree.value = res.data || []
  } catch (e) {
    error.value = e.response?.data?.message || e.message || '加载失败'
  } finally {
    loading.value = false
  }
}

const statusMap = { active: { label: '启用', type: 'success' }, disabled: { label: '禁用', type: 'danger' } }

onMounted(fetchData)
</script>

<template>
  <div class="system-menus">
    <div class="page-card">
      <div class="page-card__header">
        <span class="title">菜单管理</span>
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
        <template v-else-if="menuTree.length > 0">
          <el-table :data="menuTree" stripe row-key="id" default-expand-all style="width: 100%">
            <el-table-column label="菜单名称" min-width="200">
              <template #default="{ row }">
                <span :style="{ marginLeft: row.children?.length ? '0' : '24px' }">
                  {{ row.title }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="path" label="路由路径" width="180" />
            <el-table-column prop="name" label="标识名" width="140" />
            <el-table-column prop="icon" label="图标" width="80" />
            <el-table-column label="权限标识" width="180">
              <template #default="{ row }">
                <el-tag v-if="row.permission" size="small" effect="plain">{{ row.permission }}</el-tag>
                <span v-else class="text-secondary">-</span>
              </template>
            </el-table-column>
            <el-table-column label="可见" width="60" align="center">
              <template #default="{ row }">
                <el-tag v-if="!row.hidden" type="success" size="small">是</el-tag>
                <el-tag v-else type="danger" size="small">否</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="排序" width="60" align="center">
              <template #default="{ row }">{{ row.order || '-' }}</template>
            </el-table-column>
            <el-table-column label="可见角色" min-width="200">
              <template #default="{ row }">
                <div class="roles-list" v-if="row.roles && row.roles.length">
                  <el-tag v-for="r in row.roles" :key="r" size="small" effect="plain" class="role-tag">{{ r }}</el-tag>
                </div>
                <span v-else class="text-secondary">全部</span>
              </template>
            </el-table-column>
          </el-table>
        </template>
        <div v-else class="empty-state">
          <el-empty description="暂无菜单数据" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.system-menus {
  p { color: $text-regular; }
}
.loading-state { padding: 20px 0; }
.error-state, .empty-state { display: flex; flex-direction: column; align-items: center; padding: 40px 0; }
.page-card__header { display: flex; align-items: center; justify-content: space-between; }
.roles-list { display: flex; flex-wrap: wrap; gap: 4px; }
.role-tag { max-width: 100px; overflow: hidden; text-overflow: ellipsis; }
.text-secondary { color: $text-secondary; }
</style>
