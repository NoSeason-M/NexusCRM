import { http, HttpResponse } from 'msw'
import { getStore, resetStore } from '../database/store'
import { ROLE_MENUS, ROLE_PERMISSIONS } from '../database/seed'
import {
  queryCustomers,
  getCustomerOptions,
  getCustomerDetail,
  validateCustomerInput,
  getCustomerDeleteConflict,
  validateFollowRecordInput
} from '../database/customers'
import {
  queryOpportunities,
  getOpportunityOptions,
  createOpportunityStatistics,
  getOpportunityDetail,
  validateOpportunityInput,
  validateStageTransition,
  getOpportunityDeleteConflict,
  createOpportunityBoard
} from '../database/opportunities'
import {
  createDashboardSummary,
  createSalesFunnel,
  createContractTrend,
  createTicketStatusDistribution
} from '../database/dashboard'

/**
 * 统一响应格式
 * { code: 0, message: '操作成功', data: {} }
 */
function success(data = {}) {
  return HttpResponse.json({
    code: 0,
    message: '操作成功',
    data
  })
}

function fail(message = '操作失败', code = -1, status = 500) {
  return new HttpResponse(
    JSON.stringify({ code, message, data: {} }),
    { status, headers: { 'Content-Type': 'application/json' } }
  )
}

/**
 * 从请求头中提取并验证 Token
 * Token 格式: base64(JSON.stringify({ username, timestamp }))
 */
function resolveUser(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  try {
    const token = authHeader.slice(7)
    const payload = JSON.parse(atob(token))
    const store = getStore()
    return store.profiles.find(p => p.username === payload.username) || null
  } catch {
    return null
  }
}

/**
 * 工具函数：为客户 id 和用户 id 补充名称
 */
function resolveNames(store) {
  const customerMap = {}
  store.customers.forEach(c => { customerMap[c.id] = c.name })
  const userMap = {}
  store.profiles.forEach(p => { userMap[p.id] = p.name })
  return { customerMap, userMap }
}

