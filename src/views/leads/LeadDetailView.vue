<script setup>
/**
 * LeadDetailView — 销售线索详情页
 *
 * 功能：
 * - 基本信息展示
 * - 跟进记录时间线
 * - 添加跟进（lead:follow）
 */
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getLeadDetail, createLeadFollow, convertLead } from '@/api/lead'
import { useUserStore } from '@/stores/user'
import { formatDate } from '@/utils/format'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Plus, Switch } from '@element-plus/icons-vue'
import LeadFollowFormDialog from './components/LeadFollowFormDialog.vue'
import LeadConversionDialog from './components/LeadConversionDialog.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const lead = ref(null)
const loading = ref(true)
const errorMessage = ref('')

const statusMap = {
  new: { label: '新线索', type: 'info' },
  contacted: { label: '已联系', type: 'primary' },
  qualified: { label: '已确认', type: 'warning' },
  converted: { label: '已转化', type: 'success' },
  closed: { label: '已关闭', type: 'danger' }
}
const intentionMap = { high: { label: '高意向', type: 'danger' }, medium: { label: '中意向', type: 'warning' }, low: { label: '低意向', type: 'info' } }
const methodLabels = { phone: '电话', wechat: '微信', visit: '拜访', email: '邮件' }

const canFollow = computed(() => userStore.hasPermission('lead:follow'))
const canConvert = computed(() => userStore.hasPermission('lead:convert'))
const followDialogVisible = ref(false)
const followSaving = ref(false)
const conversionDialogVisible = ref(false)
const conversionSaving = ref(false)

async function loadDetail() {
  const id = route.params.id
  if (!id) { errorMessage.value = '缺少线索 ID'; loading.value = false; return }
  loading.value = true; errorMessage.value = ''
  try {
    const res = await getLeadDetail(id)
    lead.value = res.data
  } catch (e) {
    if (e.response?.status === 404) errorMessage.value = '线索不存在'
    else errorMessage.value = e.response?.data?.message || e.message || '加载失败'
    lead.value = null
  } finally { loading.value = false }
}

function goBack() { router.push('/leads') }

function openFollow() { followDialogVisible.value = true }

async function handleFollow(formData) {
  followSaving.value = true
  try {
    await createLeadFollow(route.params.id, formData)
    ElMessage.success('跟进记录已添加')
    followDialogVisible.value = false
    await loadDetail()
  } catch (e) { ElMessage.error(e.response?.data?.message || e.message || '操作失败') }
  finally { followSaving.value = false }
}

function openConversion() { conversionDialogVisible.value = true }

async function handleConversion(formData) {
  conversionSaving.value = true
  try {
    const res = await convertLead(route.params.id, formData)
    ElMessage.success('线索转化成功')
    conversionDialogVisible.value = false
    await loadDetail()
  } catch (e) { ElMessage.error(e.response?.data?.message || e.message || '转化失败') }
  finally { conversionSaving.value = false }
}

onMounted(loadDetail)
</script>

