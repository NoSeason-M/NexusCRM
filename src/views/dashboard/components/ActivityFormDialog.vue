<script setup>
import { ref, watch } from 'vue'
import { createTodo, updateTodo, createFollow, updateFollow, getDashboardCustomerOptions } from '@/api/dashboard'

const props = defineProps({
  visible: { type: Boolean, default: false },
  type: { type: String, default: 'todo' },  // 'todo' | 'follow'
  editData: { type: Object, default: null }
})

const emit = defineEmits(['update:visible', 'success'])

const customerOptions = ref([])
const loading = ref(false)
const submitting = ref(false)

// 表单数据
const form = ref(getDefaultForm())
const formRef = ref(null)

function getDefaultForm() {
  return {
    title: '',
    customerId: '',
    priority: 'medium',
    status: 'pending',
    dueAt: '',
    method: 'call',
    content: '',
    nextFollowAt: ''
  }
}

// 表单校验规则
const rules = {
  title: [
    { required: true, message: '请输入待办标题', trigger: 'blur' },
    { max: 100, message: '标题不能超过100个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入跟进内容', trigger: 'blur' }
  ],
  customerId: [
    { required: true, message: '请选择关联客户', trigger: 'change' }
  ]
}

// 监听编辑数据变化
watch(() => props.editData, (val) => {
  if (val) {
    form.value = {
      title: val.title || '',
      customerId: val.customerId || '',
      priority: val.priority || 'medium',
      status: val.status || 'pending',
      dueAt: val.dueAt || '',
      method: val.method || 'call',
      content: val.content || '',
      nextFollowAt: val.nextFollowAt || ''
    }
  } else {
    form.value = getDefaultForm()
  }
}, { immediate: true })

// 重置表单
function resetForm() {
  form.value = getDefaultForm()
  formRef.value?.resetFields()
}

// 关闭弹窗
function handleClose() {
  emit('update:visible', false)
  resetForm()
}

// 加载客户选项
async function fetchCustomerOptions() {
  try {
    const res = await getDashboardCustomerOptions()
    customerOptions.value = res.data
  } catch {
    // 静默失败
  }
}

// 提交表单
async function handleSubmit() {
  if (!formRef.value) return

  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (props.type === 'todo') {
      if (props.editData?.id) {
        await updateTodo(props.editData.id, {
          title: form.value.title,
          customerId: form.value.customerId,
          priority: form.value.priority,
          dueAt: form.value.dueAt || undefined
        })
      } else {
        await createTodo({
          title: form.value.title,
          customerId: form.value.customerId,
          priority: form.value.priority,
          dueAt: form.value.dueAt || undefined
        })
      }
    } else {
      if (props.editData?.id) {
        await updateFollow(props.editData.id, {
          customerId: form.value.customerId,
          method: form.value.method,
          content: form.value.content,
          nextFollowAt: form.value.nextFollowAt || undefined
        })
      } else {
        await createFollow({
          customerId: form.value.customerId,
          method: form.value.method,
          content: form.value.content,
          nextFollowAt: form.value.nextFollowAt || undefined
        })
      }
    }

    emit('success')
  } catch {
    // 错误由 Axios 拦截器统一处理
  } finally {
    submitting.value = false
  }
}

// 打开弹窗时加载客户选项
watch(() => props.visible, (val) => {
  if (val) {
    fetchCustomerOptions()
  }
})

const priorityOptions = [
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' }
]

const methodOptions = [
  { value: 'call', label: '电话' },
  { value: 'email', label: '邮件' },
  { value: 'meeting', label: '面谈' },
  { value: 'other', label: '其他' }
]
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="type === 'todo' ? (editData?.id ? '编辑待办' : '新增待办') : (editData?.id ? '编辑跟进' : '新增跟进')"
    width="560px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      @submit.prevent
      class="activity-form"
    >
      <!-- 待办表单 -->
      <template v-if="type === 'todo'">
        <el-form-item label="待办标题" prop="title">
          <el-input
            v-model="form.title"
            placeholder="请输入待办标题"
            :disabled="submitting"
          />
        </el-form-item>

        <el-form-item label="关联客户" prop="customerId">
          <el-select
            v-model="form.customerId"
            placeholder="请选择关联客户"
            :disabled="submitting"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="c in customerOptions"
              :key="c.id"
              :label="c.name"
              :value="c.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="优先级">
          <el-radio-group v-model="form.priority" :disabled="submitting">
            <el-radio
              v-for="opt in priorityOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="截止日期">
          <el-date-picker
            v-model="form.dueAt"
            type="date"
            placeholder="选择截止日期"
            value-format="YYYY-MM-DDTHH:mm:ss.SSSZ"
            :disabled="submitting"
            style="width: 100%"
          />
        </el-form-item>
      </template>

      <!-- 跟进记录表单 -->
      <template v-else>
        <el-form-item label="关联客户" prop="customerId">
          <el-select
            v-model="form.customerId"
            placeholder="请选择关联客户"
            :disabled="submitting"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="c in customerOptions"
              :key="c.id"
              :label="c.name"
              :value="c.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="跟进方式">
          <el-select
            v-model="form.method"
            :disabled="submitting"
            style="width: 100%"
          >
            <el-option
              v-for="opt in methodOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="跟进内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="3"
            placeholder="请输入跟进内容"
            :disabled="submitting"
          />
        </el-form-item>

        <el-form-item label="下次跟进">
          <el-date-picker
            v-model="form.nextFollowAt"
            type="date"
            placeholder="选择下次跟进日期"
            value-format="YYYY-MM-DDTHH:mm:ss.SSSZ"
            :disabled="submitting"
            style="width: 100%"
          />
        </el-form-item>
      </template>
    </el-form>

    <template #footer>
      <el-button @click="handleClose" :disabled="submitting">取消</el-button>
      <el-button
        type="primary"
        :loading="submitting"
        @click="handleSubmit"
      >
        {{ submitting ? '提交中...' : '确 定' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.activity-form {
  padding-top: 10px;
}
</style>
