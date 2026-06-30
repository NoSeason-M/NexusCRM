/**
 * 系统管理数据层
 *
 * 提供系统用户管理、角色管理、菜单管理、操作日志等数据生成与查询功能。
 */
import { faker } from '@faker-js/faker/locale/zh_CN'
import { ROLE_NAMES, ROLE_PERMISSIONS } from './seed'

// ──── 角色定义 ────

/**
 * 生成系统角色数据
 *
 * @param {Object} database - 完整数据集（用于计算 userCount）
 * @returns {Array<{ code: string, name: string, description: string, permissions: string[] }>}
 */
export function generateSystemRoles(database) {
  const roles = Object.keys(ROLE_NAMES).map(code => ({
    code,
    name: ROLE_NAMES[code],
    description: code === 'admin' ? '拥有系统所有权限'
      : code === 'manager' ? '管理所有业务模块'
      : code === 'sales' ? '管理客户与商机'
      : code === 'support' ? '处理客户工单'
      : '仅可查看数据',
    permissions: ROLE_PERMISSIONS[code] || []
  }))

  // 计算 userCount
  if (database && database.profiles) {
    return roles.map(role => ({
      ...role,
      userCount: database.profiles.filter(p => (p.role || '').startsWith(role.code)).length
    }))
  }

  return roles
}

// ──── 系统用户 ────

/**
 * 生成系统用户数据（在预设 profiles 基础上补充更多用户）
 *
 * @param {Array} profiles - 预设用户档案（5 个）
 * @returns {Array} 扩充后的用户列表（约 30 个）
 */
