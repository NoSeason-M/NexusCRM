/**
 * 销售线索数据层
 *
 * 提供线索的组合查询、筛选选项、详情、增删改、批量分配、跟进等功能。
 */
import { faker } from '@faker-js/faker/locale/zh_CN'
import { FOLLOW_METHODS, FOLLOW_METHOD_LABELS, SOURCES, CUSTOMER_LEVELS, INDUSTRIES } from './seed'

export { FOLLOW_METHODS, FOLLOW_METHOD_LABELS }

/**
 * 线索来源
 */
export const LEAD_SOURCES = ['online', 'referral', 'event', 'cold_call', 'social', 'advertisement', 'partner']

export const LEAD_SOURCE_LABELS = {
  online: '线上注册',
  referral: '客户推荐',
  event: '活动推广',
  cold_call: '电话邀约',
  social: '社交媒体',
  advertisement: '广告投放',
  partner: '合作伙伴'
}

/**
 * 线索状态
 */
export const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'converted', 'closed']

export const LEAD_STATUS_LABELS = {
  new: '新线索',
  contacted: '已联系',
  qualified: '已确认',
  converted: '已转化',
  closed: '已关闭'
}

export const LEAD_STATUS_TYPES = {
  new: 'info',
  contacted: 'primary',
  qualified: 'warning',
  converted: 'success',
  closed: 'danger'
}

/**
 * 意向级别
 */
export const LEAD_INTENTION_LEVELS = ['high', 'medium', 'low']

export const LEAD_INTENTION_LABELS = {
  high: '高意向',
  medium: '中意向',
  low: '低意向'
}

export const LEAD_INTENTION_TYPES = {
  high: 'danger',
  medium: 'warning',
  low: 'info'
}

/**
 * 生成销售线索数据（40条）
 *
 * 约 30 条有 lastFollowAt（已跟进），10 条为 null（未跟进）
 *
 * @param {Array} profiles - 用户档案列表
 * @param {Array} campaigns - 营销活动列表（可选）
 * @param {Array} customers - 客户列表（可选）
 * @returns {Array} 线索列表
 */
export function generateLeads(profiles, campaigns = [], customers = []) {
  const count = 40
  const leads = []

  for (let i = 0; i < count; i++) {
    const status = faker.helpers.arrayElement(LEAD_STATUSES)
    const intentionLevel = faker.helpers.arrayElement(LEAD_INTENTION_LEVELS)
    const source = faker.helpers.arrayElement(LEAD_SOURCES)
    const createdAt = faker.date.between({ from: '2026-03-01', to: new Date() }).toISOString()

    // 部分线索未分配（约 30%）
    const hasOwner = faker.helpers.arrayElement([true, true, true, false])
    const ownerId = hasOwner ? faker.helpers.arrayElement(profiles).id : null

    // 已转化线索关联客户
    const customerId = status === 'converted' && customers.length > 0
      ? faker.helpers.arrayElement(customers).id
      : null

    // 部分线索关联营销活动
    const hasCampaign = campaigns.length > 0 && faker.helpers.arrayElement([true, false, false])

    // 转化时间
    const convertedAt = status === 'converted'
      ? faker.date.between({ from: createdAt, to: new Date() }).toISOString()
      : null

    // lastFollowAt — 约 30 条有值，10 条 null
    const hasFollow = i < 30
    const lastFollowAt = hasFollow
      ? faker.date.between({ from: createdAt, to: new Date() }).toISOString()
      : null

    leads.push({
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      company: faker.helpers.arrayElement([
        faker.company.name(),
        faker.company.name(),
        faker.company.name(),
        ''
      ]),
      phone: faker.phone.number(),
      email: faker.internet.email(),
      source,
      status,
      intentionLevel,
      ownerId,
      campaignId: hasCampaign ? faker.helpers.arrayElement(campaigns).id : null,
      customerId,
      lastFollowAt,
      convertedAt,
      remark: faker.helpers.arrayElement([
        '客户主动咨询产品信息',
        '展会现场收集的名片',
        '合作伙伴推荐客户',
        '通过官网下载资料',
        '参加线上研讨会获取',
        '',
        '',
        ''
      ]),
      createdAt,
      updatedAt: faker.date.between({ from: createdAt, to: new Date() }).toISOString()
    })
  }

  return leads
}

/**
 * 生成线索跟进记录（约 30 条/有 lastFollowAt 的线索 1~2 条）
 *
 * @param {Array} leads - 线索列表
 * @param {Array} profiles - 用户档案列表
 * @returns {Array} 跟进记录列表
 */
