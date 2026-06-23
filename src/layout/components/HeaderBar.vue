<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores'
import { useUserStore } from '@/stores/user'
import { Expand, Fold } from '@element-plus/icons-vue'
import Breadcrumb from './Breadcrumb.vue'

const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()

const logoutLoading = ref(false)

function handleToggle() {
  appStore.toggleSidebar()
}

async function handleLogout() {
  logoutLoading.value = true
  try {
    await userStore.logout()
    router.push('/login')
  } catch {
    // 忽略
  } finally {
    logoutLoading.value = false
  }
}
</script>

<template>
  <div class="header-bar">
    <div class="header-left">
      <!-- 侧边栏折叠按钮 -->
      <el-icon class="toggle-btn" @click="handleToggle" :size="20">
        <Fold v-if="!appStore.sidebarCollapsed" />
        <Expand v-else />
      </el-icon>

      <!-- 面包屑 -->
      <Breadcrumb />
    </div>

    <div class="header-right">
      <!-- 用户信息 -->
      <el-dropdown trigger="click" @command="handleLogout">
        <span class="user-info">
          <el-avatar :size="28" class="user-avatar">{{ userStore.username?.charAt(0).toUpperCase() }}</el-avatar>
          <span class="user-name">{{ userStore.username }}</span>
          <span class="user-role-tag">{{ userStore.roleName }}</span>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="logout" :disabled="logoutLoading">
              {{ logoutLoading ? '退出中...' : '退出登录' }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.header-bar {
  height: $navbar-height;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: $bg-white;
  border-bottom: 1px solid $border-lighter;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  position: relative;
  z-index: 1000;
}

.header-left {
  display: flex;
  align-items: center;
}

.toggle-btn {
  cursor: pointer;
  color: $text-regular;

  &:hover {
    color: $brand-color;
  }
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background-color 0.2s;

  &:hover {
    background-color: $bg-base;
  }
}

.user-avatar {
  background-color: $brand-color;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
}

.user-name {
  font-size: 13px;
  color: $text-primary;
  font-weight: 500;
}

.user-role-tag {
  font-size: 11px;
  color: $text-secondary;
  background: $bg-base;
  padding: 1px 6px;
  border-radius: 4px;
}
</style>
