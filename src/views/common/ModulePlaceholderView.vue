<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
const pageTitle = route.meta?.title || '功能开发中'
</script>

<template>
  <div class="placeholder">
    <div class="page-card">
      <div class="page-card__header">
        <span class="title">{{ pageTitle }}</span>
      </div>
      <div class="page-card__body">
        <div class="placeholder-content">
          <div class="placeholder-icon">🚧</div>
          <p class="placeholder-text">{{ pageTitle }}功能正在开发中</p>
          <el-tag type="info" size="small">敬请期待</el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
}

.placeholder-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.placeholder-text {
  font-size: 16px;
  color: $text-secondary;
  margin-bottom: 12px;
}
</style>