export function generateLeadFollowRecords(leads, profiles) {
  const records = []

  for (const lead of leads) {
    if (!lead.lastFollowAt) continue

    const count = faker.number.int({ min: 1, max: 2 })
    for (let i = 0; i < count; i++) {
      const method = faker.helpers.arrayElement(FOLLOW_METHODS)
      const createdAt = i === 0
        ? new Date(new Date(lead.createdAt).getTime() + 60000).toISOString()
        : faker.date.between({ from: lead.createdAt, to: new Date() }).toISOString()

      records.push({
        id: faker.string.uuid(),
        leadId: lead.id,
        ownerId: lead.ownerId || faker.helpers.arrayElement(profiles).id,
        method,
        content: faker.helpers.arrayElement([
          '初步沟通，客户对产品感兴趣',
          '发送了产品资料，等待回复',
          '电话沟通了需求细节',
          '约定下周进行产品演示',
          '客户表示需要考虑',
          '发送了报价方案',
          '跟进客户反馈，需求明确',
          '安排技术团队对接'
        ]),
        nextFollowAt: faker.date.between({ from: new Date(), to: '2026-08-31' }).toISOString(),
        createdAt
      })
    }
  }

  return records
}

/**
 * 组合查询销售线索
 *
 * @param {Object} database - 完整的数据集
 * @param {Object} searchParams
 * @param {string} [searchParams.keyword]         - 关键词（name/company/phone/email）
 * @param {string} [searchParams.source]           - 来源筛选
 * @param {string} [searchParams.status]           - 状态筛选
 * @param {string} [searchParams.intentionLevel]   - 意向级别筛选
 * @param {string} [searchParams.ownerId]          - 负责人筛选（"unassigned"=未分配）
 * @param {string} [searchParams.campaignId]       - 营销活动筛选
 * @param {string} [searchParams.createdStart]     - 创建日期起始
 * @param {string} [searchParams.createdEnd]       - 创建日期截止
 * @param {number} [searchParams.page=1]
 * @param {number} [searchParams.pageSize=20]
 * @returns {{ list: Array, total: number, page: number, pageSize: number }}
 */
export function queryLeads(database, searchParams = {}) {
  const { leads = [], profiles, campaigns = [], customers = [] } = database
  const profileNames = new Map((profiles || []).map(p => [p.id, p.name]))
  const customerNames = new Map((customers || []).map(c => [c.id, c.name]))
  const campaignNames = new Map((campaigns || []).map(c => [c.id, c.name]))

  let filtered = [...leads]

  const { keyword, source, status, intentionLevel, ownerId, campaignId, createdStart, createdEnd } = searchParams
  let page = parseInt(searchParams.page, 10) || 1
  let pageSize = parseInt(searchParams.pageSize, 10) || 20

  if (page < 1) page = 1
  if (pageSize < 1) pageSize = 20
  if (pageSize > 100) pageSize = 100

  // 关键词
  if (keyword && keyword.trim()) {
    const kw = keyword.trim().toLowerCase()
    filtered = filtered.filter(l =>
      l.name.toLowerCase().includes(kw) ||
      (l.company || '').toLowerCase().includes(kw) ||
      (l.phone || '').includes(kw) ||
      (l.email || '').toLowerCase().includes(kw)
    )
  }

  // 来源
  if (source) filtered = filtered.filter(l => l.source === source)
  // 状态
  if (status) filtered = filtered.filter(l => l.status === status)
  // 意向级别
  if (intentionLevel) filtered = filtered.filter(l => l.intentionLevel === intentionLevel)
  // 负责人（支持 unassigned）
  if (ownerId === 'unassigned') {
    filtered = filtered.filter(l => !l.ownerId)
  } else if (ownerId) {
    filtered = filtered.filter(l => l.ownerId === ownerId)
  }
  // 营销活动
  if (campaignId) filtered = filtered.filter(l => l.campaignId === campaignId)

  // 日期范围
  if (createdStart) {
    const start = new Date(createdStart)
    start.setHours(0, 0, 0, 0)
    if (!Number.isNaN(start.getTime())) {
      filtered = filtered.filter(l => new Date(l.createdAt).getTime() >= start.getTime())
    }
  }
  if (createdEnd) {
    const end = new Date(createdEnd)
    end.setHours(23, 59, 59, 999)
    if (!Number.isNaN(end.getTime())) {
      filtered = filtered.filter(l => new Date(l.createdAt).getTime() <= end.getTime())
    }
  }

  // 按 createdAt 降序
  filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const total = filtered.length
  const start = (page - 1) * pageSize
  const paged = filtered.slice(start, start + pageSize)

  const list = paged.map(l => ({
    ...l,
    ownerName: l.ownerId ? (profileNames.get(l.ownerId) || '未知用户') : null,
    sourceLabel: LEAD_SOURCE_LABELS[l.source] || l.source,
    statusLabel: LEAD_STATUS_LABELS[l.status] || l.status,
    statusType: LEAD_STATUS_TYPES[l.status] || 'info',
    intentionLabel: LEAD_INTENTION_LABELS[l.intentionLevel] || l.intentionLevel,
    intentionType: LEAD_INTENTION_TYPES[l.intentionLevel] || 'info',
    campaignName: l.campaignId ? (campaignNames.get(l.campaignId) || '') : null,
    customerName: l.customerId ? (customerNames.get(l.customerId) || '') : null
  }))

  return { list, total, page, pageSize }
}

