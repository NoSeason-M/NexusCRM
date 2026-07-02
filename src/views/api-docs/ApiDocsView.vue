<script setup>
/**
 * ApiDocsView — 接口文档 & 全业务链路联调测试页
 *
 * P0 联调场景：
 *   A — 销售业务流程（经理 → 新建客户、商机、合同、线索）
 *   B — 售后业务流程（经理 → 创建工单、分配、处理、关闭）
 *   C — 系统管理流程（管理员 → 用户管理、角色、菜单、日志）
 *
 * 提供场景参数：?empty / ?delay=2000 / 特定 role Token 切换
 */
import { ref } from 'vue'
import { getMockHealth, resetMockData, getDemoScenario } from '@/api/mock'
import request from '@/api/request'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()

// ─── 接口文档 — 逐个调用 ───

const endpoints = [
  {
    method: 'GET', url: '/api/health',
    desc: '健康检查 — 查看模拟服务状态',
    color: '#67c23a', bgColor: '#f0f9eb',
    action: async () => { const res = await getMockHealth(); return res }
  },
  {
    method: 'POST', url: '/api/mock/reset',
    desc: '重置模拟数据 — 重新生成种子数据',
    color: '#409eff', bgColor: '#ecf5ff',
    action: async () => { const res = await resetMockData(); return res }
  },
  {
    method: 'GET', url: '/api/mock/error',
    desc: '模拟服务端错误 — 返回 500 错误',
    color: '#f56c6c', bgColor: '#fef0f0',
    action: async () => {
      try { await request.get('/mock/error') } catch (e) {
        return e.response?.data || { code: -1, message: e.message || '请求失败', data: {} }
      }
    }
  },
  {
    method: 'GET', url: '/api/mock/demo-scenario',
    desc: '演示场景 — 查看账号Token、业务模块ID、诊断信息',
    color: '#e6a23c', bgColor: '#fdf6ec',
    action: async () => { const res = await getDemoScenario(); return res }
  }
]

const loadingIndex = ref(-1)
const results = ref([])

async function tryEndpoint(index) {
  const ep = endpoints[index]
  loadingIndex.value = index
  try {
    const result = await ep.action()
    results.value[index] = { success: true, data: result }
  } catch (e) {
    results.value[index] = { success: false, data: e.response?.data || { message: e.message } }
  } finally {
    loadingIndex.value = -1
  }
}

function getMethodTagType(method) {
  return { GET: 'success', POST: 'primary', PUT: 'warning', DELETE: 'danger' }[method] || 'info'
}

// ─── P0 联调场景 (A/B/C) ───

// 场景 A：销售业务流程
const scenarioAResults = ref({})
const scenarioALoading = ref(false)

async function runScenarioA() {
  scenarioALoading.value = true
  scenarioAResults.value = {}
  try {
    // 1. 新建客户
    const cus = await request.post('/customers', { name: '测试科技有限公司', industry: '互联网/IT', level: 'gold', status: 'active', contactName: '张三', contactPhone: '13800138000' })
    scenarioAResults.value.createCustomer = { success: true, data: cus.data, status: cus.status }
    const customerId = cus.data?.id

    // 2. 新建商机
    const opp = await request.post('/opportunities', { title: '数字化升级项目', customerId, amount: 500000, ownerId: userStore.user.id })
    scenarioAResults.value.createOpportunity = { success: true, data: opp.data, status: opp.status }

    // 3. 新建合同
    const ctr = await request.post('/contracts', { name: '系统开发合同', customerId, amount: 500000, ownerId: userStore.user.id })
    scenarioAResults.value.createContract = { success: true, data: ctr.data, status: ctr.status }

    // 4. 新建线索
    const lead = await request.post('/leads', { name: '李四', company: '新科技公司', source: 'online', intentionLevel: 'high' })
    scenarioAResults.value.createLead = { success: true, data: lead.data, status: lead.status }

    // 5. 线索分配
    if (lead.data?.id) {
      const ass = await request.patch('/leads/assign', { leadIds: [lead.data.id], ownerId: userStore.user.id })
      scenarioAResults.value.assignLead = { success: true, data: ass.data, status: ass.status }
    }

    // 6. 验证 404
    try { await request.get('/customers/non-existent') } catch (e) {
      scenarioAResults.value.statusCheck = { success: false, data: e.response?.data || { message: e.message }, status: e.response?.status || 0 }
    }
  } catch (e) {
    const resp = e.response
    const steps = ['createCustomer', 'createOpportunity', 'createContract', 'createLead', 'assignLead', 'statusCheck']
    steps.forEach(k => { if (!scenarioAResults.value[k]) scenarioAResults.value[k] = { success: false, data: resp?.data || { message: e.message }, status: resp?.status || 0 } })
  }
  scenarioALoading.value = false
}

