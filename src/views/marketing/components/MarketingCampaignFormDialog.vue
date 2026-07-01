<script setup>
/**
 * MarketingCampaignFormDialog — 营销活动新建/编辑对话框
 */
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  campaign: { type: Object, default: null },
  saving: { type: Boolean, default: false },
  options: { type: Object, default: () => ({ types: [], statuses: [], channels: [], owners: [] }) }
})

const emit = defineEmits(['update:modelValue', 'save'])

const dialogVisible = ref(false)
const formRef = ref(null)
const isEdit = ref(false)

const form = ref({
  name: '',
  type: '',
  status: 'planning',
  channel: '',
  ownerId: '',
  budget: '',
  actualCost: '',
  targetLeadCount: '',
  startDate: '',
  endDate: '',
  description: ''
})

const rules = {
  name: [
    { required: true, message: '请输入活动名称', trigger: 'blur' },
    { max: 100, message: '活动名称不能超过 100 个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择活动类型', trigger: 'change' }
  ],
  channel: [
    { required: true, message: '请选择营销渠道', trigger: 'change' }
  ]
}

watch(() => props.modelValue, (val) => {
  dialogVisible.value = val
  if (val) {
    isEdit.value = !!props.campaign
    if (props.campaign) {
      form.value = {
        name: props.campaign.name || '',
        type: props.campaign.type || '',
        status: props.campaign.status || 'planning',
        channel: props.campaign.channel || '',
        ownerId: props.campaign.ownerId || '',
        budget: props.campaign.budget ?? '',
        actualCost: props.campaign.actualCost ?? '',
        targetLeadCount: props.campaign.targetLeadCount ?? '',
        startDate: props.campaign.startDate || '',
        endDate: props.campaign.endDate || '',
        description: props.campaign.description || ''
      }
    } else {
      form.value = { name: '', type: '', status: 'planning', channel: '', ownerId: '', budget: '', actualCost: '', targetLeadCount: '', startDate: '', endDate: '', description: '' }
    }
    if (formRef.value) formRef.value.clearValidate()
  }
})

function handleClose() {
  if (props.saving) return
  emit('update:modelValue', false)
}

async function handleSave() {
  if (!formRef.value) return
  try { await formRef.value.validate() } catch { return }
  emit('save', { ...form.value })
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑活动' : '新建活动'"
    width="680px"
    :close-on-click-modal="false"
    :before-close="handleClose"
    destroy-on-close
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" size="small">
      <el-form-item label="活动名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入活动名称" maxlength="100" show-word-limit />
      </el-form-item>

      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="活动类型" prop="type">
            <el-select v-model="form.type" placeholder="请选择" style="width: 100%">
              <el-option v-for="t in options.types" :key="t.value" :label="t.label" :value="t.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="营销渠道" prop="channel">
            <el-select v-model="form.channel" placeholder="请选择" style="width: 100%">
              <el-option v-for="c in options.channels" :key="c.value" :label="c.label" :value="c.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="状态">
            <el-select v-model="form.status" placeholder="请选择" style="width: 100%">
              <el-option v-for="s in options.statuses" :key="s.value" :label="s.label" :value="s.value" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="预算">
            <el-input-number v-model="form.budget" :min="0" :step="10000" style="width: 100%" placeholder="元" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="实际成本">
            <el-input-number v-model="form.actualCost" :min="0" :step="10000" style="width: 100%" placeholder="元" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="目标线索数">
            <el-input-number v-model="form.targetLeadCount" :min="0" :step="100" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="开始日期">
            <el-date-picker v-model="form.startDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DDTHH:mm:ss.SSSZ" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="结束日期">
            <el-date-picker v-model="form.endDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DDTHH:mm:ss.SSSZ" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="负责人">
        <el-select v-model="form.ownerId" placeholder="可选" clearable filterable style="width: 100%">
          <el-option v-for="o in options.owners" :key="o.id" :label="o.name" :value="o.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="描述">
        <el-input v-model="form.description" type="textarea" :rows="3" placeholder="活动描述（可选）" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose" :disabled="saving">取消</el-button>
      <el-button type="primary" @click="handleSave" :loading="saving">{{ isEdit ? '保存' : '创建' }}</el-button>
    </template>
  </el-dialog>
</template>