/**
 * 获取线索筛选选项
 *
 * @param {Object} database
 * @returns {{ sources: Array, statuses: Array, intentionLevels: Array, owners: Array, campaigns: Array }}
 */
export function getLeadOptions(database) {
  const { profiles, campaigns = [] } = database

  const sources = LEAD_SOURCES.map(v => ({ value: v, label: LEAD_SOURCE_LABELS[v] || v }))
  const statuses = LEAD_STATUSES.map(v => ({ value: v, label: LEAD_STATUS_LABELS[v] || v }))
  const intentionLevels = LEAD_INTENTION_LEVELS.map(v => ({ value: v, label: LEAD_INTENTION_LABELS[v] || v }))
  const owners = (profiles || []).filter(p => p.status !== 'inactive').map(p => ({ id: p.id, name: p.name }))
  const campaignOpts = (campaigns || []).map(c => ({ id: c.id, name: c.name }))

  return { sources, statuses, intentionLevels, owners, campaigns: campaignOpts }
}

/**
 * 获取线索详情（含跟进记录）
 *
 * @param {Object} database
 * @param {string} id
 * @returns {Object|null}
 */
export function getLeadDetail(database, id) {
  const { leads = [], profiles, customers = [], campaigns = [], leadFollowRecords = [] } = database
  const lead = leads.find(l => l.id === id)
  if (!lead) return null

  const profileNames = new Map((profiles || []).map(p => [p.id, p.name]))
  const customerNames = new Map((customers || []).map(c => [c.id, c.name]))
  const campaignNames = new Map((campaigns || []).map(c => [c.id, c.name]))

  // 跟进记录（按时间升序）
  const followRecords = (leadFollowRecords || [])
    .filter(r => r.leadId === id)
    .map(r => ({
      ...r,
      ownerName: profileNames.get(r.ownerId) || '未知用户',
      methodLabel: FOLLOW_METHOD_LABELS[r.method] || r.method
    }))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

  return {
    ...lead,
    ownerName: lead.ownerId ? (profileNames.get(lead.ownerId) || '未知用户') : null,
    sourceLabel: LEAD_SOURCE_LABELS[lead.source] || lead.source,
    statusLabel: LEAD_STATUS_LABELS[lead.status] || lead.status,
    statusType: LEAD_STATUS_TYPES[lead.status] || 'info',
    intentionLabel: LEAD_INTENTION_LABELS[lead.intentionLevel] || lead.intentionLevel,
    intentionType: LEAD_INTENTION_TYPES[lead.intentionLevel] || 'info',
    campaignName: lead.campaignId ? (campaignNames.get(lead.campaignId) || '') : null,
    customerName: lead.customerId ? (customerNames.get(lead.customerId) || '') : null,
    followRecords
  }
}

/**
 * 校验线索输入
 *
 * @param {Object} database
 * @param {Object} input
 * @returns {{ valid: boolean, errors: Array, data?: Object }}
 */
