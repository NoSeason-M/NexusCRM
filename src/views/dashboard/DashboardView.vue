<script setup>
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
</script>

<template>
  <div class="dashboard">
    <div class="page-card">
      <div class="page-card__header">
        <span class="title">仪表盘</span>
      </div>
      <div class="page-card__body">
        <p>欢迎使用 NexusCRM 管理系统</p>

        <el-divider />

        <!-- 按钮权限演示 -->
        <h4 class="perm-title">按钮权限测试（{{ userStore.roleName }}）</h4>
        <div class="perm-buttons">
          <el-button
            v-if="userStore.hasPermission('customer:create')"
            type="primary"
          >
            新建客户 (customer:create)
          </el-button>

          <el-button
            v-if="userStore.hasPermission('opportunity:create')"
            type="success"
          >
            新建商机 (opportunity:create)
          </el-button>

          <el-button
            v-if="userStore.hasPermission('contract:approve')"
            type="warning"
          >
            审批合同 (contract:approve)
          </el-button>

          <el-button
            v-if="userStore.hasPermission('ticket:handle')"
            type="danger"
          >
            处理工单 (ticket:handle)
          </el-button>
        </div>

        <el-alert
          class="perm-info"
          title="由于 admin 拥有 * 通配权限，所以能看见所有按钮。可用其他账号登录对比"
          type="info"
          show-icon
          :closable="false"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.dashboard {
  p {
    color: $text-regular;
    font-size: 16px;
  }
}

.perm-title {
  font-size: 14px;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 12px;
}

.perm-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.perm-info {
  margin-top: 8px;
}
</style>
