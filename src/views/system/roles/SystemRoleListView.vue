<script setup>
/**
 * SystemRoleListView — 角色管理页
 */
import { ref, onMounted } from 'vue'
import { getSystemRoles } from '@/api/system'
import { ElMessage } from 'element-plus'

const roles = ref([])
const loading = ref(false)
const error = ref('')

async function fetchData() {
  loading.value = true
  error.value = ''
  try {
    const res = await getSystemRoles()
    roles.value = res.data || []
  } catch (e) {
    error.value = e.response?.data?.message || e.message || '加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
</script>

<template>
  <div class="system-roles">
    <div class="page-card">
      <div class="page-card__header">
        <span class="title">角色管理</span>
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
        <template v-else>
          <el-table :data="roles" stripe style="width: 100%">
            <el-table-column label="角色编码" width="120">
              <template #default="{ row }"><el-tag size="small">{{ row.code }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="name" label="角色名称" width="120" />
            <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
            <el-table-column label="用户数" width="80" align="center">
              <template #default="{ row }">{{ row.userCount || 0 }}</template>
            </el-table-column>
            <el-table-column label="权限数" width="80" align="center">
              <template #default="{ row }">{{ row.permissions?.length || 0 }}</template>
            </el-table-column>
            <el-table-column label="权限列表" min-width="300">
              <template #default="{ row }">
                <div class="perms-list" v-if="row.permissions && row.permissions.length > 0">
                  <el-tag
                    v-for="p in row.permissions.slice(0, 8)"
                    :key="p"
                    size="small"
                    effect="plain"
                    class="perm-tag"
                  >{{ p }}</el-tag>
                  <el-tag v-if="row.permissions.length > 8" size="small" type="info">+{{ row.permissions.length - 8 }}</el-tag>
                </div>
                <span v-else class="text-secondary">无</span>
              </template>
            </el-table-column>
          </el-table>
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.system-roles {
  p { color: $text-regular; }
}
.loading-state { padding: 20px 0; }
.error-state { display: flex; flex-direction: column; align-items: center; padding: 40px 0; }
.page-card__header { display: flex; align-items: center; justify-content: space-between; }
.perms-list { display: flex; flex-wrap: wrap; gap: 4px; }
.perm-tag { max-width: 160px; overflow: hidden; text-overflow: ellipsis; }
.text-secondary { color: $text-secondary; }
</style>
