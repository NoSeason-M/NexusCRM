<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const breadcrumbs = computed(() => {
  // 从路由 meta 中获取标题
  const title = route.meta?.title
  if (!title) return []
  return [
    { name: 'NexusCRM', path: '/' },
    { name: title, path: route.path }
  ]
})
</script>

<template>
  <el-breadcrumb class="breadcrumb" separator="/">
    <el-breadcrumb-item
      v-for="(crumb, index) in breadcrumbs"
      :key="index"
      :to="index < breadcrumbs.length - 1 ? crumb.path : undefined"
    >
      {{ crumb.name }}
    </el-breadcrumb-item>
  </el-breadcrumb>
</template>

<style lang="scss" scoped>
.breadcrumb {
  display: inline-block;
  font-size: 14px;
  line-height: 50px;
  margin-left: 16px;
}
</style>
