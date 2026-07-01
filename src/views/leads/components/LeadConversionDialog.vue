<script setup>
/**
 * LeadConversionDialog — 线索转化客户对话框
 *
 * 功能：
 * - 填写客户信息（预填线索数据）
 * - 提交转化 POST /api/leads/:id/convert
 */
import { ref, watch, computed } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
  lead: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'convert'])

const dialogVisible = ref(false)
const formRef = ref(null)
const form = ref({
  customerName: '',
  industry: '',
  level: 'regular',
  contactName: '',
  contactPhone: '',
  contactTitle: '',
  contactEmail: '',
  description: ''
})

const rules = {
  customerName: [
    { required: true, message: '客户名称不能为空', trigger: 'blur' },
    { max: 50, message: '客户名称不能超过 50 个字符', trigger: 'blur' }
  ],
  contactPhone: [
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '请输入正确的手机号',
      trigger: 'blur'
    }
  ]
}

const levels = [
  { value: 'platinum', label: '铂金' },
  { value: 'gold', label: '金' },
  { value: 'silver', label: '银' },
  { value: 'regular', label: '普通' }
]

const industries = [
  '互联网/IT', '金融/银行', '医疗健康', '教育培训',
  '制造业', '零售电商', '房地产', '物流运输',
  '能源环保', '文化传媒'
]

watch(() => props.modelValue, (val) => {
  dialogVisible.value = val
  if (val && props.lead) {
    form.value = {
      customerName: props.lead.company || props.lead.name || '',
      industry: '',
      level: 'regular',
      contactName: props.lead.name || '',
      contactPhone: props.lead.phone || '',
      contactTitle: '',
      contactEmail: props.lead.email || '',
      description: ''
    }
    if (formRef.value) formRef.value.clearValidate()
  }
})

const titlePrefix = computed(() => {
  return props.lead?.name ? `"${props.lead.name}"` : ''
})

function handleClose() {
  if (props.saving) return
  emit('update:modelValue', false)
}

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    emit('convert', { ...form.value })
  } catch {
    // validation failed
  }
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="`线索转化客户 - ${titlePrefix}`"
    width="600px"
    :close-on-click-modal="false"
    :before-close="handleClose"
  >
    <el-form ref="formRef" :model="form" label-width="90px" size="small" :rules="rules">
      <el-divider content-position="left">客户信息</el-divider>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="客户名称" prop="customerName">
            <el-input v-model="form.customerName" placeholder="请输入客户名称" maxlength="50" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="行业" prop="industry">
            <el-select v-model="form.industry" placeholder="请选择行业" clearable filterable style="width: 100%">
              <el-option v-for="ind in industries" :key="ind" :label="ind" :value="ind" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="客户级别" prop="level">
            <el-select v-model="form.level" placeholder="请选择级别" style="width: 100%">
              <el-option v-for="l in levels" :key="l.value" :label="l.label" :value="l.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="描述">
            <el-input v-model="form.description" type="textarea" :rows="2" placeholder="备注信息（可选）" maxlength="200" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">联系人信息</el-divider>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="联系人" prop="contactName">
            <el-input v-model="form.contactName" placeholder="联系人姓名" maxlength="20" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="联系电话" prop="contactPhone">
            <el-input v-model="form.contactPhone" placeholder="手机号" maxlength="11" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="职位" prop="contactTitle">
            <el-input v-model="form.contactTitle" placeholder="职位（可选）" maxlength="20" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="邮箱" prop="contactEmail">
            <el-input v-model="form.contactEmail" placeholder="邮箱（可选）" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <el-button @click="handleClose" :disabled="saving">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="saving">确认转化</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.el-divider { margin: 16px 0; }
</style>
