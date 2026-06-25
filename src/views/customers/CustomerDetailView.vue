<script setup>
/**
 * CustomerDetailView — 客户详情页
 *
 * 功能：
 * - 客户基本信息展示
 * - 负责人信息展示与变更
 * - 联系人信息展示
 * - 跟进时间线
 * - 新增跟进记录
 */
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCustomer, createFollowRecord, updateCustomerOwner, getCustomerFilterOptions } from '@/api/customer'
import { useUserStore } from '@/stores/user'
import { formatDate } from '@/utils/format'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  ChatDotSquare,
  Edit,
  PhoneFilled,
  Message,
  UserFilled,
  Promotion,
} from '@element-plus/icons-vue'
import FollowFormDialog from './FollowFormDialog.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// ─── 数据 ───
const customer = ref(null)
const loading = ref(true)
const errorMessage = ref('')

// 负责人相关
const ownerVisible = ref(false)
const ownerSaving = ref(false)
const selectedOwnerId = ref('')
const owners = ref([])

// 跟进相关
const followVisible = ref(false)
const followSaving = ref(false)

// ─── 状态/级别映射 ───
const statusMap = {
  active: { label: '活跃', type: 'success' },
  potential: { label: '潜在', type: 'primary' },
  inactive: { label: '已流失', type: 'info' },
  at_risk: { label: '风险', type: 'danger' },
  lead: { label: '线索', type: 'warning' }
}

const levelMap = {
  platinum: { label: '铂金', type: 'danger' },
  gold: { label: '黄金', type: 'warning' },
  silver: { label: '白银', type: '' },
  regular: { label: '普通', type: 'info' }
}

// 跟进方式映射
const followMethodMap = {
  phone: { label: '电话', icon: PhoneFilled },
  visit: { label: '拜访', icon: UserFilled },
  wechat: { label: '微信', icon: Message },
  email: { label: '邮件', icon: Promotion }
}

// 权限检查
const canFollow = computed(() => userStore.hasPermission('customer:follow'))
const canAssign = computed(() => userStore.hasPermission('customer:assign'))

/**
 * 加载客户详情
 */
async function loadCustomer() {
  const id = route.params.id
  if (!id) {
    errorMessage.value = '缺少客户 ID'
    loading.value = false
    return
  }

  loading.value = true
  errorMessage.value = ''
  try {
    const res = await getCustomer(id)
    customer.value = res.data
  } catch (e) {
    if (e.response?.status === 404) {
      errorMessage.value = '客户不存在'
    } else {
      errorMessage.value = e.response?.data?.message || e.message || '加载失败'
    }
    customer.value = null
  } finally {
    loading.value = false
  }
}

/**
 * 加载负责人选项
 */
async function loadOwners() {
  try {
    const res = await getCustomerFilterOptions()
    owners.value = res.data.owners || []
  } catch {
    // 不影响主体
  }
}

/** 返回列表 */
function goBack() {
  router.push('/customers')
}

// ──── 跟进操作 ────

async function handleFollowSave(formData) {
  followSaving.value = true
  try {
    await createFollowRecord(route.params.id, formData)
    ElMessage.success('跟进记录已添加')
    followVisible.value = false
    // 刷新详情（获取最新跟进列表和 lastFollowAt）
    await loadCustomer()
  } catch (e) {
    const msg = e.response?.data?.message || e.message || '操作失败'
    ElMessage.error(msg)
  } finally {
    followSaving.value = false
  }
}

// ──── 负责人变更 ────

function openOwnerDialog() {
  selectedOwnerId.value = customer.value?.ownerId || ''
  ownerVisible.value = true
}

async function handleOwnerSave() {
  if (!selectedOwnerId.value) {
    ElMessage.warning('请选择新的负责人')
    return
  }
  if (selectedOwnerId.value === customer.value?.ownerId) {
    ElMessage.info('负责人未变更')
    ownerVisible.value = false
    return
  }

  ownerSaving.value = true
  try {
    await updateCustomerOwner(route.params.id, selectedOwnerId.value)
    ElMessage.success('负责人已变更')
    ownerVisible.value = false
    await loadCustomer()
  } catch (e) {
    const msg = e.response?.data?.message || e.message || '操作失败'
    ElMessage.error(msg)
  } finally {
    ownerSaving.value = false
  }
}

