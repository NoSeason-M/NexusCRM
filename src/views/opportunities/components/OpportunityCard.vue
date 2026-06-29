<script setup>
/**
 * OpportunityCard — 商机看板卡片
 *
 * Props:
 *   opportunity   - 商机对象（含 customerName, ownerName, stageLabel, overdue 等）
 *   canChangeStage - 是否显示阶段流转按钮（依赖 opportunity:stage 权限）
 *
 * Emits:
 *   open          - 点击卡片打开详情
 *   change-stage  - 点击阶段流转按钮（携带当前阶段）
 */
import { computed } from 'vue'
import { formatCurrency, formatPercent, formatDate } from '@/utils/format'
import {
  Top,
  Right,
  Bottom,
  UserFilled,
  Money,
  WarningFilled
} from '@element-plus/icons-vue'

const props = defineProps({
  opportunity: { type: Object, required: true },
  canChangeStage: { type: Boolean, default: false }
})

const emit = defineEmits(['open', 'change-stage'])

function handleOpen() {
  emit('open', props.opportunity.id)
}

function handleChangeStage(event) {
  if (event) event.stopPropagation()
  emit('change-stage', props.opportunity)
}

// 阶段流转按钮配置（看板卡片中简化为推进/输单）
const stageActions = computed(() => {
  const stage = props.opportunity.stage
  switch (stage) {
    case 'lead':
      return [{ stage: 'qualified', label: '推进', type: 'primary' }]
    case 'qualified':
      return [{ stage: 'proposal', label: '推进', type: 'primary' }]
    case 'proposal':
      return [{ stage: 'negotiation', label: '推进', type: 'primary' }]
    case 'negotiation':
      return [
        { stage: 'won', label: '赢单', type: 'success' },
        { stage: 'lost', label: '输单', type: 'danger' }
      ]
    default:
      return []
  }
})
</script>

<template>
  <div class="opp-card" @click="handleOpen">
    <!-- 卡片头部 -->
    <div class="card-header">
      <div class="card-title" :title="opportunity.title">{{ opportunity.title }}</div>
      <el-tag
        :type="opportunity.stage === 'won' ? 'success' : opportunity.stage === 'lost' ? 'info' : 'primary'"
        size="small"
        effect="plain"
      >
        {{ opportunity.stageLabel || opportunity.stage }}
      </el-tag>
    </div>

    <!-- 卡片主体 -->
    <div class="card-body">
      <div class="card-field">
        <span class="field-label">客户</span>
        <span class="field-value">{{ opportunity.customerName }}</span>
      </div>
      <div class="card-field">
        <span class="field-label">金额</span>
        <span class="field-value amount">{{ formatCurrency(opportunity.amount) }}</span>
      </div>
      <div class="card-field">
        <span class="field-label">概率</span>
        <span class="field-value">{{ formatPercent(opportunity.probability) }}</span>
      </div>
      <div class="card-field">
        <span class="field-label">负责人</span>
        <span class="field-value">{{ opportunity.ownerName }}</span>
      </div>
      <div class="card-field">
        <span class="field-label">预计关闭</span>
        <span class="field-value" :class="{ overdue: opportunity.overdue }">
          <el-icon v-if="opportunity.overdue" :size="12" style="vertical-align: middle; margin-right: 2px;">
            <WarningFilled />
          </el-icon>
          {{ formatDate(opportunity.expectedCloseDate) }}
        </span>
      </div>
      <div v-if="opportunity.nextStep" class="card-field next-step">
        <span class="field-label">下一步</span>
        <span class="field-value next-step-text">{{ opportunity.nextStep }}</span>
      </div>
    </div>

    <!-- 卡片尾部：阶段推进按钮 -->
    <div v-if="canChangeStage && stageActions.length > 0" class="card-footer" @click.stop>
      <el-button
        v-for="action in stageActions"
        :key="action.stage"
        :type="action.type"
        size="small"
        plain
        @click="handleChangeStage"
      >
        {{ action.label }}
      </el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.opp-card {
  background: $bg-white;
  border: 1px solid $border-lighter;
  border-radius: 8px;
  padding: 14px;
  cursor: pointer;
  transition: box-shadow 0.2s ease, transform 0.15s ease;
  display: flex;
  flex-direction: column;
  gap: 8px;

  &:hover {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
  }
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: $text-primary;
  line-height: 1.4;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.card-field {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.field-label {
  color: $text-secondary;
  flex-shrink: 0;
  min-width: 48px;
}

.field-value {
  color: $text-regular;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &.amount {
    font-weight: 600;
    color: $text-primary;
  }

  &.overdue {
    color: $danger-color;
    font-weight: 500;
  }
}

.next-step-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-footer {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
  padding-top: 4px;
  border-top: 1px solid $border-extra-light;
}
</style>
