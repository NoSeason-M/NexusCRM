<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores'
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'
import {
  Odometer,
  User,
  TrendCharts,
  Document,
  Ticket,
  Setting
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()

const { menus } = storeToRefs(userStore)
const isCollapsed = computed(() => appStore.sidebarCollapsed)

const iconMap = {
  Odometer,
  User,
  TrendCharts,
  Document,
  Ticket,
  Setting
}

function handleMenuClick(item) {
  if (!item.disabled && item.path) {
    router.push(item.path)
  }
}
</script>

<template>
  <div class="sidebar" :class="{ collapsed: isCollapsed }">
    <!-- Logo 区域 -->
    <div class="sidebar-logo">
      <span class="logo-text" v-if="!isCollapsed">NexusCRM</span>
      <span class="logo-short" v-else>NC</span>
    </div>

    <!-- 动态菜单列表 -->
    <el-menu
      :default-active="route.path"
      :collapse="isCollapsed"
      :router="false"
      background-color="#304156"
      text-color="#bfcbd9"
      active-text-color="#409eff"
      class="sidebar-menu"
    >
      <el-menu-item
        v-for="item in menus"
        :key="item.path"
        :index="item.path"
        :disabled="item.disabled"
        @click="handleMenuClick(item)"
      >
        <el-icon>
          <component :is="iconMap[item.icon]" />
        </el-icon>
        <template #title>
          <span>{{ item.title }}</span>
        </template>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<style lang="scss" scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: $sidebar-width;
  background-color: #304156;
  transition: width 0.3s ease;
  overflow: hidden;
  z-index: 1001;

  &.collapsed {
    width: $sidebar-collapsed-width;
  }
}

.sidebar-logo {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #2b3a4a;

  .logo-text {
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    white-space: nowrap;
  }

  .logo-short {
    color: #fff;
    font-size: 16px;
    font-weight: 600;
  }
}

.sidebar-menu {
  border-right: none;
}
</style>
