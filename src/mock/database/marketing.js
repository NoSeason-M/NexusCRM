/**
 * 营销活动数据层
 *
 * 提供组合查询、筛选选项、详情查询、指标计算、增删改等功能。
 */
import { faker } from '@faker-js/faker/locale/zh_CN'

/**
 * 活动类型
 */
export const CAMPAIGN_TYPES = ['promotion', 'event', 'content', 'social', 'email', 'advertisement']

export const CAMPAIGN_TYPE_LABELS = {
  promotion: '促销活动',
  event: '线下活动',
  content: '内容营销',
  social: '社交媒体',
  email: '邮件营销',
  advertisement: '广告投放'
}

/**
 * 活动状态
 */
export const CAMPAIGN_STATUSES = ['planning', 'active', 'paused', 'completed', 'cancelled']

export const CAMPAIGN_STATUS_LABELS = {
  planning: '规划中',
  active: '进行中',
  paused: '已暂停',
  completed: '已结束',
  cancelled: '已取消'
}

export const CAMPAIGN_STATUS_TYPES = {
  planning: 'info',
  active: 'success',
  paused: 'warning',
  completed: 'primary',
  cancelled: 'danger'
}

/**
 * 营销渠道
 */
export const CAMPAIGN_CHANNELS = ['online', 'offline', 'hybrid']

export const CAMPAIGN_CHANNEL_LABELS = {
  online: '线上',
  offline: '线下',
  hybrid: '线上线下结合'
}

/**
 * 生成营销活动数据（12 条）
 *
 * @param {Array} profiles - 用户档案列表
 * @returns {Array} 营销活动列表
 */
export function generateMarketingCampaigns(profiles) {
  const count = 12
  const campaigns = []

  for (let i = 0; i < count; i++) {
    const type = faker.helpers.arrayElement(CAMPAIGN_TYPES)
    const status = faker.helpers.arrayElement(CAMPAIGN_STATUSES)
    const channel = faker.helpers.arrayElement(CAMPAIGN_CHANNELS)
    const createdAt = faker.date.between({ from: '2026-01-01', to: new Date() }).toISOString()
    const startDate = faker.date.between({ from: '2026-01-01', to: '2026-08-01' }).toISOString()
    const endDate = faker.date.between({ from: startDate, to: '2027-01-01' }).toISOString()
    const budget = faker.number.int({ min: 50000, max: 500000 })
    // actualCost < budget
    const actualCost = Math.floor(budget * faker.number.float({ min: 0.1, max: 0.95 }))

    campaigns.push({
      id: faker.string.uuid(),
      name: faker.helpers.arrayElement([
        `夏季大促${type === 'promotion' ? '促销' : '活动'}`,
        `新品发布${type === 'event' ? '发布会' : '推广'}`,
        `年度客户${channel === 'online' ? '线上' : '线下'}回馈`,
        `${faker.company.buzzNoun()}系列推广`,
        `Q${faker.number.int({ min: 1, max: 4 })}营销冲刺`,
        `节假日专题活动`,
        `行业展会参展方案`,
        `社群裂变推广计划`,
        `精准投放广告系列`,
        `内容营销矩阵建设`,
        '合作伙伴联合推广',
        '品牌周年庆活动'
      ][i % 12]),
      type,
      status,
      channel,
      ownerId: faker.helpers.arrayElement(profiles).id,
      budget,
      actualCost,
      targetLeadCount: faker.number.int({ min: 100, max: 10000 }),
      leadCount: faker.number.int({ min: 50, max: 8000 }),
      convertedLeadCount: faker.number.int({ min: 10, max: 2000 }),
      startDate,
      endDate,
      description: faker.helpers.arrayElement([
        '通过多渠道推广提升品牌知名度',
        '针对目标客户群体进行精准营销',
        '结合线上线下资源进行整合营销',
        '利用社交媒体扩大品牌影响力',
        '通过内容营销吸引潜在客户',
        '以促销活动带动销售增长',
        '展会现场收集客户线索',
        '社群裂变获取高质量线索'
      ]),
      createdAt,
      updatedAt: faker.date.between({ from: createdAt, to: new Date() }).toISOString()
    })
  }

  return campaigns
}

/**
 * 计算活动指标
 *
 * @param {Object} campaign - 活动对象
 * @returns {{ conversionRate: string, budgetUsageRate: string, costPerLead: string }}
 */
