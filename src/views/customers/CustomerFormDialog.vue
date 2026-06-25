<script setup>
/**
 * CustomerFormDialog — 客户新增/编辑弹窗
 *
 * 通用表单弹窗，通过 props 控制显隐、编辑/新建模式切换。
 */
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  // v-model 控制弹窗显隐
  modelValue: { type: Boolean, default: false },
  // 编辑模式时传入的客户数据（null = 新建）
  customer: { type: Object, default: null },
  // 筛选选项（行业/级别/状态/负责人等下拉数据）
  options: { type: Object, default: () => ({ industries: [], levels: [], statuses: [], owners: [] }) },
  // 是否正在保存中
  saving: { type: Boolean, default: false },
  // 是否允许分配负责人（admin/manager 有 assign 权限）
  canAssign: { type: Boolean, default: false },
  // 新建时默认负责人
  defaultOwnerId: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue', 'save'])

// 是否编辑模式
const isEdit = computed(() => !!props.customer)

// 弹窗标题
const title = computed(() => isEdit.value ? '编辑客户' : '新建客户')

// 表单引用
const formRef = ref(null)

// 表单数据
const form = ref({
  name: '',
  industry: '',
  level: 'regular',
  status: 'active',
  ownerId: '',
  province: '',
  city: '',
  address: '',
  source: '',
  contactName: '',
  contactPhone: '',
  contactTitle: '',
  contactEmail: '',
  description: ''
})

// 监听 customer 变化 → 填充表单（编辑模式）
watch(() => props.customer, (val) => {
  if (val) {
    form.value = {
      name: val.name || '',
      industry: val.industry || '',
      level: val.level || 'regular',
      status: val.status || 'active',
      ownerId: val.ownerId || '',
      province: val.province || '',
      city: val.city || '',
      address: val.address || '',
      source: val.source || '',
      contactName: val.contactName || '',
      contactPhone: val.contactPhone || '',
      contactTitle: val.contactTitle || '',
      contactEmail: val.contactEmail || '',
      description: val.description || ''
    }
  } else {
    // 新建模式：重置表单，设置默认负责人
    form.value = {
      name: '',
      industry: '',
      level: 'regular',
      status: 'active',
      ownerId: props.defaultOwnerId || '',
      province: '',
      city: '',
      address: '',
      source: '',
      contactName: '',
      contactPhone: '',
      contactTitle: '',
      contactEmail: '',
      description: ''
    }
  }
}, { immediate: true })

// 打开时重置校验
watch(() => props.modelValue, (val) => {
  if (val && formRef.value) {
    formRef.value.resetFields()
  }
})

// 表单校验规则
const rules = {
  name: [
    { required: true, message: '客户名称不能为空', trigger: 'blur' },
    { max: 50, message: '客户名称不能超过 50 个字符', trigger: 'blur' }
  ],
  contactPhone: [
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '联系电话格式不正确',
      trigger: 'blur'
    }
  ],
  ownerId: [
    { required: true, message: '请选择负责人', trigger: 'change' }
  ]
}

// 提交
async function handleConfirm() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  emit('save', { ...form.value })
}

// 取消
function handleCancel() {
  emit('update:modelValue', false)
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    width="720px"
    :close-on-click-modal="false"
    :before-close="handleCancel"
    class="customer-form-dialog"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      label-position="top"
      size="default"
    >
      <el-divider content-position="left">基本信息</el-divider>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="客户名称" prop="name">
            <el-input v-model="form.name" placeholder="请输入客户名称" maxlength="50" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="行业">
            <el-select v-model="form.industry" placeholder="请选择行业" clearable class="full-width">
              <el-option
                v-for="item in options.industries"
                :key="item"
                :label="item"
                :value="item"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="客户级别">
            <el-select v-model="form.level" class="full-width">
              <el-option label="铂金" value="platinum" />
              <el-option label="黄金" value="gold" />
              <el-option label="白银" value="silver" />
              <el-option label="普通" value="regular" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="状态">
            <el-select v-model="form.status" class="full-width">
              <el-option
                v-for="item in options.statuses"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="来源渠道">
            <el-select v-model="form.source" placeholder="请选择来源" clearable class="full-width">
              <el-option label="官网注册" value="官网注册" />
              <el-option label="线下展会" value="线下展会" />
              <el-option label="客户推荐" value="客户推荐" />
              <el-option label="电话邀约" value="电话邀约" />
              <el-option label="在线广告" value="在线广告" />
              <el-option label="合作伙伴" value="合作伙伴" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="省份">
            <el-input v-model="form.province" placeholder="省份" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="城市">
            <el-input v-model="form.city" placeholder="城市" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="详细地址">
            <el-input v-model="form.address" placeholder="详细地址" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">联系人信息</el-divider>
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="联系人姓名">
            <el-input v-model="form.contactName" placeholder="联系人" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="联系电话" prop="contactPhone">
            <el-input v-model="form.contactPhone" placeholder="手机号" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="职务">
            <el-input v-model="form.contactTitle" placeholder="职务" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="联系邮箱">
            <el-input v-model="form.contactEmail" placeholder="邮箱" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="负责人" prop="ownerId">
            <el-select v-model="form.ownerId" placeholder="请选择负责人" class="full-width">
              <el-option
                v-for="item in options.owners"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">其他信息</el-divider>
      <el-form-item label="客户描述">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="客户描述、备注信息"
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
.customer-form-dialog {
  .full-width {
    width: 100%;
  }
}
</style>
