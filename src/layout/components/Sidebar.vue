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
  Setting,
  UserFilled,
  Avatar,
  Menu,
  List
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
  Setting,
  UserFilled,
  Avatar,
  Menu,
  List
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

    <!-- 动态菜单列表（支持子菜单） -->
    <el-menu
      :default-active="route.path"
      :collapse="isCollapsed"
      :router="false"
      background-color="#304156"
      text-color="#bfcbd9"
      active-text-color="#409eff"
      class="sidebar-menu"
    >
      <template v-for="item in menus" :key="item.path">
        <!-- 有子菜单 -->
        <el-sub-menu v-if="item.children && item.children.length" :index="item.path">
          <template #title>
            <el-icon v-if="item.icon">
              <component :is="iconMap[item.icon]" />
            </el-icon>
            <span>{{ item.title }}</span>
          </template>
          <el-menu-item
            v-for="child in item.children"
            :key="child.path"
            :index="child.path"
            @click="handleMenuClick(child)"
          >
            <el-icon v-if="child.icon">
              <component :is="iconMap[child.icon]" />
            </el-icon>
            <template #title>
              <span>{{ child.title }}</span>
            </template>
          </el-menu-item>
        </el-sub-menu>

        <!-- 无子菜单 -->
        <el-menu-item
          v-else
          :index="item.path"
          :disabled="item.disabled"
          @click="handleMenuClick(item)"
        >
          <el-icon v-if="item.icon">
            <component :is="iconMap[item.icon]" />
          </el-icon>
          <template #title>
            <span>{{ item.title }}</span>
          </template>
        </el-menu-item>
      </template>
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