// 场景 B：售后业务流程
const scenarioBResults = ref({})
const scenarioBLoading = ref(false)

const scenarioBEndpoints = [
  { key: 'createTicket', label: '1. 创建工单', action: () => request.post('/tickets', { title: '系统无法登录', customerId: null, issueType: 'system_bug', priority: 'high' }) },
  { key: 'assignTicket', label: '2. 分配工单', action: (id) => request.patch(`/tickets/${id}/assign`, { assigneeId: userStore.user.id }) },
  { key: 'processing', label: '3. 处理中', action: (id) => request.patch(`/tickets/${id}/status`, { toStatus: 'pending_confirmation' }) },
  { key: 'resolved', label: '4. 已解决', action: (id) => request.patch(`/tickets/${id}/status`, { toStatus: 'resolved' }) },
  { key: 'closed', label: '5. 关闭', action: (id) => request.patch(`/tickets/${id}/status`, { toStatus: 'closed' }) }
]

async function runScenarioB() {
  scenarioBLoading.value = true
  scenarioBResults.value = {}
  try {
    const r = await request.post('/tickets', { title: '系统无法登录', customerId: null, issueType: 'system_bug', priority: 'high' })
    scenarioBResults.value.createTicket = { success: true, data: r.data, status: r.status }
    const ticketId = r.data.id

    const assignR = await request.patch(`/tickets/${ticketId}/assign`, { assigneeId: userStore.user.id })
    scenarioBResults.value.assignTicket = { success: true, data: assignR.data, status: assignR.status }

    const procR = await request.patch(`/tickets/${ticketId}/status`, { toStatus: 'pending_confirmation' })
    scenarioBResults.value.processing = { success: true, data: procR.data, status: procR.status }

    const resR = await request.patch(`/tickets/${ticketId}/status`, { toStatus: 'resolved' })
    scenarioBResults.value.resolved = { success: true, data: resR.data, status: resR.status }

    const closeR = await request.patch(`/tickets/${ticketId}/status`, { toStatus: 'closed' })
    scenarioBResults.value.closed = { success: true, data: closeR.data, status: closeR.status }
  } catch (e) {
    const resp = e.response
    // 填充失败的步骤
    for (const ep of scenarioBEndpoints) {
      if (!scenarioBResults.value[ep.key]) {
        scenarioBResults.value[ep.key] = { success: false, data: resp?.data || { message: e.message }, status: resp?.status || 0 }
      }
    }
  }
  scenarioBLoading.value = false
}

// 场景 C：系统管理流程
const scenarioCResults = ref({})
const scenarioCLoading = ref(false)

async function runScenarioC() {
  scenarioCLoading.value = true
  scenarioCResults.value = {}
  try {
    const r1 = await request.get('/system/users')
    scenarioCResults.value.listUsers = { success: true, data: r1.data, status: r1.status }

    const r2 = await request.post('/system/users', { username: 'test001', name: '测试用户', role: 'sales', email: 'test@nexuscrm.com' })
    scenarioCResults.value.createUser = { success: true, data: r2.data, status: r2.status }

    const r3 = await request.get('/system/roles')
    scenarioCResults.value.viewRoles = { success: true, data: r3.data, status: r3.status }

    const r4 = await request.get('/system/menus')
    scenarioCResults.value.viewMenus = { success: true, data: r4.data, status: r4.status }

    const r5 = await request.get('/system/logs')
    scenarioCResults.value.viewLogs = { success: true, data: r5.data, status: r5.status }
  } catch (e) {
    const resp = e.response
    ['listUsers', 'createUser', 'viewRoles', 'viewMenus', 'viewLogs'].forEach(k => {
      if (!scenarioCResults.value[k]) {
        scenarioCResults.value[k] = { success: false, data: resp?.data || { message: e.message }, status: resp?.status || 0 }
      }
    })
  }
  scenarioCLoading.value = false
}

