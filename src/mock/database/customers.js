/**
 * 客户数据查询层
 *
 * 提供组合查询、筛选、分页及详情检索功能，
 * 模拟后端 SQL 查询逻辑。
 */
import {
  CUSTOMER_STATUSES,
  CUSTOMER_LEVELS,
  INDUSTRIES,
  SOURCES,
  FOLLOW_METHODS,
  FOLLOW_METHOD_LABELS
} from './seed'

// 有效的客户状态值集合
const VALID_STATUSES = new Set(CUSTOMER_STATUSES)
// 有效的客户级别值集合
const VALID_LEVELS = new Set(CUSTOMER_LEVELS)
// 有效的行业值集合
const VALID_INDUSTRIES = new Set(INDUSTRIES)
// 有效的来源值集合
const VALID_SOURCES = new Set(SOURCES)

/**
 * 校验并规范化客户输入
 *
 * @param {Object} database - 完整的数据集
 * @param {Object} input - 客户端提交的原始数据
 * @param {string} [excludeId] - 排除的客户 ID（编辑时用于跳过自身校验）
 * @returns {{ valid: boolean, errors: Array<{ field: string, code: number, message: string }>, data?: Object }}
 */
export function validateCustomerInput(database, input, excludeId) {
  const errors = []

  // name：必填，1~50 字符
  const name = (input.name || '').trim()
  if (!name) {
    errors.push({ field: 'name', code: 103001, message: '客户名称不能为空' })
  } else if (name.length > 50) {
    errors.push({ field: 'name', code: 103001, message: '客户名称不能超过 50 个字符' })
  } else {
    // 重名校验（排除自身）
    const duplicate = database.customers.find(
      c => c.name === name && c.id !== excludeId
    )
    if (duplicate) {
      errors.push({ field: 'name', code: 103002, message: '客户名称已存在' })
    }
  }

  // status：必填，必须在有效集合内
  if (input.status && !VALID_STATUSES.has(input.status)) {
    errors.push({ field: 'status', code: 500, message: '无效的客户状态' })
  }

  // level：必填，必须在有效集合内
  if (input.level && !VALID_LEVELS.has(input.level)) {
    errors.push({ field: 'level', code: 500, message: '无效的客户级别' })
  }

  // industry：可选，如果提供必须在有效集合内
  if (input.industry && !VALID_INDUSTRIES.has(input.industry)) {
    errors.push({ field: 'industry', code: 500, message: '无效的行业' })
  }

  // source：可选，如果提供必须在有效集合内
  if (input.source && !VALID_SOURCES.has(input.source)) {
    errors.push({ field: 'source', code: 500, message: '无效的来源渠道' })
  }

  // contactPhone：可选，如果提供需要是有效手机号（简单校验）
  if (input.contactPhone) {
    const phone = String(input.contactPhone).trim()
    if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
      errors.push({ field: 'contactPhone', code: 110001, message: '联系电话格式不正确' })
    }
  }

  // ownerId：如果提供了，必须存在于 profiles
  if (input.ownerId) {
    const ownerExists = database.profiles.some(p => p.id === input.ownerId && p.status !== 'inactive')
    if (!ownerExists) {
      errors.push({ field: 'ownerId', code: 500, message: '指定的负责人不存在或已停用' })
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  // 规范化数据
  const data = normalizeCustomerInput(input)
  return { valid: true, errors: [], data }
}

/**
 * 规范化客户输入（去除首尾空格、空字符串转 null 等）
 *
 * @param {Object} input
 * @returns {Object}
 */
export function normalizeCustomerInput(input) {
  const trim = (v) => (typeof v === 'string' ? v.trim() : v)
  const toNull = (v) => (v === '' || v === undefined ? null : v)

  return {
    name: trim(input.name) || '',
    industry: toNull(trim(input.industry)),
    level: input.level || 'regular',
    status: input.status || 'active',
    ownerId: input.ownerId || '',
    province: toNull(trim(input.province)),
    city: toNull(trim(input.city)),
    address: toNull(trim(input.address)),
    source: toNull(trim(input.source)),
    contactName: toNull(trim(input.contactName)),
    contactPhone: toNull(trim(input.contactPhone)),
    contactTitle: toNull(trim(input.contactTitle)),
    contactEmail: toNull(trim(input.contactEmail)),
    description: toNull(trim(input.description))
  }
}

/**
 * 检查负责人 ID 是否有效
 *
 * @param {Object} database
 * @param {string} ownerId
 * @returns {boolean}
 */
export function isValidCustomerOwner(database, ownerId) {
  if (!ownerId) return false
  return database.profiles.some(p => p.id === ownerId && p.status !== 'inactive')
}

/**
 * 检查删除客户时的关联冲突
 *
 * @param {Object} database - 完整的数据集
 * @param {string} customerId - 客户 ID
 * @returns {{ hasConflict: boolean, conflicts: Array<{ type: string, count: number }> }}
 */
export function getCustomerDeleteConflict(database, customerId) {
  const { opportunities, contracts, tickets } = database
  const conflicts = []

  const oppCount = opportunities.filter(o => o.customerId === customerId).length
  if (oppCount > 0) conflicts.push({ type: 'opportunities', count: oppCount })

  const ctrCount = contracts.filter(c => c.customerId === customerId).length
  if (ctrCount > 0) conflicts.push({ type: 'contracts', count: ctrCount })

  const tktCount = tickets.filter(t => t.customerId === customerId).length
  if (tktCount > 0) conflicts.push({ type: 'tickets', count: tktCount })

  return {
    hasConflict: conflicts.length > 0,
    conflicts
  }
}

/**
 * 组合查询客户列表（含关键词搜索、多条件筛选、分页）
 *
 * @param {Object} database - 完整的数据集（store）
 * @param {Object} searchParams - 查询参数
 * @param {string}  [searchParams.keyword]    - 关键词（模糊匹配 name/contactName/contactPhone/address）
 * @param {string}  [searchParams.industry]   - 行业筛选
 * @param {string}  [searchParams.level]      - 客户级别筛选
 * @param {string}  [searchParams.status]     - 状态筛选
 * @param {string}  [searchParams.ownerId]    - 负责人筛选
 * @param {number}  [searchParams.page=1]     - 页码（从 1 开始）
 * @param {number}  [searchParams.pageSize=10] - 每页条数（最大 100）
 * @returns {{ list: Array, total: number, page: number, pageSize: number }}
 */
export function queryCustomers(database, searchParams = {}) {
  const { customers, profiles } = database

  // 构建负责人名称映射
  const ownerNames = new Map(profiles.map(u => [u.id, u.name]))

  // 参数提取与默认值
  const { keyword, industry, level, status, ownerId } = searchParams
  let page = parseInt(searchParams.page, 10) || 1
  let pageSize = parseInt(searchParams.pageSize, 10) || 10

  // 边界处理：page 至少为 1
  if (page < 1) page = 1
  // pageSize 限制 1~100
  if (pageSize < 1) pageSize = 10
  if (pageSize > 100) pageSize = 100

  // 筛选
  let filtered = [...customers]

  // 关键词搜索：匹配 name / contactName / contactPhone / address
  if (keyword && keyword.trim()) {
    const kw = keyword.trim().toLowerCase()
    filtered = filtered.filter(c =>
      c.name.toLowerCase().includes(kw) ||
      (c.contactName || '').toLowerCase().includes(kw) ||
      (c.contactPhone || '').toLowerCase().includes(kw) ||
      (c.address || '').toLowerCase().includes(kw)
    )
  }

  // 行业筛选
  if (industry) {
    filtered = filtered.filter(c => c.industry === industry)
  }

  // 客户级别筛选
  if (level) {
    filtered = filtered.filter(c => c.level === level)
  }

  // 状态筛选
  if (status) {
    filtered = filtered.filter(c => c.status === status)
  }

  // 负责人筛选
  if (ownerId) {
    filtered = filtered.filter(c => c.ownerId === ownerId)
  }

  // 总数
  const total = filtered.length

  // 分页
  const start = (page - 1) * pageSize
  const paged = filtered.slice(start, start + pageSize)

  // 补充 ownerName
  const list = paged.map(c => ({
    ...c,
    ownerName: ownerNames.get(c.ownerId) || '未知用户'
  }))

  return { list, total, page, pageSize }
}

/**
 * 获取客户筛选选项（用于下拉筛选器）
 *
 * @param {Object} database - 完整的数据集
 * @returns {{ industries: Array<string>, levels: Array<string>, statuses: Array<Object>, owners: Array<{ id: string, name: string }> }}
 */
export function getCustomerOptions(database) {
  const { customers, profiles } = database

  // 从已有数据中提取去重后的行业/级别列表
  const industries = [...new Set(customers.map(c => c.industry).filter(Boolean))].sort()
  const levels = [...new Set(customers.map(c => c.level).filter(Boolean))].sort()

  // 状态带中文标签
  const statusMap = {
    active: '活跃',
    potential: '潜在',
    inactive: '已流失',
    at_risk: '风险',
    lead: '线索'
  }
  const statuses = [...new Set(customers.map(c => c.status).filter(Boolean))].map(s => ({
    value: s,
    label: statusMap[s] || s
  }))

  // 负责人列表（所有活跃用户，用于筛选）
  const owners = profiles
    .filter(p => p.status !== 'inactive')
    .map(p => ({ id: p.id, name: p.name }))

  return { industries, levels, statuses, owners }
}

/**
 * 获取客户详情（含负责人信息、联系人与跟进记录）
 *
 * @param {Object} database - 完整的数据集
 * @param {string} id - 客户 ID
 * @returns {Object|null} 客户详情（含 owner / contacts / followRecords），不存在返回 null
 */
export function getCustomerDetail(database, id) {
  const { customers, profiles } = database

  const customer = customers.find(c => c.id === id)
  if (!customer) return null

  const users = new Map(profiles.map(u => [u.id, u]))

  const owner = users.get(customer.ownerId)

  return {
    ...customer,
    ownerName: owner?.name || '未知用户',
    // 负责人对象
    owner: owner ? {
      id: owner.id,
      name: owner.name,
      email: owner.email,
      phone: owner.phone,
      avatar: owner.avatar,
      role: owner.role,
      roleName: owner.roleName
    } : null,
    // 联系人列表
    contacts: [
      {
        name: customer.contactName,
        phone: customer.contactPhone,
        title: customer.contactTitle,
        email: customer.contactEmail,
        primary: true
      }
    ],
    // 跟进记录（按时间倒序）
    followRecords: database.recentFollows
      ? database.recentFollows
          .filter(f => f.customerId === id)
          .map(f => ({
            ...f,
            ownerName: users.get(f.ownerId)?.name || '未知用户'
          }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      : []
  }
}

/**
 * 校验跟进记录输入
 *
 * @param {Object} input - 跟进记录数据
 * @returns {{ valid: boolean, errors: Array<{ field: string, message: string }> }}
 */
export function validateFollowRecordInput(input) {
  const errors = []

  // method：必填，枚举值
  const method = (input.method || '').trim()
  if (!method) {
    errors.push({ field: 'method', message: '跟进方式不能为空' })
  } else if (!FOLLOW_METHODS.includes(method)) {
    errors.push({ field: 'method', message: '无效的跟进方式' })
  }

  // content：必填，最多 500 字
  const content = (input.content || '').trim()
  if (!content) {
    errors.push({ field: 'content', message: '跟进内容不能为空' })
  } else if (content.length > 500) {
    errors.push({ field: 'content', message: '跟进内容不能超过 500 个字符' })
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
