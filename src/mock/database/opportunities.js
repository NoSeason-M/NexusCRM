/**
 * 商机数据查询层
 *
 * 提供组合查询、筛选、分页、统计聚合、输入校验、阶段流转、详情检索功能。
 */
import {
  OPP_STAGE_LABELS,
  OPP_STAGE_PROBABILITY,
  OPP_STAGE_ORDER,
  OPP_STAGE_TRANSITIONS
} from './seed'

// 有效的阶段值集合（不含 won/lost 用于编辑态）
const VALID_EDIT_STAGES = new Set(['lead', 'qualified', 'proposal', 'negotiation'])

/**
 * 组合查询商机列表（含关键词搜索、多条件筛选、分页）
 *
 * @param {Object} database - 完整的数据集
 * @param {Object} searchParams - 查询参数
 * @param {string}  [searchParams.keyword]              - 关键词（模糊匹配 title / customerName）
 * @param {string}  [searchParams.stage]                - 阶段筛选
 * @param {string}  [searchParams.ownerId]               - 负责人筛选
 * @param {string}  [searchParams.expectedCloseStart]    - 预计关闭日期起始
 * @param {string}  [searchParams.expectedCloseEnd]      - 预计关闭日期截止
 * @param {number}  [searchParams.page=1]                - 页码（从 1 开始）
 * @param {number}  [searchParams.pageSize=10]           - 每页条数（最大 100）
 * @returns {{ list: Array, total: number, page: number, pageSize: number }}
 */
export function queryOpportunities(database, searchParams = {}) {
  const { opportunities, customers, profiles } = database

  // 构建名称映射
  const customerNames = new Map(customers.map(c => [c.id, c.name]))
  const ownerNames = new Map(profiles.map(u => [u.id, u.name]))

  // 参数提取与默认值
  const { keyword, stage, ownerId, expectedCloseStart, expectedCloseEnd } = searchParams
  let page = parseInt(searchParams.page, 10) || 1
  let pageSize = parseInt(searchParams.pageSize, 10) || 10

  if (page < 1) page = 1
  if (pageSize < 1) pageSize = 10
  if (pageSize > 100) pageSize = 100

  // 筛选
  let filtered = [...opportunities]

  // 关键词搜索：title / customerName
  if (keyword && keyword.trim()) {
    const kw = keyword.trim().toLowerCase()
    filtered = filtered.filter(o =>
      o.title.toLowerCase().includes(kw) ||
      (customerNames.get(o.customerId) || '').toLowerCase().includes(kw)
    )
  }

  // 阶段筛选
  if (stage) {
    filtered = filtered.filter(o => o.stage === stage)
  }

  // 负责人筛选
  if (ownerId) {
    filtered = filtered.filter(o => o.ownerId === ownerId)
  }

  // 预计关闭日期范围
  if (expectedCloseStart) {
    const start = new Date(expectedCloseStart).getTime()
    if (!Number.isNaN(start)) {
      filtered = filtered.filter(o => new Date(o.expectedCloseDate).getTime() >= start)
    }
  }
  if (expectedCloseEnd) {
    const end = new Date(expectedCloseEnd).getTime()
    if (!Number.isNaN(end)) {
      filtered = filtered.filter(o => new Date(o.expectedCloseDate).getTime() <= end)
    }
  }

  // 总数
  const total = filtered.length

  // 分页
  const start = (page - 1) * pageSize
  const paged = filtered.slice(start, start + pageSize)

  // 补充客户名称、负责人名称、逾期标记
  const now = new Date()
  const list = paged.map(o => ({
    ...o,
    customerName: customerNames.get(o.customerId) || '未知客户',
    ownerName: ownerNames.get(o.ownerId) || '未知用户',
    overdue: o.stage !== 'won' && o.stage !== 'lost' && new Date(o.expectedCloseDate) < now,
    stageLabel: OPP_STAGE_LABELS[o.stage] || o.stage
  }))

  return { list, total, page, pageSize }
}