// ─── HTTP 状态码测试 ───

const httpCodeResults = ref({})
const httpCodeLoading = ref(false)

async function testHttpCodes() {
  httpCodeLoading.value = true
  httpCodeResults.value = {}

  const tests = [
    { key: '401', label: '401 无Token', action: () => request.get('/customers') },
    { key: '403', label: '403 无权限(viewer创建合同)', action: () => request.post('/contracts', { name: '测试合同', customerId: 'fake', amount: 1000 }) },
    { key: '404', label: '404 不存在的客户', action: () => request.get('/customers/non-existent-id') },
    { key: '409', label: '409 删除有冲突的客户', action: () => {
      const store = JSON.parse(localStorage.getItem('nexus-crm-mock-data') || '{}')
      const id = store.customers?.find(c => (store.opportunities || []).some(o => o.customerId === c.id) || (store.contracts || []).some(ct => ct.customerId === c.id))?.id
      if (!id) return Promise.reject({ response: { status: 409, data: { code: 1009, message: '模拟409: 客户存在关联数据' } } })
      return request.delete(`/customers/${id}`)
    }},
    { key: '500', label: '500 服务端错误', action: () => request.get('/mock/error') },
    { key: 'empty', label: '?scenario=empty 空数据', action: () => request.get('/dashboard/summary?scenario=empty') },
    { key: 'delay', label: '?delay=2000 延迟响应', action: async () => {
      const start = Date.now()
      const res = await request.get('/health?delay=2000')
      return { ...res.data, _elapsed: Date.now() - start }
    }}
  ]

  for (const t of tests) {
    try {
      const res = await t.action()
      httpCodeResults.value[t.key] = { success: true, data: res.data, status: res.status }
    } catch (e) {
      const resp = e.response
      httpCodeResults.value[t.key] = { success: false, data: resp?.data || { message: e.message || '请求失败' }, status: resp?.status || 0 }
    }
  }
  httpCodeLoading.value = false
}

// ─── 场景切换（快捷填充不同角色 Token） ───

const tokenOverrides = ref({
  admin: '',
  manager: '',
  sales: '',
  support: '',
  viewer: ''
})

async function loadTokens() {
  const roles = ['admin', 'manager', 'sales', 'support', 'viewer']
  const passMap = { admin: 'Admin@2026', manager: 'Manager@2026', sales: 'Sales@2026', support: 'Support@2026', viewer: 'Viewer@2026' }
  for (const role of roles) {
    try {
      const res = await request.post('/auth/login', { username: role, password: passMap[role] })
      tokenOverrides.value[role] = res.data.token
    } catch { /* ignore */ }
  }
}

loadTokens()
</script>

