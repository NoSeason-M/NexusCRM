<script setup>
/**
 * FollowFormDialog — 跟进记录新增弹窗
 *
 * Props 控制显隐，emit save 返回表单数据。
 */
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  saving: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'save'])

const formRef = ref(null)

const form = ref({
  method: 'phone',
  content: '',
  nextFollowAt: ''
})

// 跟进方式选项
const methodOptions = [
  { value: 'phone', label: '电话' },
  { value: 'visit', label: '拜访' },
  { value: 'wechat', label: '微信' },
  { value: 'email', label: '邮件' }
]

// 打开时重置
watch(() => props.modelValue, (val) => {
  if (val) {
    form.value = { method: 'phone', content: '', nextFollowAt: '' }
    if (formRef.value) {
      formRef.value.resetFields()
    }
  }
})

const rules = {
  method: [
    { required: true, message: '请选择跟进方式', trigger: 'change' }
  ],
  content: [
    { required: true, message: '请输入跟进内容', trigger: 'blur' },
    { max: 500, message: '跟进内容不能超过 500 个字符', trigger: 'blur' }
  ]
}

async function handleConfirm() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  emit('save', { ...form.value })
}

function handleCancel() {
  emit('update:modelValue', false)
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="新建跟进"
    width="560px"
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
      <el-form-item label="跟进方式" prop="method">
        <el-radio-group v-model="form.method">
          <el-radio
            v-for="item in methodOptions"
            :key="item.value"
            :value="item.value"
            :label="item.label"
          />
        </el-radio-group>
      </el-form-item>

      <el-form-item label="跟进内容" prop="content">
        <el-input
          v-model="form.content"
          type="textarea"
          :rows="4"
          placeholder="请详细描述跟进情况"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="下次跟进时间" prop="nextFollowAt">
        <el-date-picker
          v-model="form.nextFollowAt"
          type="datetime"
          placeholder="选填，预计下次跟进时间"
          value-format="YYYY-MM-DDTHH:mm:ss.SSSZ"
          format="YYYY-MM-DD HH:mm"
          :default-time="new Date(2026, 5, 25, 9, 0, 0)"
          style="width: 100%"
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
