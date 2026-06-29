<script setup>
/**
 * OpportunityFormDialog — 商机新增/编辑弹窗
 */
import { ref, computed, watch, onMounted } from 'vue'
import { getDashboardCustomerOptions } from '@/api/dashboard'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  opportunity: { type: Object, default: null },
  saving: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'save'])

const isEdit = computed(() => !!props.opportunity)
const title = computed(() => isEdit.value ? '编辑商机' : '新建商机')

const formRef = ref(null)
const customerOptions = ref([])
const customerLoading = ref(false)

const form = ref({
  title: '',
  customerId: '',
  ownerId: '',
  amount: '',
  stage: 'lead',
  expectedCloseDate: '',
  nextStep: '',
  description: ''
})

// 阶段选项
const stageOptions = [
  { value: 'lead', label: '初步接触' },
  { value: 'qualified', label: '需求确认' },
  { value: 'proposal', label: '方案报价' },
  { value: 'negotiation', label: '商务谈判' }
]

// 监听 opportunity 变化
watch(() => props.opportunity, (val) => {
  if (val) {
    form.value = {
      title: val.title || '',
      customerId: val.customerId || '',
      ownerId: val.ownerId || '',
      amount: val.amount || '',
      stage: val.stage || 'lead',
      expectedCloseDate: val.expectedCloseDate || '',
      nextStep: val.nextStep || '',
      description: val.description || ''
    }
  } else {
    form.value = {
      title: '',
      customerId: '',
      ownerId: '',
      amount: '',
      stage: 'lead',
      expectedCloseDate: '',
      nextStep: '',
      description: ''
    }
  }
}, { immediate: true })

watch(() => props.modelValue, (val) => {
  if (val && formRef.value) {
    formRef.value.resetFields()
    loadCustomers()
  }
})

async function loadCustomers() {
  customerLoading.value = true
  try {
    const res = await getDashboardCustomerOptions()
    customerOptions.value = res.data || []
  } catch {
    customerOptions.value = []
  } finally {
    customerLoading.value = false
  }
}

const rules = {
  title: [
    { required: true, message: '商机名称不能为空', trigger: 'blur' },
    { max: 100, message: '商机名称不能超过 100 个字符', trigger: 'blur' }
  ],
  customerId: [
    { required: true, message: '请选择客户', trigger: 'change' }
  ],
  amount: [
    { required: true, message: '请输入商机金额', trigger: 'blur' }
  ]
}

async function handleConfirm() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  emit('save', { ...form.value, amount: Number(form.value.amount) })
}

function handleCancel() {
  emit('update:modelValue', false)
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    width="680px"
    :close-on-click-modal="false"
    :before-close="handleCancel"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      label-position="top"
      size="default"
    >
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="商机名称" prop="title">
            <el-input v-model="form.title" placeholder="请输入商机名称" maxlength="100" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="关联客户" prop="customerId">
            <el-select
              v-model="form.customerId"
              placeholder="请选择客户"
              :loading="customerLoading"
              class="full-width"
              :disabled="isEdit"
            >
              <el-option
                v-for="item in customerOptions"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="商机金额" prop="amount">
            <el-input v-model="form.amount" placeholder="金额（元）" type="number" min="0">
              <template #append>元</template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="当前阶段">
            <el-select v-model="form.stage" class="full-width" :disabled="isEdit">
              <el-option
                v-for="item in stageOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="预计关闭日期">
            <el-date-picker
              v-model="form.expectedCloseDate"
              type="date"
              placeholder="选填"
              value-format="YYYY-MM-DDTHH:mm:ss.SSSZ"
              format="YYYY-MM-DD"
              style="width: 100%"
              clearable
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="负责人">
            <el-select v-model="form.ownerId" placeholder="选填" clearable class="full-width" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="下一步计划">
            <el-input v-model="form.nextStep" placeholder="下一步行动" maxlength="500" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="项目描述">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="项目背景、需求描述等"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleConfirm">
        {{ saving ? '保存中...' : '确认' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.full-width {
  width: 100%;
}
</style>
