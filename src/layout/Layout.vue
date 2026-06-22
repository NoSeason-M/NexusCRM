<script setup>
import { computed } from 'vue'
import { useAppStore } from '@/stores'
import Sidebar from './components/Sidebar.vue'
import HeaderBar from './components/HeaderBar.vue'

const appStore = useAppStore()
const isCollapsed = computed(() => appStore.sidebarCollapsed)
</script>

<template>
  <div class="layout-container">
    <!-- 侧边栏 -->
    <Sidebar />

    <!-- 主内容区 -->
    <div class="app-main" :class="{ collapsed: isCollapsed }">
      <!-- 顶部栏 -->
      <HeaderBar />

      <!-- 内容区域 -->
      <div class="content-shell">
        <router-view />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.layout-container {
  height: 100%;
  display: flex;
}

.app-main {
  flex: 1;
  margin-left: $sidebar-width;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s ease;

  &.collapsed {
    margin-left: $sidebar-collapsed-width;
  }
}

.content-shell {
  flex: 1;
  padding: 20px;
  background-color: $bg-page;
  overflow-y: auto;
}
</style>
