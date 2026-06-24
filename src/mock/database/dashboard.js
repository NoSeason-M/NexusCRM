/**
 * Dashboard 数据聚合层
 *
 * 使用 filter / reduce 等原生数组方法从 store 中聚合统计指标，
 * 模拟后端数据聚合逻辑。
 */

/**
 * 创建仪表盘概览指标
 *
 * @param {Object} database - 完整的数据集（store）
 * @returns {Object} 概览指标
 */
export function createDashboardSummary(database) {
  const { customers, opportunities, contracts, tickets } = database

  // 客户总数
  const customerCount = customers.length

  // 活跃客户数（status === 'active'）
  const activeCustomerCount = customers.filter(c => c.status === 'active').length

  // 进行中的商机（非 closed_won / closed_lost）
  const activeOpportunities = opportunities.filter(
    o => o.stage !== 'closed_won' && o.stage !== 'closed_lost'
  )
  const activeOpportunityCount = activeOpportunities.length

  // 商机总额（所有商机金额之和）
  const opportunityAmount = opportunities.reduce((sum, o) => sum + (Number(o.amount) || 0), 0)

  // 合同总额（所有合同金额之和）
  const contractAmount = contracts.reduce((sum, c) => sum + (Number(c.amount) || 0), 0)

  // 待处理工单（status === 'pending' 或 'open'）
  const pendingTicketCount = tickets.filter(
    t => t.status === 'pending' || t.status === 'open'
  ).length

  return {
    customerCount,
    activeCustomerCount,
    activeOpportunityCount,
    opportunityAmount,
    contractAmount,
    pendingTicketCount
  }
}

/**
 * 创建销售漏斗数据
 *
 * @param {Object} database - 完整的数据集
 * @returns {Array} 漏斗阶段数组
 */
export function createSalesFunnel(database) {
  const { opportunities } = database

  const stages = [
    { key: 'qualification', label: '初步接洽' },
    { key: 'proposal', label: '方案报价' },
    { key: 'negotiation', label: '商务谈判' },
    { key: 'closed_won', label: '赢单' },
    { key: 'closed_lost', label: '输单' }
  ]

  return stages.map(stage => {
    const items = opportunities.filter(o => o.stage === stage.key)
    const count = items.length
    const amount = items.reduce((sum, o) => sum + (Number(o.amount) || 0), 0)
    return {
      stage: stage.key,
      label: stage.label,
      count,
      amount
    }
  })
}

/**
 * 创建合同签约趋势（按月分组）
 *
 * @param {Object} database - 完整的数据集
 * @returns {Array} 月度趋势数组
 */
export function createContractTrend(database) {
  const { contracts } = database

  // 按年月分组
  const grouped = {}
  contracts.forEach(c => {
    const date = new Date(c.signedAt || c.createdAt)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!grouped[key]) {
      grouped[key] = { month: key, count: 0, amount: 0 }
    }
    grouped[key].count += 1
    grouped[key].amount += Number(c.amount) || 0
  })

  // 按时间排序
  return Object.values(grouped).sort((a, b) => a.month.localeCompare(b.month))
}

/**
 * 创建工单状态分布数据
 *
 * @param {Object} database - 完整的数据集
 * @returns {Array} 状态分布数组
 */
export function createTicketStatusDistribution(database) {
  const { tickets } = database

  const statusMap = {
    open: '待处理',
    in_progress: '处理中',
    pending: '待反馈',
    resolved: '已解决',
    closed: '已关闭'
  }

  const grouped = {}
  tickets.forEach(t => {
    if (!grouped[t.status]) {
      grouped[t.status] = { status: t.status, label: statusMap[t.status] || t.status, count: 0 }
    }
    grouped[t.status].count += 1
  })

  return Object.values(grouped)
}
