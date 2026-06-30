<script setup>
/**
 * TicketFormDialog — 工单创建/编辑对话框
 *
 * Props:
 *   modelValue   (Boolean) — v-model 控制显隐
 *   ticket       (Object|null) — null=创建模式，对象=编辑模式（暂仅支持创建）
 *   saving       (Boolean) — 提交中状态
 *
 * Emits:
 *   update:modelValue — 关闭对话框
 *   save(formData)   — 提交表单
 */
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  ticket:    { type: Object, default: null },
  saving:    { type: Boolean, default: false },
  options:   { type: Object, default: () => ({ customers: [], issueTypes: [], priorities: [] }) }
})

const emit = defineEmits(['update:modelValue', 'save'])

const dialogVisible = ref(false)

watch(() => props.modelValue, (val) => {
  dialogVisible.value = val
  if (val) {
    resetForm()
  }
})

function handleClose() {
  if (props.saving) return
  emit('update:modelValue', false)
}

// 表单数据
const formRef = ref(null)
const form = ref({
  title: '',
  customerId: '',
  issueType: '',
  priority: 'medium',
  description: '',
  assigneeId: ''
})

const rules = {
  title: [
    { required: true, message: '请输入工单标题', trigger: 'blur' },
    { max: 100, message: '标题不能超过 100 个字符', trigger: 'blur' }
  ],
  customerId: [
    { required: true, message: '请选择关联客户', trigger: 'change' }
  ],
  issueType: [
    { required: true, message: '请选择工单类型', trigger: 'change' }
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' }
  ],
  description: [
    { max: 2000, message: '描述不能超过 2000 个字符', trigger: 'blur' }
  ]
}

function resetForm() {
  form.value = {
    title: '',
    customerId: '',
    issueType: '',
    priority: 'medium',
    description: '',
    assigneeId: ''
  }
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

async function handleSave() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  emit('save', { ...form.value })
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="新建工单"
    width="640px"
    :close-on-click-modal="false"
    :before-close="handleClose"
    destroy-on-close
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="90px"
      size="small"
    >
      <el-form-item label="工单标题" prop="title">
        <el-input
          v-model="form.title"
          placeholder="请输入工单标题"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="关联客户" prop="customerId">
            <el-select
              v-model="form.customerId"
              placeholder="请选择客户"
              filterable
              style="width: 100%"
            >
              <el-option
                v-for="c in options.customers"
                :key="c.id"
                :label="c.name"
                :value="c.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="工单类型" prop="issueType">
            <el-select v-model="form.issueType" placeholder="请选择类型" style="width: 100%">
              <el-option
                v-for="item in options.issueTypes"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="优先级" prop="priority">
            <el-select v-model="form.priority" placeholder="请选择优先级" style="width: 100%">
              <el-option label="低" value="low" />
              <el-option label="中" value="medium" />
              <el-option label="高" value="high" />
              <el-option label="紧急" value="urgent" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="处理人">
            <el-select
              v-model="form.assigneeId"
              placeholder="可选，留待分配"
              clearable
              filterable
              style="width: 100%"
            >
              <el-option
                v-for="a in options.assignees"
                :key="a.id"
                :label="a.name"
                :value="a.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="4"
          placeholder="请描述工单内容（可选）"
          maxlength="2000"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose" :disabled="saving">取消</el-button>
      <el-button type="primary" @click="handleSave" :loading="saving">提交</el-button>
    </template>
  </el-dialog>
</template>
