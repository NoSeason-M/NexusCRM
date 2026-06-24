<script setup>
import { ref, onMounted } from 'vue'
import { getRecentFollows } from '@/api/dashboard'
import { formatDate } from '@/utils/format'
import ActivityFormDialog from './ActivityFormDialog.vue'

const follows = ref([])
const loading = ref(false)
const error = ref('')

const dialogVisible = ref(false)
const editingFollow = ref(null)

async function fetchFollows() {
  loading.value = true
  error.value = ''
  try {
    const res = await getRecentFollows()
    follows.value = res.data
  } catch (e) {
    error.value = e.response?.data?.message || e.message || '加载失败'
  } finally {
    loading.value = false
  }
}

function handleAdd() {
  editingFollow.value = null
  dialogVisible.value = true
}

function handleEdit(follow) {
  editingFollow.value = { ...follow }
  dialogVisible.value = true
}

function onDialogSuccess() {
  dialogVisible.value = false
  editingFollow.value = null
  fetchFollows()
}

const methodConfig = {
  call: { label: '电话', type: 'primary' },
  email: { label: '邮件', type: 'success' },
  meeting: { label: '面谈', type: 'warning' },
  other: { label: '其他', type: 'info' }
}

onMounted(() => {
  fetchFollows()
})
</script>

<template>
  <div class="follow-list-card">
    <div class="follow-list-header">
      <h3 class="follow-list-title">
        <el-icon><ChatLineSquare /></el-icon>
        近期跟进
      </h3>
      <el-button type="primary" size="small" @click="handleAdd">
        <el-icon><Plus /></el-icon> 新增跟进
      </el-button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="follow-loading">
      <div class="spinner-sm" />
      <span>加载中...</span>
    </div>

    <!-- 错误状态 -->
    <el-alert
      v-else-if="error"
      :title="error"
      type="error"
      show-icon
      closable
      class="follow-error"
    />

    <!-- 空数据 -->
    <div v-else-if="follows.length === 0" class="follow-empty">
      <el-empty :image-size="60" description="暂无跟进记录" />
    </div>

    <!-- 跟进列表 -->
    <div v-else class="follow-items">
      <div
        v-for="item in follows"
        :key="item.id"
        class="follow-item"
        @click="handleEdit(item)"
      >
        <div class="follow-top">
          <div class="follow-avatar">{{ item.customerName?.charAt(0) || '?' }}</div>
          <div class="follow-info">
            <div class="follow-customer-row">
              <span class="follow-customer">{{ item.customerName }}</span>
              <el-tag :type="methodConfig[item.method]?.type" size="small" effect="plain">
                {{ methodConfig[item.method]?.label }}
              </el-tag>
            </div>
            <div class="follow-content">{{ item.content }}</div>
          </div>
        </div>
        <div class="follow-meta">
          <span class="follow-owner">
            <el-icon><User /></el-icon>
            {{ item.ownerName }}
          </span>
          <span v-if="item.nextFollowAt" class="follow-next">
            <el-icon><Clock /></el-icon>
            下次跟进 {{ formatDate(item.nextFollowAt) }}
          </span>
          <span class="follow-time">{{ formatDate(item.createdAt) }}</span>
        </div>
      </div>
    </div>

    <ActivityFormDialog
      v-model:visible="dialogVisible"
      type="follow"
      :edit-data="editingFollow"
      @success="onDialogSuccess"
    />
  </div>
</template>

<style lang="scss" scoped>
.follow-list-card {
  background: $bg-white;
  border-radius: $border-radius-large;
  padding: 20px;
}

.follow-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.follow-list-title {
  font-size: 16px;
  font-weight: 600;
  color: $text-primary;
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
}

.follow-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px;
  color: $text-secondary;
  font-size: 14px;
}

.spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid $border-lighter;
  border-top-color: $brand-color;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.follow-error {
  margin-bottom: 12px;
}

.follow-empty {
  padding: 20px 0;
}

.follow-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.follow-item {
  padding: 14px 16px;
  border: 1px solid $border-lighter;
  border-radius: $border-radius-medium;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  flex-direction: column;
  gap: 8px;

  &:hover {
    background-color: $bg-page;
  }
}

.follow-top {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.follow-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, $brand-color 0%, #66b1ff 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.follow-info {
  flex: 1;
  min-width: 0;
}

.follow-customer-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.follow-customer {
  font-size: 14px;
  font-weight: 600;
  color: $text-primary;
}

.follow-content {
  font-size: 13px;
  color: $text-regular;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.follow-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: $text-secondary;
  padding-left: 48px;
}

.follow-owner,
.follow-next,
.follow-time {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