export function calculateCampaignMetrics(campaign) {
  const budget = Number(campaign.budget) || 0
  const actualCost = Number(campaign.actualCost) || 0
  const leadCount = Number(campaign.leadCount) || 0
  const convertedLeadCount = Number(campaign.convertedLeadCount) || 0

  // 转化率 = convertedLeadCount / leadCount * 100%
  let conversionRate = '0%'
  if (leadCount > 0 && convertedLeadCount > 0) {
    conversionRate = ((convertedLeadCount / leadCount) * 100).toFixed(1) + '%'
  }

  // 预算使用率 = actualCost / budget * 100%
  let budgetUsageRate = '0%'
  if (budget > 0 && actualCost > 0) {
    budgetUsageRate = ((actualCost / budget) * 100).toFixed(1) + '%'
  }

  // 单线索成本 = actualCost / leadCount
  let costPerLead = '0'
  if (leadCount > 0 && actualCost > 0) {
    costPerLead = (actualCost / leadCount).toFixed(2)
  }

  return { conversionRate, budgetUsageRate, costPerLead }
}

/**
 * 组合查询营销活动列表
 *
 * @param {Object} database - 完整的数据集
 * @param {Object} searchParams
 * @param {string} [searchParams.keyword]    - 关键词（name/type/channel）
 * @param {string} [searchParams.type]       - 活动类型
 * @param {string} [searchParams.status]     - 状态
 * @param {string} [searchParams.channel]    - 渠道
 * @param {string} [searchParams.ownerId]    - 负责人
 * @param {string} [searchParams.startDate]  - 开始日期起始
 * @param {string} [searchParams.endDate]    - 结束日期截止
 * @param {number} [searchParams.page=1]
 * @param {number} [searchParams.pageSize=10]
 * @returns {{ list: Array, total: number, page: number, pageSize: number }}
 */
export function queryMarketingCampaigns(database, searchParams = {}) {
  const { marketingCampaigns = [], profiles } = database
  const profileNames = new Map((profiles || []).map(p => [p.id, p.name]))

  let filtered = [...marketingCampaigns]

  const { keyword, type, status, channel, ownerId, startDate, endDate } = searchParams
  let page = parseInt(searchParams.page, 10) || 1
  let pageSize = parseInt(searchParams.pageSize, 10) || 10

  if (page < 1) page = 1
  if (pageSize < 1) pageSize = 10
  if (pageSize > 100) pageSize = 100

  // 关键词搜索：name / type / channel
  if (keyword && keyword.trim()) {
    const kw = keyword.trim().toLowerCase()
    filtered = filtered.filter(c =>
      c.name.toLowerCase().includes(kw) ||
      (CAMPAIGN_TYPE_LABELS[c.type] || c.type).toLowerCase().includes(kw) ||
      (CAMPAIGN_CHANNEL_LABELS[c.channel] || c.channel).toLowerCase().includes(kw)
    )
  }

  // 类型筛选
  if (type) filtered = filtered.filter(c => c.type === type)
  // 状态筛选
  if (status) filtered = filtered.filter(c => c.status === status)
  // 渠道筛选
  if (channel) filtered = filtered.filter(c => c.channel === channel)
  // 负责人筛选
  if (ownerId) filtered = filtered.filter(c => c.ownerId === ownerId)

  // 日期范围
  if (startDate) {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    if (!Number.isNaN(start.getTime())) {
      filtered = filtered.filter(c => new Date(c.createdAt).getTime() >= start.getTime())
    }
  }
  if (endDate) {
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)
    if (!Number.isNaN(end.getTime())) {
      filtered = filtered.filter(c => new Date(c.createdAt).getTime() <= end.getTime())
    }
  }

  // 按 createdAt 降序
  filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const total = filtered.length
  const start = (page - 1) * pageSize
  const paged = filtered.slice(start, start + pageSize)

  const list = paged.map(c => {
    const metrics = calculateCampaignMetrics(c)
    return {
      ...c,
      ownerName: profileNames.get(c.ownerId) || '未知用户',
      typeLabel: CAMPAIGN_TYPE_LABELS[c.type] || c.type,
      statusLabel: CAMPAIGN_STATUS_LABELS[c.status] || c.status,
      statusType: CAMPAIGN_STATUS_TYPES[c.status] || 'info',
      channelLabel: CAMPAIGN_CHANNEL_LABELS[c.channel] || c.channel,
      ...metrics
    }
  })

  return { list, total, page, pageSize }
}

