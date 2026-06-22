<script setup>
import { useAppStore } from '@/stores'
import { Expand, Fold } from '@element-plus/icons-vue'
import Breadcrumb from './Breadcrumb.vue'

const appStore = useAppStore()

function handleToggle() {
  appStore.toggleSidebar()
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
      <!-- 右侧区域预留 -->
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
</style>
