<script setup>
/**
 * LeadFollowFormDialog — 线索跟进记录对话框
 */
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  saving: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'save'])

const dialogVisible = ref(false)
const formRef = ref(null)
const form = ref({ method: 'phone', content: '', nextFollowAt: '' })

const rules = {
  method: [{ required: true, message: '请选择跟进方式', trigger: 'change' }],
  content: [
    { required: true, message: '请输入跟进内容', trigger: 'blur' },
    { max: 500, message: '不能超过 500 个字符', trigger: 'blur' }
  ]
}

watch(() => props.modelValue, (val) => {
  dialogVisible.value = val
  if (val) { form.value = { method: 'phone', content: '', nextFollowAt: '' }; if (formRef.value) formRef.value.clearValidate() }
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
    title="添加跟进记录"
    width="480px"
    :close-on-click-modal="false"
    :before-close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px" size="small">
      <el-form-item label="跟进方式" prop="method">
        <el-radio-group v-model="form.method">
          <el-radio value="phone">电话</el-radio>
          <el-radio value="wechat">微信</el-radio>
          <el-radio value="visit">拜访</el-radio>
          <el-radio value="email">邮件</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="跟进内容" prop="content">
        <el-input v-model="form.content" type="textarea" :rows="4" placeholder="请输入跟进内容" maxlength="500" show-word-limit />
      </el-form-item>
      <el-form-item label="下次跟进">
        <el-date-picker v-model="form.nextFollowAt" type="datetime" placeholder="可选" value-format="YYYY-MM-DDTHH:mm:ss.SSSZ" style="width: 100%" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose" :disabled="saving">取消</el-button>
      <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
    </template>
  </el-dialog>
</template>