onMounted(() => {
  loadCustomer()
  loadOwners()
})
</script>

<template>
  <div class="customer-detail">
    <!-- 页头 -->
    <div class="page-card">
      <div class="page-card__header detail-header">
        <div class="header-left">
          <el-button text :icon="ArrowLeft" @click="goBack">
            返回列表
          </el-button>
          <span class="title" v-if="customer">{{ customer.name }}</span>
          <span class="loading-title" v-else-if="loading">加载中...</span>
        </div>
        <div class="header-actions">
          <el-button
            v-if="customer && canFollow"
            type="primary"
            :icon="ChatDotSquare"
            @click="followVisible = true"
          >
            新增跟进
          </el-button>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-section">
      <div class="page-card"><div class="skeleton-block" style="height: 200px" /></div>
    </div>

    <!-- 错误/404 状态 -->
    <div v-else-if="errorMessage" class="page-card">
      <div class="error-section">
        <el-result
          icon="error"
          title="加载失败"
          :sub-title="errorMessage"
        >
          <template #extra>
            <el-button type="primary" @click="goBack">返回列表</el-button>
          </template>
        </el-result>
      </div>
    </div>

    <!-- 正常内容 -->
    <template v-if="customer && !loading && !errorMessage">
      <!-- 基本信息 -->
      <div class="page-card">
        <div class="page-card__header">
          <span class="section-title">基本信息</span>
        </div>
        <div class="page-card__body">
          <el-descriptions :column="3" border size="small">
            <el-descriptions-item label="客户名称" :span="1">
              {{ customer.name }}
            </el-descriptions-item>
            <el-descriptions-item label="行业" :span="1">
              {{ customer.industry || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="来源" :span="1">
              {{ customer.source || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="客户级别" :span="1">
              <el-tag
                :type="levelMap[customer.level]?.type || 'info'"
                size="small"
                effect="plain"
              >
                {{ levelMap[customer.level]?.label || customer.level }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="状态" :span="1">
              <el-tag
                :type="statusMap[customer.status]?.type || 'info'"
                size="small"
              >
                {{ statusMap[customer.status]?.label || customer.status }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="最后跟进" :span="1">
              {{ formatDate(customer.lastFollowAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="地区" :span="2">
              {{ [customer.province, customer.city, customer.address].filter(Boolean).join(' ') || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="创建时间" :span="1">
              {{ formatDate(customer.createdAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="更新时间" :span="1">
              {{ formatDate(customer.updatedAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="描述" :span="3">
              {{ customer.description || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>

      <!-- 负责人 -->
      <div class="page-card">
        <div class="page-card__header">
          <span class="section-title">负责人</span>
          <el-button
            v-if="canAssign"
            type="primary"
            size="small"
            text
            :icon="Edit"
            @click="openOwnerDialog"
          >
            变更
          </el-button>
        </div>
        <div class="page-card__body">
          <div class="owner-info" v-if="customer.owner">
            <div class="owner-avatar">
              <el-avatar :size="48">
                {{ customer.owner.name?.charAt(0) || '?' }}
              </el-avatar>
            </div>
            <div class="owner-details">
              <div class="owner-name">{{ customer.owner.name }}</div>
              <div class="owner-meta">
                <span class="owner-role">{{ customer.owner.roleName }}</span>
                <span v-if="customer.owner.email">{{ customer.owner.email }}</span>
                <span v-if="customer.owner.phone">{{ customer.owner.phone }}</span>
              </div>
            </div>
          </div>
          <span v-else class="text-muted">暂未分配负责人</span>
        </div>
      </div>

      <!-- 联系人 -->
      <div class="page-card">
        <div class="page-card__header">
          <span class="section-title">联系人</span>
        </div>
        <div class="page-card__body">
          <el-table :data="customer.contacts || []" stripe max-height="200">
            <el-table-column prop="name" label="姓名" width="120" />
            <el-table-column prop="phone" label="电话" width="140" />
            <el-table-column prop="title" label="职务" width="120" />
            <el-table-column prop="email" label="邮箱" min-width="180" />
          </el-table>
        </div>
      </div>

      <!-- 跟进时间线 -->
      <div class="page-card">
        <div class="page-card__header">
          <span class="section-title">跟进记录</span>
        </div>
        <div class="page-card__body">
          <div
            v-if="!customer.followRecords || customer.followRecords.length === 0"
            class="empty-timeline"
          >
            <el-empty description="暂无跟进记录" />
          </div>
          <div v-else class="timeline">
            <div
              v-for="(record, index) in customer.followRecords"
              :key="record.id"
              class="timeline-item"
            >
              <div class="timeline-dot">
                <el-icon :size="16">
                  <component :is="followMethodMap[record.method]?.icon || ChatDotSquare" />
                </el-icon>
              </div>
              <div
                v-if="index < customer.followRecords.length - 1"
                class="timeline-line"
              />
              <div class="timeline-content">
                <div class="timeline-header">
                  <el-tag size="small" effect="plain">
                    {{ followMethodMap[record.method]?.label || record.method }}
                  </el-tag>
                  <span class="timeline-owner">{{ record.ownerName }}</span>
                  <span class="timeline-time">{{ formatDate(record.createdAt) }}</span>
                </div>
                <div class="timeline-body">
                  {{ record.content }}
                </div>
                <div v-if="record.nextFollowAt" class="timeline-footer">
                  <span class="next-follow">
                    下次跟进：{{ formatDate(record.nextFollowAt) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 跟进弹窗 -->
    <FollowFormDialog
      v-model="followVisible"
      :saving="followSaving"
      @save="handleFollowSave"
    />

    <!-- 负责人变更弹窗 -->
    <el-dialog
      v-model="ownerVisible"
      title="变更负责人"
      width="420px"
      :close-on-click-modal="false"
    >
      <el-form label-width="80px" label-position="top">
        <el-form-item label="选择新负责人">
          <el-select
            v-model="selectedOwnerId"
            placeholder="请选择负责人"
            style="width: 100%"
          >
            <el-option
              v-for="item in owners"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ownerVisible = false">取消</el-button>
        <el-button type="primary" :loading="ownerSaving" @click="handleOwnerSave">
          {{ ownerSaving ? '保存中...' : '确认变更' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.customer-detail {
  p { color: $text-regular; }
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;

  .title {
    font-size: 18px;
    font-weight: 600;
    color: $text-primary;
  }

  .loading-title {
    font-size: 16px;
    color: $text-secondary;
  }
}

.header-actions {
  display: flex;
  gap: 8px;
}

.page-card + .page-card {
  margin-top: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: $text-primary;
}

// 加载骨架
.loading-section {
  .skeleton-block {
    background: linear-gradient(90deg, $border-lighter 25%, #e8e8e8 50%, $border-lighter 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
    border-radius: 4px;
  }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

// 负责人
.owner-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.owner-details {
  .owner-name {
    font-size: 16px;
    font-weight: 500;
    color: $text-primary;
    margin-bottom: 4px;
  }

  .owner-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    font-size: 13px;
    color: $text-secondary;

    .owner-role {
      color: $brand-color;
    }
  }
}

.text-muted {
  color: $text-secondary;
}

// 时间线
.timeline {
  position: relative;
  padding-left: 32px;
}

.timeline-item {
  position: relative;
  padding-bottom: 24px;

  &:last-child {
    padding-bottom: 0;
  }
}

.timeline-dot {
  position: absolute;
  left: -32px;
  top: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: $bg-page;
  border: 2px solid $brand-color;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $brand-color;
  z-index: 1;
}

.timeline-line {
  position: absolute;
  left: -19px;
  top: 28px;
  bottom: 0;
  width: 2px;
  background: $border-lighter;
}

.timeline-content {
  background: $bg-page;
  border-radius: 8px;
  padding: 12px 16px;
  border: 1px solid $border-lighter;
}

.timeline-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.timeline-owner {
  font-size: 13px;
  font-weight: 500;
  color: $text-primary;
}

.timeline-time {
  font-size: 12px;
  color: $text-secondary;
}

.timeline-body {
  font-size: 14px;
  color: $text-regular;
  line-height: 1.6;
  white-space: pre-wrap;
}

.timeline-footer {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid $border-lighter;
}

.next-follow {
  font-size: 12px;
  color: $warning-color;
}

.empty-timeline {
  padding: 20px 0;
}
</style>