/**
 * 获取商机筛选选项
 *
 * @param {Object} database - 完整的数据集
 * @returns {{ stages: Array<{ value: string, label: string }>, owners: Array<{ id: string, name: string }> }}
 */
export function getOpportunityOptions(database) {
  const { profiles } = database

  const stages = OPP_STAGE_ORDER.map(s => ({
    value: s,
    label: OPP_STAGE_LABELS[s] || s
  }))

  const owners = profiles
    .filter(p => p.status !== 'inactive')
    .map(p => ({ id: p.id, name: p.name }))

  return { stages, owners }
}

/**
 * 创建商机统计概览
 *
 * @param {Object} database - 完整的数据集
 * @param {Object} searchParams - 筛选参数（与 queryOpportunities 一致，不含分页）
 * @returns {Object} 统计结果
 */
export function createOpportunityStatistics(database, searchParams = {}) {
  const { opportunities, customers } = database
  const customerNames = new Map(customers.map(c => [c.id, c.name]))

  const { keyword, stage, ownerId, expectedCloseStart, expectedCloseEnd } = searchParams

  let filtered = [...opportunities]

  if (keyword && keyword.trim()) {
    const kw = keyword.trim().toLowerCase()
    filtered = filtered.filter(o =>
      o.title.toLowerCase().includes(kw) ||
      (customerNames.get(o.customerId) || '').toLowerCase().includes(kw)
    )
  }

  if (stage) filtered = filtered.filter(o => o.stage === stage)
  if (ownerId) filtered = filtered.filter(o => o.ownerId === ownerId)

  if (expectedCloseStart) {
    const start = new Date(expectedCloseStart).getTime()
    if (!Number.isNaN(start)) filtered = filtered.filter(o => new Date(o.expectedCloseDate).getTime() >= start)
  }
  if (expectedCloseEnd) {
    const end = new Date(expectedCloseEnd).getTime()
    if (!Number.isNaN(end)) filtered = filtered.filter(o => new Date(o.expectedCloseDate).getTime() <= end)
  }

  const now = new Date()

  const totalCount = filtered.length
  const totalAmount = filtered.reduce((sum, o) => sum + o.amount, 0)
  const wonAmount = filtered.filter(o => o.stage === 'won').reduce((sum, o) => sum + o.amount, 0)

  const activeStages = new Set(['lead', 'qualified', 'proposal', 'negotiation'])
  const activeOpps = filtered.filter(o => activeStages.has(o.stage))
  const averageProbability = activeOpps.length > 0
    ? Math.round(activeOpps.reduce((sum, o) => sum + o.probability, 0) / activeOpps.length)
    : 0

  const overdueCount = filtered.filter(o =>
    o.stage !== 'won' && o.stage !== 'lost' && new Date(o.expectedCloseDate) < now
  ).length

  const stageMap = new Map()
  for (const opp of filtered) {
    if (!stageMap.has(opp.stage)) {
      stageMap.set(opp.stage, { count: 0, amount: 0 })
    }
    const entry = stageMap.get(opp.stage)
    entry.count++
    entry.amount += opp.amount
  }

  const byStage = OPP_STAGE_ORDER.map(s => ({
    stage: s,
    label: OPP_STAGE_LABELS[s] || s,
    probability: OPP_STAGE_PROBABILITY[s] || 0,
    count: stageMap.get(s)?.count || 0,
    amount: stageMap.get(s)?.amount || 0
  }))

  return { totalCount, totalAmount, wonAmount, averageProbability, overdueCount, byStage }
}

/**
 * 获取商机详情（含阶段流转记录）
 *
 * @param {Object} database - 完整的数据集
 * @param {string} id - 商机 ID
 * @returns {Object|null} 详情（含 customerName/ownerName/stageRecords），不存在返回 null
 */