/**
 * 获取营销活动筛选选项
 *
 * @param {Object} database
 * @returns {{ types: Array, statuses: Array, channels: Array, owners: Array }}
 */
export function getMarketingCampaignOptions(database) {
  const { profiles } = database

  const types = CAMPAIGN_TYPES.map(v => ({ value: v, label: CAMPAIGN_TYPE_LABELS[v] || v }))
  const statuses = CAMPAIGN_STATUSES.map(v => ({ value: v, label: CAMPAIGN_STATUS_LABELS[v] || v }))
  const channels = CAMPAIGN_CHANNELS.map(v => ({ value: v, label: CAMPAIGN_CHANNEL_LABELS[v] || v }))
  const owners = (profiles || [])
    .filter(p => p.status !== 'inactive')
    .map(p => ({ id: p.id, name: p.name }))

  return { types, statuses, channels, owners }
}

/**
 * 获取营销活动详情
 *
 * @param {Object} database
 * @param {string} id
 * @returns {Object|null}
 */
export function getMarketingCampaignDetail(database, id) {
  const { marketingCampaigns = [], profiles } = database
  const campaign = marketingCampaigns.find(c => c.id === id)
  if (!campaign) return null

  const profileNames = new Map((profiles || []).map(p => [p.id, p.name]))
  const metrics = calculateCampaignMetrics(campaign)

  return {
    ...campaign,
    ownerName: profileNames.get(campaign.ownerId) || '未知用户',
    typeLabel: CAMPAIGN_TYPE_LABELS[campaign.type] || campaign.type,
    statusLabel: CAMPAIGN_STATUS_LABELS[campaign.status] || campaign.status,
    statusType: CAMPAIGN_STATUS_TYPES[campaign.status] || 'info',
    channelLabel: CAMPAIGN_CHANNEL_LABELS[campaign.channel] || campaign.channel,
    ...metrics
  }
}

/**
 * 获取营销活动统计数据
 *
 * @param {Object} database
 * @returns {{ totalBudget: number, totalActualCost: number, totalLeadCount: number, totalConvertedLeadCount: number, campaignCount: number, byType: Array, byStatus: Array }}
 */
export function getMarketingStatistics(database) {
  const { marketingCampaigns = [] } = database

  const totalBudget = marketingCampaigns.reduce((s, c) => s + (Number(c.budget) || 0), 0)
  const totalActualCost = marketingCampaigns.reduce((s, c) => s + (Number(c.actualCost) || 0), 0)
  const totalLeadCount = marketingCampaigns.reduce((s, c) => s + (Number(c.leadCount) || 0), 0)
  const totalConvertedLeadCount = marketingCampaigns.reduce((s, c) => s + (Number(c.convertedLeadCount) || 0), 0)
  const campaignCount = marketingCampaigns.length

  // 按类型分组
  const byTypeMap = {}
  marketingCampaigns.forEach(c => {
    if (!byTypeMap[c.type]) byTypeMap[c.type] = { type: c.type, typeLabel: CAMPAIGN_TYPE_LABELS[c.type] || c.type, count: 0, budget: 0, actualCost: 0 }
    byTypeMap[c.type].count++
    byTypeMap[c.type].budget += Number(c.budget) || 0
    byTypeMap[c.type].actualCost += Number(c.actualCost) || 0
  })
  const byType = Object.values(byTypeMap)

  // 按状态分组
  const byStatusMap = {}
  marketingCampaigns.forEach(c => {
    if (!byStatusMap[c.status]) byStatusMap[c.status] = { status: c.status, statusLabel: CAMPAIGN_STATUS_LABELS[c.status] || c.status, statusType: CAMPAIGN_STATUS_TYPES[c.status] || 'info', count: 0, budget: 0, actualCost: 0 }
    byStatusMap[c.status].count++
    byStatusMap[c.status].budget += Number(c.budget) || 0
    byStatusMap[c.status].actualCost += Number(c.actualCost) || 0
  })
  const byStatus = Object.values(byStatusMap)

  // 按渠道分组
  const byChannelMap = {}
  marketingCampaigns.forEach(c => {
    if (!byChannelMap[c.channel]) byChannelMap[c.channel] = { channel: c.channel, channelLabel: CAMPAIGN_CHANNEL_LABELS[c.channel] || c.channel, count: 0, budget: 0, actualCost: 0, leadCount: 0, convertedLeadCount: 0 }
    byChannelMap[c.channel].count++
    byChannelMap[c.channel].budget += Number(c.budget) || 0
    byChannelMap[c.channel].actualCost += Number(c.actualCost) || 0
    byChannelMap[c.channel].leadCount += Number(c.leadCount) || 0
    byChannelMap[c.channel].convertedLeadCount += Number(c.convertedLeadCount) || 0
  })
  const byChannel = Object.values(byChannelMap)

  return {
    totalBudget,
    totalActualCost,
    totalLeadCount,
    totalConvertedLeadCount,
    campaignCount,
    byType,
    byStatus,
    byChannel
  }
}