<template>
  <div class="api-docs">
    <!-- ═══ 基础接口文档 ═══ -->
    <div class="page-card">
      <div class="page-card__header">
        <span class="title">接口文档</span>
        <el-tag type="info" size="small">模拟接口 (MSW)</el-tag>
      </div>
      <div class="page-card__body">
        <p class="api-tip">
          基于 MSW 的模拟接口，数据源使用 Faker.js 生成，种子为 <strong>2026</strong>。
          刷新页面或点击"重置模拟数据"可重新生成。
        </p>

        <div v-for="(ep, index) in endpoints" :key="ep.url" class="api-card">
          <div class="api-header">
            <div class="api-method">
              <el-tag :type="getMethodTagType(ep.method)" size="small" effect="dark">{{ ep.method }}</el-tag>
              <code class="api-url">{{ ep.url }}</code>
            </div>
            <el-button type="primary" size="small" plain :loading="loadingIndex === index" @click="tryEndpoint(index)">
              {{ loadingIndex === index ? '请求中...' : 'Try it' }}
            </el-button>
          </div>
          <p class="api-desc">{{ ep.desc }}</p>
          <div v-if="results[index]" class="api-response">
            <div class="response-header">
              <span class="response-label">Response</span>
              <el-tag v-if="results[index].success" size="small" type="success" effect="plain">成功</el-tag>
              <el-tag v-else size="small" type="danger" effect="plain">失败</el-tag>
            </div>
            <pre class="response-body"><code>{{ JSON.stringify(results[index].data, null, 2) }}</code></pre>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ P0 场景 A: 销售业务流程 ═══ -->
    <div class="page-card">
      <div class="page-card__header">
        <span class="title">P0 场景 A — 销售业务流程</span>
        <el-button type="primary" size="small" :loading="scenarioALoading" @click="runScenarioA">
          {{ scenarioALoading ? '执行中...' : '执行场景 A' }}
        </el-button>
      </div>
      <div class="page-card__body">
        <p class="api-tip">角色：manager → 新建客户 → 新建商机 → 新建合同 → 新建线索 → 线索分配 → 验证 403/409</p>
        <el-table :data="Object.entries(scenarioAResults).map(([k, v]) => ({ step: { createCustomer: '1. 新建客户', createOpportunity: '2. 新建商机', createContract: '3. 新建合同', createLead: '4. 新建线索', assignLead: '5. 线索分配', statusCheck: '6. 验证 404' }[k] || k, ...v }))" stripe v-if="Object.keys(scenarioAResults).length > 0" style="width: 100%">
          <el-table-column prop="step" label="步骤" width="180" />
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.success ? 'success' : 'danger'" size="small">{{ row.status || (row.success ? 200 : 0) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="消息" min-width="300">
            <template #default="{ row }">{{ row.data?.message || (row.success ? '操作成功' : '请求失败') }}</template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="点击上方按钮执行场景 A" :image-size="60" />
      </div>
    </div>

    <!-- ═══ P0 场景 B: 售后业务流程 ═══ -->
    <div class="page-card">
      <div class="page-card__header">
        <span class="title">P0 场景 B — 售后业务流程</span>
        <el-button type="primary" size="small" :loading="scenarioBLoading" @click="runScenarioB">
          {{ scenarioBLoading ? '执行中...' : '执行场景 B' }}
        </el-button>
      </div>
      <div class="page-card__body">
        <p class="api-tip">角色：manager → 创建工单 → 分配 → pending_confirmation → resolved → closed（全状态机链条）</p>
        <el-table :data="Object.entries(scenarioBResults).map(([k, v]) => ({ step: scenarioBEndpoints.find(e => e.key === k)?.label || k, ...v }))" stripe v-if="Object.keys(scenarioBResults).length > 0" style="width: 100%">
          <el-table-column prop="step" label="步骤" width="200" />
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.success ? 'success' : 'danger'" size="small">{{ row.status || (row.success ? 200 : 0) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="消息" min-width="300">
            <template #default="{ row }">{{ row.data?.message || (row.success ? '操作成功' : '请求失败') }}</template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="点击上方按钮执行场景 B" :image-size="60" />
      </div>
    </div>

    <!-- ═══ P0 场景 C: 系统管理流程 ═══ -->
    <div class="page-card">
      <div class="page-card__header">
        <span class="title">P0 场景 C — 系统管理流程</span>
        <el-button type="primary" size="small" :loading="scenarioCLoading" @click="runScenarioC">
          {{ scenarioCLoading ? '执行中...' : '执行场景 C' }}
        </el-button>
      </div>
      <div class="page-card__body">
        <p class="api-tip">角色：admin → 用户列表 → 新建用户 → 角色列表 → 菜单树 → 操作日志</p>
        <el-table :data="Object.entries(scenarioCResults).map(([k, v]) => ({ step: { listUsers: '1. 用户列表', createUser: '2. 新建用户', viewRoles: '3. 角色列表', viewMenus: '4. 菜单树', viewLogs: '5. 操作日志' }[k] || k, ...v }))" stripe v-if="Object.keys(scenarioCResults).length > 0" style="width: 100%">
          <el-table-column prop="step" label="步骤" width="180" />
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.success ? 'success' : 'danger'" size="small">{{ row.status || (row.success ? 200 : 0) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="消息" min-width="300">
            <template #default="{ row }">{{ row.data?.message || (row.success ? '操作成功' : '请求失败') }}</template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="点击上方按钮执行场景 C" :image-size="60" />
      </div>
    </div>

    <!-- ═══ HTTP 状态码测试 ═══ -->
    <div class="page-card">
      <div class="page-card__header">
        <span class="title">HTTP 状态码 & 场景参数测试</span>
        <el-button type="primary" size="small" :loading="httpCodeLoading" @click="testHttpCodes">
          {{ httpCodeLoading ? '执行中...' : '全部测试' }}
        </el-button>
      </div>
      <div class="page-card__body">
        <p class="api-tip">401 无Token / 403 无权限 / 404 不存在 / 409 冲突 / 500 服务端错误 / ?scenario=empty / ?delay=2000</p>
        <el-table :data="Object.entries(httpCodeResults).map(([k, v]) => ({ key: k, ...v }))" stripe v-if="Object.keys(httpCodeResults).length > 0" style="width: 100%">
          <el-table-column label="测试项" width="200">
            <template #default="{ row }">
              <span>{{ { '401': '401 无Token', '403': '403 无权限', '404': '404 不存在', '409': '409 冲突', '500': '500 服务端错误', 'empty': 'empty 空数据', 'delay': 'delay 延迟(2s)' }[row.key] || row.key }}</span>
            </template>
          </el-table-column>
          <el-table-column label="期望状态码" width="100">
            <template #default="{ row }">{{ { '401': 401, '403': 403, '404': 404, '409': 409, '500': 500, 'empty': 200, 'delay': 200 }[row.key] || '-' }}</template>
          </el-table-column>
          <el-table-column label="实际结果" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status < 300 ? 'success' : (row.status < 500 ? 'warning' : 'danger')" size="small">{{ row.status || (row.success ? 200 : 0) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="消息" min-width="300">
            <template #default="{ row }">{{ row.data?.message || (row.success ? '操作成功' : '请求失败') }}</template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="点击上方按钮测试 HTTP 状态码" :image-size="60" />
      </div>
    </div>

    <!-- ═══ 角色 Token 切换 ═══ -->
    <div class="page-card">
      <div class="page-card__header">
        <span class="title">角色 Token 快捷切换</span>
        <el-button size="small" @click="loadTokens">刷新 Token</el-button>
      </div>
      <div class="page-card__body">
        <el-table :data="Object.entries(tokenOverrides).map(([k, v]) => ({ role: k, token: v }))" stripe style="width: 100%">
          <el-table-column label="角色" width="100">
            <template #default="{ row }">
              <el-tag :type="{ admin: 'danger', manager: 'warning', sales: 'primary', support: 'success', viewer: 'info' }[row.role]" size="small">{{ row.role }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="Token" min-width="300">
            <template #default="{ row }">
              <code class="token-text">{{ row.token || '未加载' }}</code>
            </template>
          </el-table-column>
          <el-table-column label="复制" width="80">
            <template #default="{ row }">
              <el-button v-if="row.token" size="small" text @click="navigator.clipboard.writeText(row.token); ElMessage.success('已复制')">复制</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.api-tip {
  font-size: 14px; color: $text-secondary; margin-bottom: 24px; line-height: 1.6;
}
.api-card {
  border: 1px solid $border-light; border-radius: 8px; padding: 16px; margin-bottom: 16px; transition: box-shadow 0.2s;
  &:hover { box-shadow: $box-shadow-base; }
}
.api-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.api-method { display: flex; align-items: center; gap: 12px; }
.api-url { font-size: 15px; font-weight: 600; color: $text-primary; background: $bg-base; padding: 2px 8px; border-radius: 4px; }
.api-desc { font-size: 13px; color: $text-secondary; }
.api-response { margin-top: 12px; border: 1px solid $border-lighter; border-radius: 6px; overflow: hidden; }
.response-header { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: $bg-base; border-bottom: 1px solid $border-lighter; }
.response-label { font-size: 13px; font-weight: 600; color: $text-regular; }
.response-body { padding: 12px; margin: 0; background: #1e1e1e; color: #d4d4d4; font-size: 13px; line-height: 1.5; overflow-x: auto; max-height: 300px; overflow-y: auto; code { font-family: 'Consolas', 'Monaco', 'Courier New', monospace; } }
.token-text { font-size: 12px; word-break: break-all; color: $text-regular; }
.page-card__header { display: flex; align-items: center; justify-content: space-between; }
</style>