export const handlers = [
  // GET /api/health — 健康检查
  http.get('/api/health', () => {
    const store = getStore()
    return success({
      status: 'healthy',
      seed: 2026,
      users: store.users.length
    })
  }),

  // POST /api/mock/reset — 重置模拟数据
  http.post('/api/mock/reset', () => {
    const store = resetStore()
    return success({
      message: '模拟数据已重置',
      users: store.users.length
    })
  }),

  // GET /api/mock/error — 模拟服务器错误
  http.get('/api/mock/error', () => {
    return fail('模拟服务器内部错误', -1, 500)
  }),

  // ──── 认证接口 ────

  // POST /api/auth/login — 登录
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return fail('请输入用户名和密码', 1001, 400)
    }

    const store = getStore()
    const account = store.accounts.find(a => a.username === username)

    if (!account) {
      return fail('用户不存在', 1002, 401)
    }

    if (account.password !== password) {
      return fail('密码错误', 1003, 401)
    }

    // 生成 Token（模拟 JWT）
    const payload = btoa(JSON.stringify({
      username: account.username,
      role: account.role,
      timestamp: Date.now()
    }))

    const profile = store.profiles.find(p => p.username === username)

    return success({
      token: payload,
      user: profile
    })
  }),

  // POST /api/auth/logout — 退出登录
  http.post('/api/auth/logout', () => {
    return success({ message: '已退出登录' })
  }),

  // GET /api/auth/profile — 获取当前用户档案
  http.get('/api/auth/profile', ({ request }) => {
    const user = resolveUser(request.headers.get('Authorization'))
    if (!user) {
      return fail('未登录或 Token 已过期', 1004, 401)
    }
    return success(user)
  }),

  // GET /api/auth/routes — 获取当前用户可访问的路由/菜单
  http.get('/api/auth/routes', ({ request }) => {
    const user = resolveUser(request.headers.get('Authorization'))
    if (!user) {
      return fail('未登录或 Token 已过期', 1004, 401)
    }
    const menus = ROLE_MENUS[user.role] || []
    return success(menus)
  }),

  // GET /api/auth/permissions — 获取当前用户权限列表
  http.get('/api/auth/permissions', ({ request }) => {
    const user = resolveUser(request.headers.get('Authorization'))
    if (!user) {
      return fail('未登录或 Token 已过期', 1004, 401)
    }
    const permissions = ROLE_PERMISSIONS[user.role] || []
    return success(permissions)
  }),

  // ──── Dashboard 接口 ────

  // GET /api/dashboard/summary — 工作台概览指标
  http.get('/api/dashboard/summary', ({ request }) => {
    const user = resolveUser(request.headers.get('Authorization'))
    if (!user) {
      return fail('未登录或 Token 已过期', 1004, 401)
    }

    const url = new URL(request.url)
    const scenario = url.searchParams.get('scenario')

    if (scenario === 'error') {
      return fail('模拟服务器错误', -1, 500)
    }

    const store = getStore()

    if (scenario === 'empty') {
      return success({
        customerCount: 0,
        activeCustomerCount: 0,
        activeOpportunityCount: 0,
        opportunityAmount: 0,
        contractAmount: 0,
        pendingTicketCount: 0
      })
    }

    const summary = createDashboardSummary(store)
    const funnel = createSalesFunnel(store)
    const contractTrend = createContractTrend(store)
    const ticketStatus = createTicketStatusDistribution(store)

    return success({ ...summary, funnel, contractTrend, ticketStatus })
  }),

  // ──── 图表数据接口 ────

  // GET /api/dashboard/charts/sales-funnel — 销售漏斗
  http.get('/api/dashboard/charts/sales-funnel', ({ request }) => {
    const user = resolveUser(request.headers.get('Authorization'))
    if (!user) return fail('未登录或 Token 已过期', 1004, 401)

    const url = new URL(request.url)
    const scenario = url.searchParams.get('scenario')

    if (scenario === 'error') return fail('模拟服务器错误', -1, 500)

    const store = getStore()
    let data = createSalesFunnel(store)

    if (scenario === 'empty') data = []
    if (scenario === 'partial') {
      data = data.map(d => ({
        ...d,
        count: d.stage === 'closed_lost' ? 0 : d.count,
        amount: d.stage === 'closed_lost' ? 0 : d.amount
      }))
    }

    return success(data)
  }),

  // GET /api/dashboard/charts/contract-trend — 合同签约趋势
  http.get('/api/dashboard/charts/contract-trend', ({ request }) => {
    const user = resolveUser(request.headers.get('Authorization'))
    if (!user) return fail('未登录或 Token 已过期', 1004, 401)

    const url = new URL(request.url)
    const scenario = url.searchParams.get('scenario')

    if (scenario === 'error') return fail('模拟服务器错误', -1, 500)

    const store = getStore()
    let data = createContractTrend(store)

    if (scenario === 'empty') data = []
    if (scenario === 'partial') {
      // 只保留最近 3 个月的数据
      data = data.slice(-3)
    }

    return success(data)
  }),

  // GET /api/dashboard/charts/ticket-status — 工单状态分布
  http.get('/api/dashboard/charts/ticket-status', ({ request }) => {
    const user = resolveUser(request.headers.get('Authorization'))
    if (!user) return fail('未登录或 Token 已过期', 1004, 401)

    const url = new URL(request.url)
    const scenario = url.searchParams.get('scenario')

    if (scenario === 'error') return fail('模拟服务器错误', -1, 500)

    const store = getStore()
    let data = createTicketStatusDistribution(store)

    if (scenario === 'empty') data = []
    if (scenario === 'partial') {
      // 只保留前 3 项
      data = data.slice(0, 3)
    }

    return success(data)
  }),

  // GET /api/dashboard/customers — 客户选项下拉列表
  http.get('/api/dashboard/customers', ({ request }) => {
    const user = resolveUser(request.headers.get('Authorization'))
    if (!user) {
      return fail('未登录或 Token 已过期', 1004, 401)
    }

    const store = getStore()
    const options = store.customers.map(c => ({
      id: c.id,
      name: c.name,
      status: c.status
    }))

    return success(options)
  }),

  // ──── 待办接口 ────

  // GET /api/dashboard/todos — 获取待办列表
  http.get('/api/dashboard/todos', ({ request }) => {
    const user = resolveUser(request.headers.get('Authorization'))
    if (!user) {
      return fail('未登录或 Token 已过期', 1004, 401)
    }
    const store = getStore()
    const { customerMap, userMap } = resolveNames(store)
    const list = store.todos.map(t => ({
      ...t,
      customerName: customerMap[t.customerId] || '未知客户',
      ownerName: userMap[t.ownerId] || '未知用户'
    }))
    return success(list)
  }),

  // POST /api/dashboard/todos — 新建待办
  http.post('/api/dashboard/todos', async ({ request }) => {
    const user = resolveUser(request.headers.get('Authorization'))
    if (!user) {
      return fail('未登录或 Token 已过期', 1004, 401)
    }
    const store = getStore()
    const body = await request.json()
    const todo = {
      id: crypto.randomUUID(),
      title: body.title || '',
      customerId: body.customerId || (store.customers[0]?.id || ''),
      ownerId: user.id,
      priority: body.priority || 'medium',
      status: body.status || 'pending',
      dueAt: body.dueAt || new Date(Date.now() + 86400000 * 3).toISOString(),
      createdAt: new Date().toISOString()
    }
    store.todos.push(todo)
    return success(todo)
  }),

  // PUT /api/dashboard/todos/:id — 更新待办
  http.put('/api/dashboard/todos/:id', async ({ request, params }) => {
    const user = resolveUser(request.headers.get('Authorization'))
    if (!user) {
      return fail('未登录或 Token 已过期', 1004, 401)
    }
    const store = getStore()
    const idx = store.todos.findIndex(t => t.id === params.id)
    if (idx === -1) return fail('待办不存在', 1005, 404)

    // 非 admin 只能操作自己的待办
    if (user.role !== 'admin' && store.todos[idx].ownerId !== user.id) {
      return fail('没有权限修改他人的待办', 1006, 403)
    }

    const body = await request.json()
    store.todos[idx] = { ...store.todos[idx], ...body, id: store.todos[idx].id, ownerId: store.todos[idx].ownerId }
    return success(store.todos[idx])
  }),

  // DELETE /api/dashboard/todos/:id — 删除待办
  http.delete('/api/dashboard/todos/:id', ({ request, params }) => {
    const user = resolveUser(request.headers.get('Authorization'))
    if (!user) {
      return fail('未登录或 Token 已过期', 1004, 401)
    }
    const store = getStore()
    const idx = store.todos.findIndex(t => t.id === params.id)
    if (idx === -1) return fail('待办不存在', 1005, 404)

    // 非 admin 只能删除自己的待办
    if (user.role !== 'admin' && store.todos[idx].ownerId !== user.id) {
      return fail('没有权限删除他人的待办', 1006, 403)
    }

    store.todos.splice(idx, 1)
    return success({ message: '已删除' })
  }),

  // GET /api/dashboard/recent-follows — 获取跟进记录列表
  http.get('/api/dashboard/recent-follows', ({ request }) => {
    const user = resolveUser(request.headers.get('Authorization'))
    if (!user) {
      return fail('未登录或 Token 已过期', 1004, 401)
    }
    const store = getStore()
    const { customerMap, userMap } = resolveNames(store)
    const list = store.recentFollows.map(f => ({
      ...f,
      customerName: customerMap[f.customerId] || '未知客户',
      ownerName: userMap[f.ownerId] || '未知用户'
    }))
    return success(list)
  }),

  // POST /api/dashboard/recent-follows — 新建跟进记录
  http.post('/api/dashboard/recent-follows', async ({ request }) => {
    const user = resolveUser(request.headers.get('Authorization'))
    if (!user) {
      return fail('未登录或 Token 已过期', 1004, 401)
    }
    const store = getStore()
    const body = await request.json()
    const follow = {
      id: crypto.randomUUID(),
      customerId: body.customerId || (store.customers[0]?.id || ''),
      ownerId: user.id,
      method: body.method || 'other',
      content: body.content || '',
      nextFollowAt: body.nextFollowAt || '',
      createdAt: new Date().toISOString()
    }
    store.recentFollows.push(follow)
    return success(follow)
  }),

  // PUT /api/dashboard/recent-follows/:id — 更新跟进记录
  http.put('/api/dashboard/recent-follows/:id', async ({ request, params }) => {
    const user = resolveUser(request.headers.get('Authorization'))
    if (!user) {
      return fail('未登录或 Token 已过期', 1004, 401)
    }
    const store = getStore()
    const idx = store.recentFollows.findIndex(f => f.id === params.id)
    if (idx === -1) return fail('跟进记录不存在', 1005, 404)

    // 非 admin 只能操作自己的记录
    if (user.role !== 'admin' && store.recentFollows[idx].ownerId !== user.id) {
      return fail('没有权限修改他人的跟进记录', 1006, 403)
    }

    const body = await request.json()
    store.recentFollows[idx] = { ...store.recentFollows[idx], ...body, id: store.recentFollows[idx].id, ownerId: store.recentFollows[idx].ownerId }
    return success(store.recentFollows[idx])
  }),

  // ──── 客户管理接口 ────

  // GET /api/customers — 组合查询 + 分页客户列表
  http.get('/api/customers', ({ request }) => {
    const user = resolveUser(request.headers.get('Authorization'))
    if (!user) {
      return fail('未登录或 Token 已过期', 1004, 401)
    }
    // 权限检查
    if (!ROLE_PERMISSIONS[user.role]?.includes('customer:view') && !ROLE_PERMISSIONS[user.role]?.includes('*')) {
      return fail('无权限查看客户', 1006, 403)
    }

    const url = new URL(request.url)
    const searchParams = Object.fromEntries(url.searchParams.entries())
    const store = getStore()
    const result = queryCustomers(store, searchParams)
    return success(result)
  }),

  // GET /api/customers/options — 获取客户筛选选项
  http.get('/api/customers/options', ({ request }) => {
    const user = resolveUser(request.headers.get('Authorization'))
    if (!user) {
      return fail('未登录或 Token 已过期', 1004, 401)
    }

    const store = getStore()
    const options = getCustomerOptions(store)
    return success(options)
  }),

  // GET /api/customers/:id — 获取客户详情
  http.get('/api/customers/:id', ({ request, params }) => {
    const user = resolveUser(request.headers.get('Authorization'))
    if (!user) {
      return fail('未登录或 Token 已过期', 1004, 401)
    }

    const store = getStore()
    const detail = getCustomerDetail(store, params.id)
    if (!detail) {
      return fail('客户不存在', 1005, 404)
    }
    return success(detail)
  }),

  // POST /api/customers — 新建客户
  http.post('/api/customers', async ({ request }) => {
    const user = resolveUser(request.headers.get('Authorization'))
    if (!user) return fail('未登录或 Token 已过期', 1004, 401)

    // 权限检查：customer:create
    const perms = ROLE_PERMISSIONS[user.role] || []
    if (!perms.includes('customer:create') && !perms.includes('*')) {
      return fail('无权限新建客户', 1006, 403)
    }

    const store = getStore()
    const body = await request.json()

    // 参数校验
    const { valid, errors, data } = validateCustomerInput(store, body)
    if (!valid) {
      const msg = errors.map(e => e.message).join('；')
      return fail(msg, errors[0].code, 400)
    }

    const now = new Date().toISOString()
    const customer = {
      id: crypto.randomUUID(),
      ...data,
      // 未指定负责人时默认为当前用户
      ownerId: data.ownerId || user.id,
      // 新建时 lastFollowAt 为 null，但前端展示需兼容
      lastFollowAt: null,
      createdAt: now,
      updatedAt: now
    }
    store.customers.unshift(customer)
    return success(customer)
  }),

  // PUT /api/customers/:id — 更新客户
  http.put('/api/customers/:id', async ({ request, params }) => {
    const user = resolveUser(request.headers.get('Authorization'))
    if (!user) return fail('未登录或 Token 已过期', 1004, 401)

    const perms = ROLE_PERMISSIONS[user.role] || []
    const store = getStore()
    const idx = store.customers.findIndex(c => c.id === params.id)
    if (idx === -1) return fail('客户不存在', 1005, 404)

    const existing = store.customers[idx]

    // 权限检查：customer:edit 或 customer:assign
    const hasEdit = perms.includes('customer:edit') || perms.includes('*')
    // sales 只能编辑自己负责的客户
    if (!hasEdit && user.role === 'sales' && existing.ownerId !== user.id) {
      return fail('没有权限编辑他人的客户', 1006, 403)
    }
    if (!hasEdit && user.role !== 'sales') {
      return fail('无权限编辑客户', 1006, 403)
    }

    const body = await request.json()

    // ownerId 变更需要 customer:assign 权限
    if (body.ownerId && body.ownerId !== existing.ownerId) {
      const canAssign = perms.includes('customer:assign') || perms.includes('*')
      if (!canAssign) {
        return fail('没有权限转移客户负责人', 1006, 403)
      }
    }

    // 参数校验（排除自身 ID）
    const { valid, errors, data } = validateCustomerInput(store, { ...existing, ...body }, existing.id)
    if (!valid) {
      const msg = errors.map(e => e.message).join('；')
      return fail(msg, errors[0].code, 400)
    }

    // 禁止修改 createdAt / id / lastFollowAt
    const now = new Date().toISOString()
    store.customers[idx] = {
      ...existing,
      ...data,
      id: existing.id,
      createdAt: existing.createdAt,
      lastFollowAt: existing.lastFollowAt,
      ownerId: body.ownerId || existing.ownerId,
      updatedAt: now
    }
    return success(store.customers[idx])
  }),

  // DELETE /api/customers/:id — 删除客户
  http.delete('/api/customers/:id', ({ request, params }) => {
    const user = resolveUser(request.headers.get('Authorization'))
    if (!user) return fail('未登录或 Token 已过期', 1004, 401)

    const perms = ROLE_PERMISSIONS[user.role] || []
    const store = getStore()
    const idx = store.customers.findIndex(c => c.id === params.id)
    if (idx === -1) return fail('客户不存在', 1005, 404)

    // 权限检查：customer:delete
    if (!perms.includes('customer:delete') && !perms.includes('*')) {
      return fail('无权限删除客户', 1006, 403)
    }
    // sales 只能删除自己负责的客户
    if (user.role === 'sales' && store.customers[idx].ownerId !== user.id) {
      return fail('没有权限删除他人的客户', 1006, 403)
    }

    // 关联冲突检查
    const conflict = getCustomerDeleteConflict(store, params.id)
    if (conflict.hasConflict) {
      const detail = conflict.conflicts.map(c => `${c.type}(${c.count})`).join('、')
      return fail(`该客户存在关联数据（${detail}），无法删除`, 1009, 409)
    }

    store.customers.splice(idx, 1)
    return success({ message: '客户已删除' })
  }),

  // ──── 客户跟进记录接口 ────

  // POST /api/customers/:id/follows — 新增跟进记录
  http.post('/api/customers/:id/follows', async ({ request, params }) => {
    const user = resolveUser(request.headers.get('Authorization'))
    if (!user) return fail('未登录或 Token 已过期', 1004, 401)

    const perms = ROLE_PERMISSIONS[user.role] || []
    if (!perms.includes('customer:follow') && !perms.includes('*')) {
      return fail('没有权限跟进客户', 1006, 403)
    }

    const store = getStore()
    const customer = store.customers.find(c => c.id === params.id)
    if (!customer) return fail('客户不存在', 1005, 404)

    const body = await request.json()

    // 校验
    const { valid, errors } = validateFollowRecordInput(body)
    if (!valid) {
      const msg = errors.map(e => e.message).join('；')
      return fail(msg, 1010, 400)
    }

    const now = new Date().toISOString()
    const follow = {
      id: crypto.randomUUID(),
      customerId: params.id,
      ownerId: user.id,
      method: body.method,
      content: body.content.trim(),
      nextFollowAt: body.nextFollowAt || '',
      createdAt: now
    }

    store.recentFollows.unshift(follow)

    // 更新客户的 lastFollowAt
    customer.lastFollowAt = now

    return success(follow)
  }),

  // ──── 客户负责人变更接口 ────

  // PUT /api/customers/:id/owner — 变更客户负责人
  http.put('/api/customers/:id/owner', async ({ request, params }) => {
    const user = resolveUser(request.headers.get('Authorization'))
    if (!user) return fail('未登录或 Token 已过期', 1004, 401)

    const perms = ROLE_PERMISSIONS[user.role] || []
    if (!perms.includes('customer:assign') && !perms.includes('*')) {
      return fail('没有权限分配客户负责人', 1006, 403)
    }

    const store = getStore()
    const idx = store.customers.findIndex(c => c.id === params.id)
    if (idx === -1) return fail('客户不存在', 1005, 404)

    const body = await request.json()
    if (!body.ownerId) {
      return fail('请选择新的负责人', 1011, 400)
    }

    // 校验负责人是否存在且活跃
    const ownerProfile = store.profiles.find(p => p.id === body.ownerId && p.status !== 'inactive')
    if (!ownerProfile) {
      return fail('指定的负责人不存在或已停用', 1012, 400)
    }

    const now = new Date().toISOString()
    store.customers[idx].ownerId = body.ownerId
    store.customers[idx].updatedAt = now

    return success({
      id: store.customers[idx].id,
      ownerId: store.customers[idx].ownerId,
      ownerName: ownerProfile.name,
      updatedAt: now
    })
  }),

  // ──── 商机管理接口 ────

  // GET /api/opportunities — 组合查询 + 分页商机列表
  http.get('/api/opportunities', ({ request }) => {
    const user = resolveUser(request.headers.get('Authorization'))
    if (!user) return fail('未登录或 Token 已过期', 1004, 401)

    const perms = ROLE_PERMISSIONS[user.role] || []
    if (!perms.includes('opportunity:view') && !perms.includes('*')) {
      return fail('无权限查看商机', 1006, 403)
    }

    const url = new URL(request.url)
    const searchParams = Object.fromEntries(url.searchParams.entries())
    const store = getStore()
    const result = queryOpportunities(store, searchParams)
    return success(result)
  }),

  // GET /api/opportunities/statistics — 商机统计概览
  http.get('/api/opportunities/statistics', ({ request }) => {
    const user = resolveUser(request.headers.get('Authorization'))
    if (!user) return fail('未登录或 Token 已过期', 1004, 401)

    const perms = ROLE_PERMISSIONS[user.role] || []
    if (!perms.includes('opportunity:view') && !perms.includes('*')) {
      return fail('无权限查看商机统计', 1006, 403)
    }

    const url = new URL(request.url)
    const searchParams = Object.fromEntries(url.searchParams.entries())
    const store = getStore()
    const statistics = createOpportunityStatistics(store, searchParams)
    return success(statistics)
  }),

  // GET /api/opportunities/options — 商机筛选选项
  http.get('/api/opportunities/options', ({ request }) => {
    const user = resolveUser(request.headers.get('Authorization'))
    if (!user) return fail('未登录或 Token 已过期', 1004, 401)

    const store = getStore()
    const options = getOpportunityOptions(store)
    return success(options)
  }),

  // GET /api/opportunities/:id — 商机详情
  http.get('/api/opportunities/:id', ({ request, params }) => {
    const user = resolveUser(request.headers.get('Authorization'))
    if (!user) return fail('未登录或 Token 已过期', 1004, 401)

    const perms = ROLE_PERMISSIONS[user.role] || []
    if (!perms.includes('opportunity:view') && !perms.includes('*')) {
      return fail('无权限查看商机', 1006, 403)
    }

    const store = getStore()
    const detail = getOpportunityDetail(store, params.id)
    if (!detail) return fail('商机不存在', 1005, 404)
    return success(detail)
  }),

  // POST /api/opportunities — 新建商机
  http.post('/api/opportunities', async ({ request }) => {
    const user = resolveUser(request.headers.get('Authorization'))
    if (!user) return fail('未登录或 Token 已过期', 1004, 401)

    const perms = ROLE_PERMISSIONS[user.role] || []
    if (!perms.includes('opportunity:create') && !perms.includes('*')) {
      return fail('无权限新建商机', 1006, 403)
    }

    const store = getStore()
    const body = await request.json()

    const { valid, errors, data } = validateOpportunityInput(store, body)
    if (!valid) {
      const msg = errors.map(e => e.message).join('；')
      return fail(msg, errors[0].code, 400)
    }

    const now = new Date().toISOString()
    const opportunity = {
      id: crypto.randomUUID(),
      ...data,
      ownerId: data.ownerId || user.id,
      probability: data.probability || 10,
      expectedCloseDate: data.expectedCloseDate || null,
      createdAt: now,
      updatedAt: now
    }
    store.opportunities.unshift(opportunity)

    // 记录初始阶段
    if (!store.opportunityStageRecords) store.opportunityStageRecords = []
    store.opportunityStageRecords.unshift({
      id: crypto.randomUUID(),
      opportunityId: opportunity.id,
      fromStage: null,
      toStage: opportunity.stage,
      changedBy: user.id,
      note: '初始创建',
      changedAt: now
    })

    return success(opportunity)
  }),

  // PUT /api/opportunities/:id — 更新商机（禁止修改 stage）
  http.put('/api/opportunities/:id', async ({ request, params }) => {
    const user = resolveUser(request.headers.get('Authorization'))
    if (!user) return fail('未登录或 Token 已过期', 1004, 401)

    const perms = ROLE_PERMISSIONS[user.role] || []
    if (!perms.includes('opportunity:edit') && !perms.includes('*')) {
      return fail('无权限编辑商机', 1006, 403)
    }

    const store = getStore()
    const idx = store.opportunities.findIndex(o => o.id === params.id)
    if (idx === -1) return fail('商机不存在', 1005, 404)

    const existing = store.opportunities[idx]
    const body = await request.json()

    // 禁止修改 stage（由专门的 stage 控制器处理）
    const safeBody = { ...body }
    delete safeBody.stage
    delete safeBody.stageLabel

    // 校验（排除自身）
    const { valid, errors, data } = validateOpportunityInput(store, { ...existing, ...safeBody })
    if (!valid) {
      const msg = errors.map(e => e.message).join('；')
      return fail(msg, errors[0].code, 400)
    }

    const now = new Date().toISOString()
    store.opportunities[idx] = {
      ...existing,
      ...data,
      id: existing.id,
      stage: existing.stage,
      probability: existing.probability,
      createdAt: existing.createdAt,
      updatedAt: now
    }
    return success(store.opportunities[idx])
  }),

  // DELETE /api/opportunities/:id — 删除商机
  http.delete('/api/opportunities/:id', ({ request, params }) => {
    const user = resolveUser(request.headers.get('Authorization'))
    if (!user) return fail('未登录或 Token 已过期', 1004, 401)

    const perms = ROLE_PERMISSIONS[user.role] || []
    if (!perms.includes('opportunity:delete') && !perms.includes('*')) {
      return fail('无权限删除商机', 1006, 403)
    }

    const store = getStore()
    const idx = store.opportunities.findIndex(o => o.id === params.id)
    if (idx === -1) return fail('商机不存在', 1005, 404)

    // 关联冲突检查
    const conflict = getOpportunityDeleteConflict(store, params.id)
    if (conflict.hasConflict) {
      const detail = conflict.conflicts.map(c => `${c.type}(${c.count})`).join('、')
      return fail(`该商机存在关联数据（${detail}），无法删除`, 1009, 409)
    }

    store.opportunities.splice(idx, 1)
    // 同时清理阶段流转记录
    if (store.opportunityStageRecords) {
      store.opportunityStageRecords = store.opportunityStageRecords.filter(r => r.opportunityId !== params.id)
    }
    return success({ message: '商机已删除' })
  }),

  // PATCH /api/opportunities/:id/stage — 商机阶段流转
  http.patch('/api/opportunities/:id/stage', async ({ request, params }) => {
    const user = resolveUser(request.headers.get('Authorization'))
    if (!user) return fail('未登录或 Token 已过期', 1004, 401)

    const perms = ROLE_PERMISSIONS[user.role] || []
    if (!perms.includes('opportunity:stage') && !perms.includes('*')) {
      return fail('没有权限进行阶段流转', 1006, 403)
    }

    const store = getStore()
    const idx = store.opportunities.findIndex(o => o.id === params.id)
    if (idx === -1) return fail('商机不存在', 1005, 404)

    const opp = store.opportunities[idx]
    const body = await request.json()

    // 校验流转
    const { valid, errors } = validateStageTransition(opp, body)
    if (!valid) {
      const msg = errors.map(e => e.message).join('；')
      return fail(msg, errors[0].code, 409)
    }

    const now = new Date().toISOString()
    const toStage = body.toStage
    const toProbability = { lead: 10, qualified: 30, proposal: 50, negotiation: 75, won: 100, lost: 0 }[toStage] || 0

    // 更新商机
    store.opportunities[idx].stage = toStage
    store.opportunities[idx].probability = toProbability
    if (body.nextStep) store.opportunities[idx].nextStep = body.nextStep
    store.opportunities[idx].updatedAt = now

    // 记录流转历史
    if (!store.opportunityStageRecords) store.opportunityStageRecords = []
    store.opportunityStageRecords.unshift({
      id: crypto.randomUUID(),
      opportunityId: params.id,
      fromStage: opp.stage,
      toStage,
      changedBy: user.id,
      note: body.note || '',
      changedAt: now
    })

    return success({
      id: store.opportunities[idx].id,
      stage: store.opportunities[idx].stage,
      probability: store.opportunities[idx].probability,
      updatedAt: now
    })
  }),

  // ──── 商机看板接口 ────

  // GET /api/opportunities/board — 商机看板（按阶段分组）
  http.get('/api/opportunities/board', ({ request }) => {
    const user = resolveUser(request.headers.get('Authorization'))
    if (!user) return fail('未登录或 Token 已过期', 1004, 401)

    const perms = ROLE_PERMISSIONS[user.role] || []
    if (!perms.includes('opportunity:view') && !perms.includes('*')) {
      return fail('无权限查看商机', 1006, 403)
    }

    const store = getStore()
    const board = createOpportunityBoard(store)
    return success(board)
  })
]