/**
 * 获取营销分析数据（含每个活动的 ROI 明细）
 *
 * @param {Object} database
 * @returns {{ campaigns: Array, byType: Array, byStatus: Array, byChannel: Array }}
 */
export function getMarketingAnalysisData(database) {
  const { marketingCampaigns = [], profiles, leads = [] } = database
  const profileNames = new Map((profiles || []).map(p => [p.id, p.name]))

  // 每个活动的 ROI 明细
  const campaigns = marketingCampaigns.map(c => {
    const metrics = calculateCampaignMetrics(c)
    const relatedLeads = (leads || []).filter(l => l.campaignId === c.id)
    const converted = relatedLeads.filter(l => l.status === 'converted')

    return {
      id: c.id,
      name: c.name,
      type: c.type,
      typeLabel: CAMPAIGN_TYPE_LABELS[c.type] || c.type,
      status: c.status,
      statusLabel: CAMPAIGN_STATUS_LABELS[c.status] || c.status,
      statusType: CAMPAIGN_STATUS_TYPES[c.status] || 'info',
      channel: c.channel,
      channelLabel: CAMPAIGN_CHANNEL_LABELS[c.channel] || c.channel,
      ownerName: profileNames.get(c.ownerId) || '未知用户',
      budget: Number(c.budget) || 0,
      actualCost: Number(c.actualCost) || 0,
      leadCount: Number(c.leadCount) || 0,
      convertedLeadCount: Number(c.convertedLeadCount) || 0,
      ...metrics,
      // 从 leads 关联的实际转化数
      relatedLeadCount: relatedLeads.length,
      relatedConvertedCount: converted.length,
      startDate: c.startDate,
      endDate: c.endDate,
      createdAt: c.createdAt
    }
  })

  // 按类型分组
  const byTypeMap = {}
  marketingCampaigns.forEach(c => {
    const t = c.type
    if (!byTypeMap[t]) byTypeMap[t] = { type: t, typeLabel: CAMPAIGN_TYPE_LABELS[t] || t, count: 0, budget: 0, actualCost: 0, leadCount: 0, convertedLeadCount: 0 }
    byTypeMap[t].count++
    byTypeMap[t].budget += Number(c.budget) || 0
    byTypeMap[t].actualCost += Number(c.actualCost) || 0
    byTypeMap[t].leadCount += Number(c.leadCount) || 0
    byTypeMap[t].convertedLeadCount += Number(c.convertedLeadCount) || 0
  })
  const byType = Object.values(byTypeMap).map(t => ({
    ...t,
    ...calculateCampaignMetrics(t)
  }))

  // 按渠道分组
  const byChannelMap = {}
  marketingCampaigns.forEach(c => {
    const ch = c.channel
    if (!byChannelMap[ch]) byChannelMap[ch] = { channel: ch, channelLabel: CAMPAIGN_CHANNEL_LABELS[ch] || ch, count: 0, budget: 0, actualCost: 0, leadCount: 0, convertedLeadCount: 0 }
    byChannelMap[ch].count++
    byChannelMap[ch].budget += Number(c.budget) || 0
    byChannelMap[ch].actualCost += Number(c.actualCost) || 0
    byChannelMap[ch].leadCount += Number(c.leadCount) || 0
    byChannelMap[ch].convertedLeadCount += Number(c.convertedLeadCount) || 0
  })
  const byChannel = Object.values(byChannelMap).map(ch => ({
    ...ch,
    ...calculateCampaignMetrics(ch)
  }))

  // 按状态分组
  const byStatusMap = {}
  marketingCampaigns.forEach(c => {
    if (!byStatusMap[c.status]) byStatusMap[c.status] = { status: c.status, statusLabel: CAMPAIGN_STATUS_LABELS[c.status] || c.status, statusType: CAMPAIGN_STATUS_TYPES[c.status] || 'info', count: 0, budget: 0, actualCost: 0, leadCount: 0, convertedLeadCount: 0 }
    byStatusMap[c.status].count++
    byStatusMap[c.status].budget += Number(c.budget) || 0
    byStatusMap[c.status].actualCost += Number(c.actualCost) || 0
    byStatusMap[c.status].leadCount += Number(c.leadCount) || 0
    byStatusMap[c.status].convertedLeadCount += Number(c.convertedLeadCount) || 0
  })
  const byStatus = Object.values(byStatusMap).map(s => ({ ...s, ...calculateCampaignMetrics(s) }))

  return { campaigns, byType, byStatus, byChannel }
}