<template>
  <div class="lead-detail">
    <div class="page-card">
      <div class="page-card__header detail-header">
        <div class="header-left">
          <el-button text :icon="ArrowLeft" @click="goBack">返回列表</el-button>
          <span class="title" v-if="lead">{{ lead.name }}</span>
          <span class="loading-title" v-else-if="loading">加载中...</span>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-section">
      <div class="page-card"><div class="skeleton-block" style="height: 200px" /></div>
    </div>

    <div v-else-if="errorMessage" class="page-card">
      <div class="error-section">
        <el-result icon="error" title="加载失败" :sub-title="errorMessage">
          <template #extra><el-button type="primary" @click="goBack">返回列表</el-button></template>
        </el-result>
      </div>
    </div>

    <template v-if="lead && !loading && !errorMessage">
      <div class="page-card">
        <div class="page-card__header">
          <span class="section-title">基本信息</span>
          <div class="header-tags">
            <el-tag :type="lead.statusType || 'info'" size="default" effect="dark">{{ lead.statusLabel }}</el-tag>
            <el-tag v-if="lead.intentionType" :type="lead.intentionType" size="small" effect="plain">{{ lead.intentionLabel }}</el-tag>
            <el-button v-if="canConvert && lead.status !== 'converted' && lead.status !== 'closed'" type="success" size="small" :icon="Switch" @click="openConversion" style="margin-left: 8px">转化客户</el-button>
          </div>
        </div>
        <div class="page-card__body">
          <el-descriptions :column="3" border size="small">
            <el-descriptions-item label="联系人">{{ lead.name }}</el-descriptions-item>
            <el-descriptions-item label="公司">{{ lead.company || '-' }}</el-descriptions-item>
            <el-descriptions-item label="电话">{{ lead.phone || '-' }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ lead.email || '-' }}</el-descriptions-item>
            <el-descriptions-item label="来源">{{ lead.sourceLabel }}</el-descriptions-item>
            <el-descriptions-item label="意向">{{ lead.intentionLabel }}</el-descriptions-item>
            <el-descriptions-item label="负责人">
              <span v-if="lead.ownerName">{{ lead.ownerName }}</span>
              <el-tag v-else type="info" size="small">未分配</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="关联活动">{{ lead.campaignName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="关联客户">{{ lead.customerName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="最近跟进">{{ lead.lastFollowAt ? formatDate(lead.lastFollowAt) : '未跟进' }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDate(lead.createdAt) }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ formatDate(lead.updatedAt) }}</el-descriptions-item>
            <el-descriptions-item label="转化时间" v-if="lead.convertedAt">{{ formatDate(lead.convertedAt) }}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="3">{{ lead.remark || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </div>

      <!-- 跟进记录 -->
      <div class="page-card">
        <div class="page-card__header">
          <span class="section-title">跟进记录</span>
          <el-button v-if="canFollow" type="primary" size="small" :icon="Plus" @click="openFollow">添加跟进</el-button>
        </div>
        <div class="page-card__body">
          <div class="timeline" v-if="lead.followRecords && lead.followRecords.length > 0">
            <div v-for="r in lead.followRecords" :key="r.id" class="timeline-item">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <el-tag size="small" effect="plain">{{ methodLabels[r.method] || r.method }}</el-tag>
                  <span class="timeline-operator">{{ r.ownerName }}</span>
                  <span class="timeline-time">{{ formatDate(r.createdAt) }}</span>
                </div>
                <div class="timeline-body">{{ r.content }}</div>
                <div class="timeline-next" v-if="r.nextFollowAt">下次跟进：{{ formatDate(r.nextFollowAt) }}</div>
              </div>
            </div>
          </div>
          <div v-else class="empty-records">
            <el-empty description="暂无跟进记录" :image-size="80" />
          </div>
        </div>
      </div>
    </template>

    <LeadFollowFormDialog v-model="followDialogVisible" :saving="followSaving" @save="handleFollow" />
    <LeadConversionDialog v-model="conversionDialogVisible" :saving="conversionSaving" :lead="lead" @convert="handleConversion" />
  </div>
</template>

<style lang="scss" scoped>
.lead-detail {
  p { color: $text-regular; }
}
.detail-header { display: flex; align-items: center; justify-content: space-between; }
.header-left { display: flex; align-items: center; gap: 12px; }
.header-left .title { font-size: 16px; font-weight: 600; color: $text-primary; }
.header-left .loading-title { font-size: 16px; color: $text-secondary; }
.header-tags { display: flex; align-items: center; gap: 8px; }
.section-title { font-size: 15px; font-weight: 600; color: $text-primary; }
.loading-section .skeleton-block { background: $bg-page; border-radius: 4px; }
.error-section { display: flex; justify-content: center; padding: 40px 0; }

.timeline { position: relative; padding-left: 24px; }
.timeline::before { content: ''; position: absolute; left: 8px; top: 4px; bottom: 4px; width: 1px; background: $border-lighter; }
.timeline-item { position: relative; padding-bottom: 20px; }
.timeline-item:last-child { padding-bottom: 0; }
.timeline-dot { position: absolute; left: -20px; top: 4px; width: 16px; height: 16px; border-radius: 50%; background: $brand-color; z-index: 1; }
.timeline-content { background: $bg-page; border-radius: 6px; padding: 10px 14px; }
.timeline-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 13px; }
.timeline-operator { font-weight: 500; color: $text-primary; }
.timeline-time { font-size: 12px; color: $text-secondary; margin-left: auto; }
.timeline-body { font-size: 13px; color: $text-regular; }
.timeline-next { font-size: 12px; color: $warning-color; margin-top: 4px; }
.empty-records { display: flex; justify-content: center; padding: 20px 0; }
</style>
