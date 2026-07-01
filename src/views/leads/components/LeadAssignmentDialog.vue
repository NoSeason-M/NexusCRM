<script setup>
/**
 * LeadAssignmentDialog — 批量分配线索对话框
 */
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
  owners: { type: Array, default: () => [] },
  selectedCount: { type: Number, default: 0 }
})

const emit = defineEmits(['update:modelValue', 'assign'])

const dialogVisible = ref(false)
const formRef = ref(null)
const form = ref({ ownerId: '' })

watch(() => props.modelValue, (val) => {
  dialogVisible.value = val
  if (val) { form.value = { ownerId: '' }; if (formRef.value) formRef.value.clearValidate() }
})

function handleClose() {
  if (props.saving) return
  emit('update:modelValue', false)
}

async function handleAssign() {
  if (!form.value.ownerId) { ElMessage.warning('请选择负责人'); return }
  emit('assign', form.value.ownerId)
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="批量分配线索"
    width="420px"
    :close-on-click-modal="false"
    :before-close="handleClose"
  >
    <div class="assign-info">
      已将 <strong>{{ selectedCount }}</strong> 条线索加入分配列表
    </div>
    <el-form ref="formRef" :model="form" label-width="80px" size="small">
      <el-form-item label="负责人">
        <el-select v-model="form.ownerId" placeholder="请选择负责人" filterable style="width: 100%">
          <el-option v-for="o in owners" :key="o.id" :label="o.name" :value="o.id" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose" :disabled="saving">取消</el-button>
      <el-button type="primary" @click="handleAssign" :loading="saving">确认分配</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.assign-info { padding: 0 0 16px; font-size: 14px; color: #606266; }
</style>