export function getOpportunityDetail(database, id) {
  const { opportunities, customers, profiles, opportunityStageRecords } = database

  const opp = opportunities.find(o => o.id === id)
  if (!opp) return null

  const customerNames = new Map(customers.map(c => [c.id, c.name]))
  const ownerNames = new Map(profiles.map(u => [u.id, u.name]))

  // 阶段流转记录
  const stageRecords = (opportunityStageRecords || [])
    .filter(r => r.opportunityId === id)
    .map(r => ({
      ...r,
      changedByName: ownerNames.get(r.changedBy) || '未知用户'
    }))
    .sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt))

  return {
    ...opp,
    customerName: customerNames.get(opp.customerId) || '未知客户',
    ownerName: ownerNames.get(opp.ownerId) || '未知用户',
    stageLabel: OPP_STAGE_LABELS[opp.stage] || opp.stage,
    stageRecords
  }
}

/**
 * 校验并规范化商机输入
 *
 * @param {Object} database - 完整的数据集
 * @param {Object} input - 客户端提交的原始数据
 * @param {string} [excludeId] - 排除的商机 ID（编辑时用于跳过自身校验）
 * @returns {{ valid: boolean, errors: Array<{ field: string, code: number, message: string }>, data?: Object }}
 */
export function validateOpportunityInput(database, input) {
  const errors = []

  // title：必填，1~100 字符
  const title = (input.title || '').trim()
  if (!title) {
    errors.push({ field: 'title', code: 104001, message: '商机名称不能为空' })
  } else if (title.length > 100) {
    errors.push({ field: 'title', code: 104001, message: '商机名称不能超过 100 个字符' })
  }

  // customerId：必填
  if (!input.customerId) {
    errors.push({ field: 'customerId', code: 104002, message: '请选择客户' })
  } else {
    const customerExists = database.customers.some(c => c.id === input.customerId && c.status !== 'inactive')
    if (!customerExists) {
      errors.push({ field: 'customerId', code: 104002, message: '指定的客户不存在或已流失' })
    }
  }

  // amount：必填，大于 0
  const amount = parseFloat(input.amount)
  if (!input.amount || Number.isNaN(amount) || amount <= 0) {
    errors.push({ field: 'amount', code: 104003, message: '商机金额必须大于 0' })
  }

  // stage：创建时可选的，编辑时不能是 won/lost
  if (input.stage && !VALID_EDIT_STAGES.has(input.stage)) {
    errors.push({ field: 'stage', code: 104004, message: '商机阶段无效，仅允许 lead/qualified/proposal/negotiation' })
  }

  // ownerId：如果提供了，必须存在于 profiles
  if (input.ownerId) {
    const ownerExists = database.profiles.some(p => p.id === input.ownerId && p.status !== 'inactive')
    if (!ownerExists) {
      errors.push({ field: 'ownerId', code: 104005, message: '指定的负责人不存在或已停用' })
    }
  }

  // nextStep：可选，最多 500
  if (input.nextStep && input.nextStep.length > 500) {
    errors.push({ field: 'nextStep', code: 104006, message: '下一步计划不能超过 500 个字符' })
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  const data = normalizeOpportunityInput(input)
  return { valid: true, errors: [], data }
}

/**
 * 规范化商机输入
 */
export function normalizeOpportunityInput(input) {
  const trim = (v) => (typeof v === 'string' ? v.trim() : v)
  const toNull = (v) => (v === '' || v === undefined ? null : v)

  return {
    title: trim(input.title) || '',
    customerId: input.customerId || '',
    ownerId: input.ownerId || '',
    amount: parseFloat(input.amount) || 0,
    stage: input.stage || 'lead',
    probability: input.probability !== undefined ? input.probability : (OPP_STAGE_PROBABILITY[input.stage] || 10),
    expectedCloseDate: input.expectedCloseDate || null,
    nextStep: toNull(trim(input.nextStep)),
    description: toNull(trim(input.description))
  }
}

/**
 * 获取允许的阶段流转目标
 *
 * @param {string} stage - 当前阶段
 * @returns {Array<{ stage: string, label: string, probability: number }>}
 */
export function getAllowedStageTransitions(stage) {
  const targetStages = OPP_STAGE_TRANSITIONS[stage] || []
  return targetStages.map(s => ({
    stage: s,
    label: OPP_STAGE_LABELS[s] || s,
    probability: OPP_STAGE_PROBABILITY[s] || 0
  }))
}

/**
 * 校验阶段流转请求
 *
 * @param {Object} opportunity - 当前商机对象
 * @param {Object} input - 流转请求 { toStage, note? }
 * @returns {{ valid: boolean, errors: Array<{ field: string, code: number, message: string }> }}
 */
export function validateStageTransition(opportunity, input) {
  const errors = []

  if (!input.toStage) {
    errors.push({ field: 'toStage', code: 104010, message: '目标阶段不能为空' })
    return { valid: false, errors }
  }

  // 校验是否允许流转
  const allowed = OPP_STAGE_TRANSITIONS[opportunity.stage] || []
  if (!allowed.includes(input.toStage)) {
    const allowedLabels = allowed.map(s => OPP_STAGE_LABELS[s] || s).join('、')
    errors.push({
      field: 'toStage',
      code: 104011,
      message: `不允许从「${OPP_STAGE_LABELS[opportunity.stage] || opportunity.stage}」流转到「${OPP_STAGE_LABELS[input.toStage] || input.toStage}」，允许的目标：${allowedLabels}`
    })
  }

  // 已是 won/lost 不可再流转
  if (opportunity.stage === 'won' || opportunity.stage === 'lost') {
    errors.push({
      field: 'stage',
      code: 104012,
      message: '已结束的商机（赢单/输单）不可再流转'
    })
  }

  // note：可选，最多 500
  if (input.note && input.note.length > 500) {
    errors.push({ field: 'note', code: 104013, message: '流转备注不能超过 500 个字符' })
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 创建商机看板数据 — 按阶段分组
 *
 * 返回按 OPP_STAGE_ORDER 排序的阶段列表，每个阶段包含该阶段的商机卡片列表。
 *
 * @param {Object} database - 完整的数据集
 * @returns {Array<{ stage, label, probability, count, amount, opportunities: Array }>}
 */
export function createOpportunityBoard(database) {
  const { opportunities, customers, profiles } = database

  const customerNames = new Map(customers.map(c => [c.id, c.name]))
  const ownerNames = new Map(profiles.map(u => [u.id, u.name]))

  const now = new Date()

  // 初始化空阶段分组
  const stageGroups = OPP_STAGE_ORDER.map(stage => ({
    stage,
    label: OPP_STAGE_LABELS[stage] || stage,
    probability: OPP_STAGE_PROBABILITY[stage] || 0,
    count: 0,
    amount: 0,
    opportunities: []
  }))

  const stageMap = new Map(stageGroups.map(g => [g.stage, g]))

  // 按阶段分组
  for (const opp of opportunities) {
    const group = stageMap.get(opp.stage)
    if (!group) continue

    group.count++
    group.amount += opp.amount
    group.opportunities.push({
      ...opp,
      customerName: customerNames.get(opp.customerId) || '未知客户',
      ownerName: ownerNames.get(opp.ownerId) || '未知用户',
      overdue: opp.stage !== 'won' && opp.stage !== 'lost' && new Date(opp.expectedCloseDate) < now,
      stageLabel: OPP_STAGE_LABELS[opp.stage] || opp.stage
    })
  }

  return stageGroups
}

/**
 * 检查删除商机时的关联冲突
 *
 * @param {Object} database - 完整的数据集
 * @param {string} opportunityId - 商机 ID
 * @returns {{ hasConflict: boolean, conflicts: Array<{ type: string, count: number }> }}
 */
export function getOpportunityDeleteConflict(database, opportunityId) {
  const { contracts } = database
  const conflicts = []

  const ctrCount = contracts.filter(c => c.opportunityId === opportunityId).length
  if (ctrCount > 0) conflicts.push({ type: 'contracts', count: ctrCount })

  return {
    hasConflict: conflicts.length > 0,
    conflicts
  }
}