export function validateLeadInput(database, input) {
  const errors = []
  const { profiles, leads = [] } = database

  // name — 必填，最大 50
  if (!input.name || !input.name.trim()) {
    errors.push({ code: 5001, message: '线索名称不能为空' })
  } else if (input.name.length > 50) {
    errors.push({ code: 5002, message: '线索名称不能超过 50 个字符' })
  }

  // source — 必填，枚举
  if (input.source && !LEAD_SOURCES.includes(input.source)) {
    errors.push({ code: 5003, message: '无效的线索来源' })
  }

  // status — 必填，枚举
  if (input.status && !LEAD_STATUSES.includes(input.status)) {
    errors.push({ code: 5004, message: '无效的线索状态' })
  }

  // intentionLevel — 必填，枚举
  if (input.intentionLevel && !LEAD_INTENTION_LEVELS.includes(input.intentionLevel)) {
    errors.push({ code: 5005, message: '无效的意向级别' })
  }

  // ownerId — 可选，必须存在且活跃
  if (input.ownerId) {
    const owner = profiles.find(p => p.id === input.ownerId)
    if (!owner) {
      errors.push({ code: 5006, message: '指定的负责人不存在' })
    } else if (owner.status === 'inactive') {
      errors.push({ code: 5007, message: '指定的负责人已停用' })
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  const data = {
    name: input.name.trim(),
    company: input.company ? input.company.trim() : '',
    phone: input.phone || '',
    email: input.email || '',
    source: input.source || 'online',
    status: input.status || 'new',
    intentionLevel: input.intentionLevel || 'medium',
    ownerId: input.ownerId || null,
    campaignId: input.campaignId || null,
    remark: input.remark ? input.remark.trim() : ''
  }

  return { valid: true, errors: [], data }
}

/**
 * 校验跟进记录输入
 *
 * @param {Object} input
 * @returns {{ valid: boolean, errors: Array }}
 */
export function validateLeadFollowInput(input) {
  const errors = []

  if (!input.method || !FOLLOW_METHODS.includes(input.method)) {
    errors.push({ code: 5101, message: '请选择跟进方式' })
  }

  if (!input.content || !input.content.trim()) {
    errors.push({ code: 5102, message: '跟进内容不能为空' })
  } else if (input.content.length > 500) {
    errors.push({ code: 5103, message: '跟进内容不能超过 500 个字符' })
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  return { valid: true, errors: [] }
}

/**
 * 校验线索转化输入
 *
 * @param {Object} database
 * @param {Object} input - { customerName, industry, level, contactName?, contactPhone?, contactTitle?, contactEmail?, description? }
 * @returns {{ valid: boolean, errors: Array, data?: Object }}
 */
export function validateLeadConversion(database, input = {}) {
  const errors = []

  // customerName — 必填，最大 50
  const name = (input.customerName || '').trim()
  if (!name) {
    errors.push({ code: 6001, message: '客户名称不能为空' })
  } else if (name.length > 50) {
    errors.push({ code: 6002, message: '客户名称不能超过 50 个字符' })
  }

  // industry — 必填，枚举
  if (input.industry && !INDUSTRIES.includes(input.industry)) {
    errors.push({ code: 6003, message: '无效的行业' })
  }

  // level — 必填，枚举
  if (input.level && !CUSTOMER_LEVELS.includes(input.level)) {
    errors.push({ code: 6004, message: '无效的客户级别' })
  }

  // contactPhone — 可选，格式校验
  if (input.contactPhone) {
    const phone = String(input.contactPhone).trim()
    if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
      errors.push({ code: 6005, message: '联系电话格式不正确' })
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  const data = {
    customerName: name,
    industry: input.industry || null,
    level: input.level || 'regular',
    // 从线索携带过来的联系人信息
    contactName: input.contactName ? input.contactName.trim() : null,
    contactPhone: input.contactPhone || null,
    contactTitle: input.contactTitle ? input.contactTitle.trim() : null,
    contactEmail: input.contactEmail || null,
    description: input.description ? input.description.trim() : ''
  }

  return { valid: true, errors: [], data }
}

/**
 * 创建线索跟进记录
 *
 * @param {Object} lead - 线索对象（引用，会被修改 lastFollowAt/updatedAt）
 * @param {Object} input - { method, content, nextFollowAt? }
 * @param {string} ownerId - 操作人 ID
 * @returns {{ record: Object, lead: Object }}
 */
export function createLeadFollow(lead, input, ownerId) {
  const now = new Date().toISOString()

  const record = {
    id: faker.string.uuid(),
    leadId: lead.id,
    ownerId,
    method: input.method,
    content: input.content.trim(),
    nextFollowAt: input.nextFollowAt || null,
    createdAt: now
  }

  // 更新线索
  lead.lastFollowAt = now
  lead.updatedAt = now

  return { record, lead }
}
