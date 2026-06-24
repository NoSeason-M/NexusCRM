<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, default: '' },
  value: { type: [String, Number], default: '' },
  description: { type: String, default: '' },
  tone: { type: String, default: 'primary' }
})

const toneStyle = computed(() => {
  const map = {
    primary: {
      bg: 'rgba(64, 158, 255, 0.08)',
      iconBg: 'rgba(64, 158, 255, 0.12)',
      color: '#409eff',
      border: '#d9ecff'
    },
    success: {
      bg: 'rgba(103, 194, 58, 0.08)',
      iconBg: 'rgba(103, 194, 58, 0.12)',
      color: '#67c23a',
      border: '#e1f3d8'
    },
    warning: {
      bg: 'rgba(230, 162, 60, 0.08)',
      iconBg: 'rgba(230, 162, 60, 0.12)',
      color: '#e6a23c',
      border: '#faecd8'
    },
    danger: {
      bg: 'rgba(245, 108, 108, 0.08)',
      iconBg: 'rgba(245, 108, 108, 0.12)',
      color: '#f56c6c',
      border: '#fde2e2'
    },
    info: {
      bg: 'rgba(144, 147, 153, 0.08)',
      iconBg: 'rgba(144, 147, 153, 0.12)',
      color: '#909399',
      border: '#e9e9eb'
    }
  }
  return map[props.tone] || map.primary
})
</script>

<template>
  <div
    class="metric-card"
    :style="{ backgroundColor: toneStyle.bg, borderColor: toneStyle.border }"
  >
    <div class="metric-card__header">
      <span class="metric-card__label">{{ label }}</span>
    </div>
    <div class="metric-card__body">
      <span class="metric-card__value" :style="{ color: toneStyle.color }">
        {{ value }}
      </span>
    </div>
    <div v-if="description" class="metric-card__footer">
      <span class="metric-card__desc">{{ description }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.metric-card {
  display: flex;
  flex-direction: column;
  padding: 20px 24px;
  border-radius: 8px;
  border: 1px solid;
  min-width: 0;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
}

.metric-card__header {
  margin-bottom: 8px;
}

.metric-card__label {
  font-size: 14px;
  color: $text-secondary;
  font-weight: 500;
}

.metric-card__body {
  margin-bottom: 4px;
}

.metric-card__value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.metric-card__footer {
  min-height: 20px;
}

.metric-card__desc {
  font-size: 12px;
  color: $text-placeholder;
}
</style>