export function generateSystemUsers(profiles) {
  const count = faker.number.int({ min: 20, max: 25 })
  const roles = Object.keys(ROLE_NAMES)
  const users = []

  for (let i = 0; i < count; i++) {
    const role = faker.helpers.arrayElement(roles)
    const createdAt = faker.date.between({ from: '2026-01-01', to: new Date() }).toISOString()
    const lastLoginAt = faker.helpers.arrayElement([
      faker.date.recent({ days: 7 }).toISOString(),
      faker.date.recent({ days: 30 }).toISOString(),
      null,
      null
    ])

    users.push({
      id: faker.string.uuid(),
      username: faker.internet.username(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      avatar: '',
      role,
      roleName: ROLE_NAMES[role],
      status: faker.helpers.arrayElement(['active', 'active', 'active', 'disabled']),
      lastLoginAt,
      createdAt,
      updatedAt: faker.date.between({ from: createdAt, to: new Date() }).toISOString()
    })
  }

  return users
}

/**
 * 组合查询系统用户
 *
 * @param {Object} database - 完整的数据集
 * @param {Object} searchParams - 查询参数
 * @param {string} [searchParams.keyword]  - 关键词（模糊匹配 username / name / email）
 * @param {string} [searchParams.role]     - 角色筛选
 * @param {string} [searchParams.status]   - 状态筛选 active/disabled
 * @param {number} [searchParams.page=1]   - 页码
 * @param {number} [searchParams.pageSize=20] - 每页条数
 * @returns {{ list: Array, total: number, page: number, pageSize: number }}
 */
export function querySystemUsers(database, searchParams = {}) {
  const { profiles, systemUsers } = database

  // 合并预设用户 + 生成用户
  let allUsers = [...(profiles || []), ...(systemUsers || [])]

  // 去重（按 id）
  const seen = new Set()
  allUsers = allUsers.filter(u => {
    if (seen.has(u.id)) return false
    seen.add(u.id)
    return true
  })

  const { keyword, role, status } = searchParams
  let page = parseInt(searchParams.page, 10) || 1
  let pageSize = parseInt(searchParams.pageSize, 10) || 20

  if (page < 1) page = 1
  if (pageSize < 1) pageSize = 20
  if (pageSize > 100) pageSize = 100

  // 筛选
  if (keyword && keyword.trim()) {
    const kw = keyword.trim().toLowerCase()
    allUsers = allUsers.filter(u =>
      (u.username || '').toLowerCase().includes(kw) ||
      (u.name || '').toLowerCase().includes(kw) ||
      (u.email || '').toLowerCase().includes(kw)
    )
  }

  if (role) {
    allUsers = allUsers.filter(u => u.role === role)
  }

  if (status) {
    allUsers = allUsers.filter(u => u.status === status)
  }

  const total = allUsers.length

  // 分页（按 createdAt 降序）
  allUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const start = (page - 1) * pageSize
  const paged = allUsers.slice(start, start + pageSize)

  const list = paged.map(u => ({
    ...u,
    roleName: ROLE_NAMES[u.role] || u.roleName || u.role
  }))

  return { list, total, page, pageSize }
}

/**
 * 获取系统用户筛选选项
 *
 * @param {Object} database
 * @returns {{ roles: Array }}
 */
export function getSystemUserOptions(database) {
  const roles = Object.entries(ROLE_NAMES).map(([value, label]) => ({
    value, label
  }))
  return { roles }
}

/**
 * 校验系统用户输入
 *
 * @param {Object} database
 * @param {Object} input
 * @param {string} [excludeId] - 排除的 ID（编辑时排除自身）
 * @returns {{ valid: boolean, errors: Array, data?: Object }}
 */
export function validateSystemUserInput(database, input, excludeId) {
  const errors = []
  const allUsers = [...(database.profiles || []), ...(database.systemUsers || [])]

  // username — 必填，唯一，最大 50
  if (!input.username || !input.username.trim()) {
    errors.push({ code: 3001, message: '用户名不能为空' })
  } else if (input.username.length > 50) {
    errors.push({ code: 3002, message: '用户名不能超过 50 个字符' })
  } else {
    const dup = allUsers.find(u => u.username === input.username.trim() && u.id !== excludeId)
    if (dup) {
      errors.push({ code: 3003, message: '用户名已存在' })
    }
  }

  // name — 必填
  if (!input.name || !input.name.trim()) {
    errors.push({ code: 3004, message: '姓名不能为空' })
  }

  // role — 必填，枚举
  const validRoles = Object.keys(ROLE_NAMES)
  if (!input.role || !validRoles.includes(input.role)) {
    errors.push({ code: 3005, message: '请选择有效的角色' })
  }

  // email — 非必填，格式校验
  if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    errors.push({ code: 3006, message: '邮箱格式不正确' })
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  const data = {
    username: input.username.trim(),
    name: input.name.trim(),
    email: input.email || '',
    phone: input.phone || '',
    role: input.role
  }

  return { valid: true, errors: [], data }
}

/**
 * 校验系统用户状态变更
 *
 * @param {Object} user - 用户对象
 * @param {Object} input - { status } (active/disabled)
 * @param {string} currentUserId - 当前操作人 ID（禁止禁用自己）
 * @returns {{ valid: boolean, errors: Array }}
 */
export function validateSystemUserStatus(user, input, currentUserId) {
  const errors = []

  if (!input.status || !['active', 'disabled'].includes(input.status)) {
    errors.push({ code: 3011, message: '无效的状态值' })
    return { valid: false, errors }
  }

  if (input.status === user.status) {
    errors.push({ code: 3012, message: '状态未发生变化' })
    return { valid: false, errors }
  }

  // 禁止禁用自己
  if (input.status === 'disabled' && user.id === currentUserId) {
    errors.push({ code: 3013, message: '不能禁用当前登录用户' })
    return { valid: false, errors }
  }

  return { valid: true, errors: [] }
}

// ──── 系统菜单 ────

/**
 * 生成系统菜单树
 *
 * @returns {Array} 菜单树（支持 children 嵌套）
 */
export function generateSystemMenus() {
  const allMenus = [
    // 一级：仪表盘
    { id: 'm-dashboard', parentId: null, path: '/dashboard', name: 'dashboard', title: '仪表盘', icon: 'Odometer', permission: null, hidden: false, order: 1, roles: ['admin', 'manager', 'sales', 'support', 'viewer'] },
    // 一级：客户管理
    { id: 'm-customers', parentId: null, path: '/customers', name: 'customers', title: '客户管理', icon: 'User', permission: 'customer:view', hidden: false, order: 2, roles: ['admin', 'manager', 'sales', 'support', 'viewer'] },
    // 一级：商机管理
    { id: 'm-opportunities', parentId: null, path: '/opportunities', name: 'opportunities', title: '商机管理', icon: 'TrendCharts', permission: 'opportunity:view', hidden: false, order: 3, roles: ['admin', 'manager', 'sales'] },
    // 一级：合同管理
    { id: 'm-contracts', parentId: null, path: '/contracts', name: 'contracts', title: '合同管理', icon: 'Document', permission: 'contract:view', hidden: false, order: 4, roles: ['admin', 'manager', 'sales'] },
    // 一级：工单管理
    { id: 'm-tickets', parentId: null, path: '/tickets', name: 'tickets', title: '工单管理', icon: 'Ticket', permission: 'ticket:view', hidden: false, order: 5, roles: ['admin', 'manager', 'support'] },
    // 一级：系统管理（仅 admin）
    { id: 'm-system', parentId: null, path: '/system/users', name: 'system', title: '系统管理', icon: 'Setting', permission: null, hidden: false, order: 6, roles: ['admin'] },
    // 二级：用户管理
    { id: 'm-system-users', parentId: 'm-system', path: '/system/users', name: 'system-users', title: '用户管理', icon: 'UserFilled', permission: 'system:user:view', hidden: false, order: 1, roles: ['admin'] },
    // 二级：角色管理
    { id: 'm-system-roles', parentId: 'm-system', path: '/system/roles', name: 'system-roles', title: '角色管理', icon: 'Avatar', permission: 'system:role:view', hidden: false, order: 2, roles: ['admin'] },
    // 二级：菜单管理
    { id: 'm-system-menus', parentId: 'm-system', path: '/system/menus', name: 'system-menus', title: '菜单管理', icon: 'Menu', permission: 'system:menu:view', hidden: false, order: 3, roles: ['admin'] },
    // 二级：操作日志
    { id: 'm-system-logs', parentId: 'm-system', path: '/system/logs', name: 'system-logs', title: '操作日志', icon: 'List', permission: 'system:log:view', hidden: false, order: 4, roles: ['admin'] },
    // 一级：接口文档
    { id: 'm-api-docs', parentId: null, path: '/api-docs', name: 'api-docs', title: '接口文档', icon: 'Document', permission: null, hidden: false, order: 99, roles: ['admin', 'manager', 'sales', 'support', 'viewer'] }
  ]

  // 按 parentId 构建树
  const map = {}
  allMenus.forEach(m => { map[m.id] = { ...m, children: [] } })

  const tree = []
  allMenus.forEach(m => {
    const node = map[m.id]
    if (m.parentId && map[m.parentId]) {
      map[m.parentId].children.push(node)
    } else if (!m.parentId) {
      tree.push(node)
    }
  })

  // 按 order 排序
  function sortTree(nodes) {
    nodes.sort((a, b) => a.order - b.order)
    nodes.forEach(n => { if (n.children.length) sortTree(n.children) })
  }
  sortTree(tree)

  return tree
}

/**
 * 获取系统角色列表
 *
 * @param {Object} database
 * @returns {Array} 角色列表
 */
export function getSystemRoles(database) {
  return generateSystemRoles(database)
}

/**
 * 获取系统菜单树（用于展示）
 *
 * @param {Object} database
 * @returns {Array} 菜单树
 */
export function getSystemMenus(database) {
  // 如果有存储的菜单树则使用，否则生成
  if (database.systemMenus && database.systemMenus.length > 0) {
    return database.systemMenus
  }
  return generateSystemMenus()
}

// ──── 操作日志 ────

/**
 * 操作日志模块列表
 */
const LOG_MODULES = [
  { module: 'auth', label: '认证管理', actions: ['login', 'logout'] },
  { module: 'customer', label: '客户管理', actions: ['create', 'update', 'delete', 'follow', 'assign'] },
  { module: 'opportunity', label: '商机管理', actions: ['create', 'update', 'delete', 'stage'] },
  { module: 'contract', label: '合同管理', actions: ['create', 'update', 'delete', 'approve', 'reject', 'sign', 'archive', 'attachment'] },
  { module: 'ticket', label: '工单管理', actions: ['create', 'assign', 'status', 'note'] },
  { module: 'system', label: '系统管理', actions: ['create', 'update', 'delete', 'status'] }
]

export { LOG_MODULES }

/**
 * 生成操作日志（30~50 条）
 *
 * @param {Array} profiles - 用户档案
 * @returns {Array} 操作日志列表
 */
export function generateOperationLogs(profiles) {
  const count = faker.number.int({ min: 30, max: 50 })
  const logs = []

  for (let i = 0; i < count; i++) {
    const mod = faker.helpers.arrayElement(LOG_MODULES)
    const action = faker.helpers.arrayElement(mod.actions)
    const operator = faker.helpers.arrayElement(profiles)
    const success = faker.helpers.arrayElement([true, true, true, false])

    logs.push({
      id: faker.string.uuid(),
      operatorId: operator.id,
      operatorName: operator.name,
      module: mod.module,
      action,
      targetType: faker.helpers.arrayElement(['user', 'customer', 'opportunity', 'contract', 'ticket']),
      targetId: faker.string.uuid(),
      content: faker.helpers.arrayElement([
        `${mod.label} - ${action} 操作`,
        `执行${action}操作成功`,
        `${mod.label}数据变更`,
        `修改${mod.label}配置`
      ]),
      result: success ? 'success' : 'fail',
      ipAddress: faker.internet.ipv4(),
      userAgent: faker.helpers.arrayElement([
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Mobile/15E148'
      ]),
      operatedAt: faker.date.between({ from: '2026-06-01', to: new Date() }).toISOString()
    })
  }

  // 按时间降序
  logs.sort((a, b) => new Date(b.operatedAt) - new Date(a.operatedAt))
  return logs
}

/**
 * 组合查询操作日志
 *
 * @param {Object} database - 完整的数据集
 * @param {Object} searchParams
 * @param {string} [searchParams.keyword]        - 关键词
 * @param {string} [searchParams.module]          - 模块筛选
 * @param {string} [searchParams.operatorId]      - 操作人筛选
 * @param {string} [searchParams.result]          - 结果筛选 success/fail
 * @param {string} [searchParams.operatedStart]   - 操作日期起始
 * @param {string} [searchParams.operatedEnd]     - 操作日期截止
 * @param {number} [searchParams.page=1]
 * @param {number} [searchParams.pageSize=20]
 * @returns {{ list: Array, total: number, page: number, pageSize: number }}
 */
export function querySystemLogs(database, searchParams = {}) {
  const { operationLogs = [] } = database
  const profileMap = new Map((database.profiles || []).map(p => [p.id, p.name]))

  let filtered = [...operationLogs]

  const { keyword, module, operatorId, result, operatedStart, operatedEnd } = searchParams
  let page = parseInt(searchParams.page, 10) || 1
  let pageSize = parseInt(searchParams.pageSize, 10) || 20

  if (page < 1) page = 1
  if (pageSize < 1) pageSize = 20
  if (pageSize > 100) pageSize = 100

  // 关键词
  if (keyword && keyword.trim()) {
    const kw = keyword.trim().toLowerCase()
    filtered = filtered.filter(l =>
      (l.content || '').toLowerCase().includes(kw) ||
      (l.operatorName || '').toLowerCase().includes(kw) ||
      (l.module || '').toLowerCase().includes(kw) ||
      (l.action || '').toLowerCase().includes(kw)
    )
  }

  // 模块
  if (module) {
    filtered = filtered.filter(l => l.module === module)
  }

  // 操作人
  if (operatorId) {
    filtered = filtered.filter(l => l.operatorId === operatorId)
  }

  // 结果
  if (result) {
    filtered = filtered.filter(l => l.result === result)
  }

  // 操作日期范围
  if (operatedStart) {
    const start = new Date(operatedStart)
    start.setHours(0, 0, 0, 0)
    if (!Number.isNaN(start.getTime())) {
      filtered = filtered.filter(l => new Date(l.operatedAt).getTime() >= start.getTime())
    }
  }
  if (operatedEnd) {
    const end = new Date(operatedEnd)
    end.setHours(23, 59, 59, 999)
    if (!Number.isNaN(end.getTime())) {
      filtered = filtered.filter(l => new Date(l.operatedAt).getTime() <= end.getTime())
    }
  }

  const total = filtered.length
  const start = (page - 1) * pageSize
  const paged = filtered.slice(start, start + pageSize)

  const list = paged.map(l => ({
    ...l,
    operatorName: profileMap.get(l.operatorId) || l.operatorName || '未知用户',
    moduleLabel: LOG_MODULES.find(m => m.module === l.module)?.label || l.module,
    resultLabel: l.result === 'success' ? '成功' : '失败',
    resultType: l.result === 'success' ? 'success' : 'danger'
  }))

  return { list, total, page, pageSize }
}

/**
 * 创建操作日志条目
 *
 * @param {Object} database - 完整数据集（会被修改）
 * @param {Object} logData
 * @param {string} logData.operatorId - 操作人 ID
 * @param {string} logData.module     - 模块名
 * @param {string} logData.action     - 动作
 * @param {string} [logData.targetType] - 目标类型
 * @param {string} [logData.targetId]   - 目标 ID
 * @param {string} [logData.content]    - 操作内容
 * @param {string} [logData.result]     - 结果（success/fail）
 * @returns {Object} 创建的日志条目
 */
export function createOperationLogEntry(database, logData) {
  if (!database.operationLogs) {
    database.operationLogs = []
  }

  const entry = {
    id: faker.string.uuid(),
    operatorId: logData.operatorId,
    operatorName: (database.profiles || []).find(p => p.id === logData.operatorId)?.name || '未知用户',
    module: logData.module || 'system',
    action: logData.action || 'unknown',
    targetType: logData.targetType || '',
    targetId: logData.targetId || '',
    content: logData.content || '',
    result: logData.result || 'success',
    ipAddress: faker.internet.ipv4(),
    operatedAt: new Date().toISOString()
  }

  database.operationLogs.unshift(entry)
  return entry
}