/**
 * 校验营销活动输入
 *
 * @param {Object} database
 * @param {Object} input
 * @returns {{ valid: boolean, errors: Array, data?: Object }}
 */
export function validateMarketingCampaignInput(database, input) {
  const errors = []
  const { profiles } = database

  // name — 必填，最大 100
  if (!input.name || !input.name.trim()) {
    errors.push({ code: 4001, message: '活动名称不能为空' })
  } else if (input.name.length > 100) {
    errors.push({ code: 4002, message: '活动名称不能超过 100 个字符' })
  }

  // type — 必填，枚举
  if (!input.type || !CAMPAIGN_TYPES.includes(input.type)) {
    errors.push({ code: 4003, message: '请选择有效的活动类型' })
  }

  // status — 必填，枚举
  if (input.status && !CAMPAIGN_STATUSES.includes(input.status)) {
    errors.push({ code: 4004, message: '无效的活动状态' })
  }

  // channel — 必填，枚举
  if (!input.channel || !CAMPAIGN_CHANNELS.includes(input.channel)) {
    errors.push({ code: 4005, message: '请选择有效的营销渠道' })
  }

  // budget — 可选，必须 > 0
  if (input.budget !== undefined && input.budget !== null && input.budget !== '') {
    const b = Number(input.budget)
    if (Number.isNaN(b) || b <= 0) {
      errors.push({ code: 4006, message: '预算必须大于 0' })
    }
  }

  // actualCost — 可选，不能为负数
  if (input.actualCost !== undefined && input.actualCost !== null && input.actualCost !== '') {
    const a = Number(input.actualCost)
    if (Number.isNaN(a) || a < 0) {
      errors.push({ code: 4007, message: '实际成本不能为负数' })
    }
  }

  // ownerId — 可选，必须存在且活跃
  if (input.ownerId && (input.ownerId !== '')) {
    const owner = profiles.find(p => p.id === input.ownerId)
    if (!owner) {
      errors.push({ code: 4008, message: '指定的负责人不存在' })
    } else if (owner.status === 'inactive') {
      errors.push({ code: 4009, message: '指定的负责人已停用' })
    }
  }

  // endDate > startDate 检查
  if (input.startDate && input.endDate) {
    if (new Date(input.endDate) <= new Date(input.startDate)) {
      errors.push({ code: 4010, message: '结束日期必须大于开始日期' })
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  const data = {
    name: input.name.trim(),
    type: input.type,
    status: input.status || 'planning',
    channel: input.channel,
    ownerId: input.ownerId || null,
    budget: input.budget !== undefined && input.budget !== null && input.budget !== '' ? Number(input.budget) : 0,
    actualCost: input.actualCost !== undefined && input.actualCost !== null && input.actualCost !== '' ? Number(input.actualCost) : 0,
    targetLeadCount: input.targetLeadCount !== undefined && input.targetLeadCount !== null && input.targetLeadCount !== '' ? Number(input.targetLeadCount) : 0,
    leadCount: input.leadCount !== undefined && input.leadCount !== null && input.leadCount !== '' ? Number(input.leadCount) : 0,
    convertedLeadCount: input.convertedLeadCount !== undefined && input.convertedLeadCount !== null && input.convertedLeadCount !== '' ? Number(input.convertedLeadCount) : 0,
    startDate: input.startDate || null,
    endDate: input.endDate || null,
    description: input.description ? input.description.trim() : ''
  }

  return { valid: true, errors: [], data }
}
