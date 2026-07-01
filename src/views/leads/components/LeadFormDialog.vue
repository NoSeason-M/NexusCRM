<script setup>
/**
 * LeadFormDialog — 线索新建/编辑对话框
 */
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  lead: { type: Object, default: null },
  saving: { type: Boolean, default: false },
  options: { type: Object, default: () => ({ sources: [], statuses: [], intentionLevels: [], owners: [], campaigns: [] }) }
})

const emit = defineEmits(['update:modelValue', 'save'])

const dialogVisible = ref(false)
const formRef = ref(null)
const isEdit = ref(false)

const form = ref({
  name: '',
  company: '',
  phone: '',
  email: '',
  source: 'online',
  status: 'new',
  intentionLevel: 'medium',
  ownerId: '',
  campaignId: '',
  remark: ''
})

const rules = {
  name: [
    { required: true, message: '请输入线索名称/联系人', trigger: 'blur' },
    { max: 50, message: '不能超过 50 个字符', trigger: 'blur' }
  ]
}

watch(() => props.modelValue, (val) => {
  dialogVisible.value = val
  if (val) {
    isEdit.value = !!props.lead
    if (props.lead) {
      const l = props.lead
      form.value = {
        name: l.name || '',
        company: l.company || '',
        phone: l.phone || '',
        email: l.email || '',
        source: l.source || 'online',
        status: l.status || 'new',
        intentionLevel: l.intentionLevel || 'medium',
        ownerId: l.ownerId || '',
        campaignId: l.campaignId || '',
        remark: l.remark || ''
      }
    } else {
      form.value = { name: '', company: '', phone: '', email: '', source: 'online', status: 'new', intentionLevel: 'medium', ownerId: '', campaignId: '', remark: '' }
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
    :title="isEdit ? '编辑线索' : '新建线索'"
    width="640px"
    :close-on-click-modal="false"
    :before-close="handleClose"
    destroy-on-close
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px" size="small">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="联系人" prop="name">
            <el-input v-model="form.name" placeholder="请输入姓名" maxlength="50" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="公司">
            <el-input v-model="form.company" placeholder="可选" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="电话">
            <el-input v-model="form.phone" placeholder="可选" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="邮箱">
            <el-input v-model="form.email" placeholder="可选" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="来源">
            <el-select v-model="form.source" style="width: 100%">
              <el-option v-for="s in options.sources" :key="s.value" :label="s.label" :value="s.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="意向">
            <el-select v-model="form.intentionLevel" style="width: 100%">
              <el-option v-for="il in options.intentionLevels" :key="il.value" :label="il.label" :value="il.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="状态">
            <el-select v-model="form.status" style="width: 100%">
              <el-option v-for="st in options.statuses" :key="st.value" :label="st.label" :value="st.value" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="负责人">
            <el-select v-model="form.ownerId" placeholder="可选" clearable filterable style="width: 100%">
              <el-option v-for="o in options.owners" :key="o.id" :label="o.name" :value="o.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="关联活动">
            <el-select v-model="form.campaignId" placeholder="可选" clearable filterable style="width: 100%">
              <el-option v-for="c in options.campaigns" :key="c.id" :label="c.name" :value="c.id" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="可选" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose" :disabled="saving">取消</el-button>
      <el-button type="primary" @click="handleSave" :loading="saving">{{ isEdit ? '保存' : '创建' }}</el-button>
    </template>
  </el-dialog>
</template>
