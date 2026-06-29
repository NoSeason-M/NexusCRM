<script setup>
/**
 * ContractFormDialog — 合同新增/编辑弹窗
 */
import { ref, computed, watch, onMounted } from 'vue'
import { getDashboardCustomerOptions } from '@/api/dashboard'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  contract: { type: Object, default: null },
  saving: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'save'])

const isEdit = computed(() => !!props.contract)
const title = computed(() => isEdit.value ? '编辑合同' : '新建合同')

const formRef = ref(null)
const customerOptions = ref([])
const opportunityOptions = ref([])
const ownerOptions = ref([])
const customerLoading = ref(false)

const form = ref({
  name: '',
  customerId: '',
  opportunityId: '',
  ownerId: '',
  amount: '',
  startDate: '',
  endDate: '',
  description: ''
})

// 监听 contract 变化
watch(() => props.contract, (val) => {
  if (val) {
    form.value = {
      name: val.name || '',
      customerId: val.customerId || '',
      opportunityId: val.opportunityId || '',
      ownerId: val.ownerId || '',
      amount: val.amount || '',
      startDate: val.startDate || '',
      endDate: val.endDate || '',
      description: val.description || ''
    }
  } else {
    form.value = {
      name: '',
      customerId: '',
      opportunityId: '',
      ownerId: '',
      amount: '',
      startDate: '',
      endDate: '',
      description: ''
    }
  }
}, { immediate: true })

watch(() => props.modelValue, (val) => {
  if (val && formRef.value) {
    formRef.value.resetFields()
    loadOptions()
  }
})

async function loadOptions() {
  customerLoading.value = true
  try {
    const res = await getDashboardCustomerOptions()
    customerOptions.value = res.data || []
    ownerOptions.value = customerOptions.value // 复用，实际应取 profiles
  } catch {
    customerOptions.value = []
    ownerOptions.value = []
  } finally {
    customerLoading.value = false
  }
}

const rules = {
  name: [
    { required: true, message: '合同名称不能为空', trigger: 'blur' },
    { max: 100, message: '合同名称不能超过 100 个字符', trigger: 'blur' }
  ],
  customerId: [
    { required: true, message: '请选择客户', trigger: 'change' }
  ],
  amount: [
    { required: true, message: '请输入合同金额', trigger: 'blur' }
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
          <el-form-item label="合同名称" prop="name">
            <el-input v-model="form.name" placeholder="请输入合同名称" maxlength="100" />
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
          <el-form-item label="合同金额" prop="amount">
            <el-input v-model="form.amount" placeholder="金额（元）" type="number" min="0">
              <template #append>元</template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="开始日期">
            <el-date-picker
              v-model="form.startDate"
              type="date"
              placeholder="选填"
              value-format="YYYY-MM-DDTHH:mm:ss.SSSZ"
              format="YYYY-MM-DD"
              style="width: 100%"
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="结束日期">
            <el-date-picker
              v-model="form.endDate"
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
          <el-form-item label="关联商机">
            <el-select v-model="form.opportunityId" placeholder="选填" clearable class="full-width">
              <el-option
                v-for="item in opportunityOptions"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="负责人">
            <el-select v-model="form.ownerId" placeholder="选填" clearable class="full-width">
              <el-option
                v-for="item in ownerOptions"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="描述">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="合同条款、项目范围等"
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
