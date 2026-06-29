/**
 * 合同数据查询层
 *
 * 提供组合查询、统计聚合、到期合同检测等功能。
 */
/**
 * 合同状态中文名映射
 */
export const CONTRACT_STATUS_LABELS = {
  draft: '草稿',
  approving: '审批中',
  approved: '已审批',
  rejected: '已驳回',
  signed: '已签署',
  archived: '已归档'
}

/**
 * 合同状态类型映射（用于标签配色）
 */
export const CONTRACT_STATUS_TYPES = {
  draft: 'info',
  approving: 'warning',
  approved: 'primary',
  rejected: 'danger',
  signed: 'success',
  archived: 'info'
}

/**
 * 计算合同到期状态
 *
 * @param {Object} contract - 合同对象（需含 endDate）
 * @param {Date} [referenceDate] - 参考日期，默认当前时间
 * @returns {{ expiryStatus: string, daysRemaining: number }}
 *   expiryStatus: 'expired' | 'expiring' | 'normal'
 *   daysRemaining: number（负数表示已过期）
 */
export function getContractExpiry(contract, referenceDate) {
  const ref = referenceDate || new Date()
  const end = new Date(contract.endDate)
  const diffTime = end.getTime() - ref.getTime()
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  let expiryStatus
  if (daysRemaining < 0) {
    expiryStatus = 'expired'
  } else if (daysRemaining <= 30) {
    expiryStatus = 'expiring'
  } else {
    expiryStatus = 'normal'
  }

  return { expiryStatus, daysRemaining }
}

/**
 * 组合查询合同列表（含关键词搜索、多条件筛选、分页）
 *
 * @param {Object} database - 完整的数据集
 * @param {Object} searchParams - 查询参数
 * @param {string}  [searchParams.keyword]            - 关键词（模糊匹配 name / contractNo / customerName）
 * @param {string}  [searchParams.status]              - 状态筛选
 * @param {string}  [searchParams.customerId]          - 客户筛选
 * @param {string}  [searchParams.opportunityId]       - 商机筛选
 * @param {string}  [searchParams.ownerId]             - 负责人筛选
 * @param {string}  [searchParams.expiryStatus]        - 到期状态筛选（normal/expiring/expired）
 * @param {string}  [searchParams.endDateStart]        - 结束日期起始
 * @param {string}  [searchParams.endDateEnd]          - 结束日期截止
 * @param {number}  [searchParams.page=1]              - 页码（从 1 开始）
 * @param {number}  [searchParams.pageSize=10]         - 每页条数（最大 100）
 * @returns {{ list: Array, total: number, page: number, pageSize: number }}
 */
export function queryContracts(database, searchParams = {}) {
  const { contracts, customers, opportunities, profiles, contractAttachments } = database

  // 构建名称映射
  const customerNames = new Map(customers.map(c => [c.id, c.name]))
  const opportunityNames = new Map(opportunities.map(o => [o.id, o.title]))
  const ownerNames = new Map(profiles.map(p => [p.id, p.name]))

  // 附件计数
  const attachmentCountMap = new Map()
  if (contractAttachments) {
    for (const att of contractAttachments) {
      attachmentCountMap.set(att.contractId, (attachmentCountMap.get(att.contractId) || 0) + 1)
    }
  }

  // 参数提取与默认值
  const { keyword, status, customerId, opportunityId, ownerId, expiryStatus, endDateStart, endDateEnd } = searchParams
  let page = parseInt(searchParams.page, 10) || 1
  let pageSize = parseInt(searchParams.pageSize, 10) || 10

  if (page < 1) page = 1
  if (pageSize < 1) pageSize = 10
  if (pageSize > 100) pageSize = 100

  // 筛选
  let filtered = [...contracts]

  // 关键词搜索：name / contractNo / customerName
  if (keyword && keyword.trim()) {
    const kw = keyword.trim().toLowerCase()
    filtered = filtered.filter(c =>
      c.name.toLowerCase().includes(kw) ||
      (c.contractNo || '').toLowerCase().includes(kw) ||
      (customerNames.get(c.customerId) || '').toLowerCase().includes(kw)
    )
  }

  // 状态筛选
  if (status) {
    filtered = filtered.filter(c => c.status === status)
  }

  // 客户筛选
  if (customerId) {
    filtered = filtered.filter(c => c.customerId === customerId)
  }

  // 商机筛选
  if (opportunityId) {
    filtered = filtered.filter(c => c.opportunityId === opportunityId)
  }

  // 负责人筛选
  if (ownerId) {
    filtered = filtered.filter(c => c.ownerId === ownerId)
  }

  // 到期状态筛选
  if (expiryStatus) {
    const now = new Date()
    filtered = filtered.filter(c => {
      const { expiryStatus: es } = getContractExpiry(c, now)
      return es === expiryStatus
    })
  }

  // 结束日期范围
  if (endDateStart) {
    const start = new Date(endDateStart).getTime()
    if (!Number.isNaN(start)) {
      filtered = filtered.filter(c => new Date(c.endDate).getTime() >= start)
    }
  }
  if (endDateEnd) {
    const end = new Date(endDateEnd).getTime()
    if (!Number.isNaN(end)) {
      filtered = filtered.filter(c => new Date(c.endDate).getTime() <= end)
    }
  }

  // 总数
  const total = filtered.length

  // 分页
  const start = (page - 1) * pageSize
  const paged = filtered.slice(start, start + pageSize)

  // 补充名称、到期状态、附件数
  const now = new Date()
  const list = paged.map(c => {
    const { expiryStatus: es, daysRemaining } = getContractExpiry(c, now)
    return {
      ...c,
      customerName: customerNames.get(c.customerId) || '未知客户',
      opportunityName: opportunityNames.get(c.opportunityId) || '未知商机',
      ownerName: ownerNames.get(c.ownerId) || '未知用户',
      attachmentCount: attachmentCountMap.get(c.id) || 0,
      expiryStatus: es,
      daysRemaining,
      statusLabel: CONTRACT_STATUS_LABELS[c.status] || c.status,
      statusType: CONTRACT_STATUS_TYPES[c.status] || 'info'
    }
  })

  return { list, total, page, pageSize }
}

/**
 * 获取合同筛选选项
 *
 * @param {Object} database - 完整的数据集
 * @returns {{ statuses: Array, customers: Array, owners: Array }}
 */
export function getContractOptions(database) {
  const { customers, profiles } = database

  const statuses = Object.entries(CONTRACT_STATUS_LABELS).map(([value, label]) => ({
    value,
    label
  }))

  const customerOpts = customers.map(c => ({
    id: c.id,
    name: c.name
  }))

  const owners = profiles
    .filter(p => p.status !== 'inactive')
    .map(p => ({ id: p.id, name: p.name }))

  return { statuses, customers: customerOpts, owners }
}

/**
 * 创建合同统计概览
 *
 * @param {Object} database - 完整的数据集
 * @param {Object} searchParams - 筛选参数（与 queryContracts 一致，不含分页/排序）
 * @returns {Object} 统计结果
 */
export function createContractStatistics(database, searchParams = {}) {
  const { contracts, customers } = database
  const customerNames = new Map(customers.map(c => [c.id, c.name]))

  const { keyword, status, customerId, opportunityId, ownerId } = searchParams

  let filtered = [...contracts]

  if (keyword && keyword.trim()) {
    const kw = keyword.trim().toLowerCase()
    filtered = filtered.filter(c =>
      c.name.toLowerCase().includes(kw) ||
      (customerNames.get(c.customerId) || '').toLowerCase().includes(kw)
    )
  }

  if (status) filtered = filtered.filter(c => c.status === status)
  if (customerId) filtered = filtered.filter(c => c.customerId === customerId)
  if (opportunityId) filtered = filtered.filter(c => c.opportunityId === opportunityId)
  if (ownerId) filtered = filtered.filter(c => c.ownerId === ownerId)

  const now = new Date()

  const totalCount = filtered.length
  const totalAmount = filtered.reduce((sum, c) => sum + c.amount, 0)
  const signedAmount = filtered
    .filter(c => c.status === 'signed' || c.status === 'archived')
    .reduce((sum, c) => sum + c.amount, 0)
  const approvalPendingCount = filtered.filter(c => c.status === 'approving').length
  const expiringCount = filtered.filter(c => {
    const { expiryStatus: es } = getContractExpiry(c, now)
    return es === 'expiring'
  }).length
  const expiredCount = filtered.filter(c => {
    const { expiryStatus: es } = getContractExpiry(c, now)
    return es === 'expired'
  }).length

  // 按状态分组
  const statusMap = new Map()
  for (const c of filtered) {
    if (!statusMap.has(c.status)) {
      statusMap.set(c.status, { count: 0, amount: 0 })
    }
    const entry = statusMap.get(c.status)
    entry.count++
    entry.amount += c.amount
  }

  const byStatus = Object.keys(CONTRACT_STATUS_LABELS).map(s => ({
    status: s,
    label: CONTRACT_STATUS_LABELS[s] || s,
    count: statusMap.get(s)?.count || 0,
    amount: statusMap.get(s)?.amount || 0
  }))

  return { totalCount, totalAmount, signedAmount, approvalPendingCount, expiringCount, expiredCount, byStatus }
}

/**
 * 合同状态流转规则
 * key 为当前状态，value 为可流转到的状态列表
 */
export const CONTRACT_STATUS_TRANSITIONS = {
  draft: ['approving'],
  approving: ['approved', 'rejected'],
  approved: ['signed'],
  rejected: ['approving'],
  signed: ['archived'],
  archived: []
}

/**
 * 合同状态流转动作中文名
 */
export const CONTRACT_STATUS_ACTIONS = {
  draft: { action: '提交审批', icon: 'Top' },
  approving: { action: '审批', icon: 'Edit' },
  approved: { action: '签署', icon: 'Top' },
  rejected: { action: '重新提交', icon: 'Refresh' },
  signed: { action: '归档', icon: 'Folder' },
  archived: { action: '', icon: '' }
}

/**
 * 获取合同状态流转所需的权限
 * @param {string} targetStatus - 目标状态
 * @returns {string} 权限编码
 */
export function getContractTransitionPermission(targetStatus) {
  // approving, approved, rejected 需要 contract:approve
  if (targetStatus === 'approving' || targetStatus === 'approved' || targetStatus === 'rejected') {
    return 'contract:approve'
  }
  // signed, archived 需要 contract:edit
  return 'contract:edit'
}

/**
 * 获取允许的合同状态流转目标
 * @param {string} status - 当前状态
 * @returns {Array<{ status: string, label: string, action: string }>}
 */
export function getAllowedContractStatusTransitions(status) {
  const targets = CONTRACT_STATUS_TRANSITIONS[status] || []
  return targets.map(s => ({
    status: s,
    label: CONTRACT_STATUS_LABELS[s] || s,
    action: CONTRACT_STATUS_ACTIONS[s]?.action || s,
    permission: getContractTransitionPermission(s)
  }))
}

/**
 * 校验合同输入
 * @param {Object} database - 完整的数据集
 * @param {Object} input - 客户端提交的原始数据
 * @param {string} [excludeId] - 排除的合同 ID
 * @returns {{ valid: boolean, errors: Array, data?: Object }}
 */
export function validateContractInput(database, input, excludeId) {
  const errors = []

  // name：必填，1~100 字符
  const name = (input.name || '').trim()
  if (!name) {
    errors.push({ field: 'name', code: 105001, message: '合同名称不能为空' })
  } else if (name.length > 100) {
    errors.push({ field: 'name', code: 105001, message: '合同名称不能超过 100 个字符' })
  }

  // customerId：必填
  if (!input.customerId) {
    errors.push({ field: 'customerId', code: 105002, message: '请选择客户' })
  } else {
    const customerExists = database.customers.some(c => c.id === input.customerId && c.status !== 'inactive')
    if (!customerExists) {
      errors.push({ field: 'customerId', code: 105002, message: '指定的客户不存在或已流失' })
    }
  }

  // opportunityId：可选，如提供需为 won 状态
  if (input.opportunityId) {
    const opp = database.opportunities.find(o => o.id === input.opportunityId)
    if (!opp) {
      errors.push({ field: 'opportunityId', code: 105003, message: '指定的商机不存在' })
    }
  }

  // amount：必填，大于 0
  const amount = parseFloat(input.amount)
  if (!input.amount || Number.isNaN(amount) || amount <= 0) {
    errors.push({ field: 'amount', code: 105004, message: '合同金额必须大于 0' })
  }

  // startDate / endDate
  if (input.startDate && input.endDate) {
    if (new Date(input.endDate) <= new Date(input.startDate)) {
      errors.push({ field: 'endDate', code: 105005, message: '结束日期必须大于开始日期' })
    }
  }

  // ownerId：可选
  if (input.ownerId) {
    const ownerExists = database.profiles.some(p => p.id === input.ownerId && p.status !== 'inactive')
    if (!ownerExists) {
      errors.push({ field: 'ownerId', code: 105006, message: '指定的负责人不存在或已停用' })
    }
  }

  // description：可选，最多 500
  if (input.description && input.description.length > 500) {
    errors.push({ field: 'description', code: 105007, message: '描述不能超过 500 个字符' })
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  const data = normalizeContractInput(input)
  return { valid: true, errors: [], data }
}

/**
 * 规范化合同输入
 */
export function normalizeContractInput(input) {
  const trim = (v) => (typeof v === 'string' ? v.trim() : v)
  const toNull = (v) => (v === '' || v === undefined ? null : v)

  return {
    name: trim(input.name) || '',
    customerId: input.customerId || '',
    opportunityId: input.opportunityId || '',
    ownerId: input.ownerId || '',
    amount: parseFloat(input.amount) || 0,
    startDate: input.startDate || null,
    endDate: input.endDate || null,
    signedAt: input.signedAt || null,
    description: toNull(trim(input.description))
  }
}

/**
 * 校验合同状态流转请求
 * @param {Object} contract - 当前合同对象
 * @param {Object} input - 流转请求 { toStatus, comment? }
 * @returns {{ valid: boolean, errors: Array }}
 */
export function validateContractStatusTransition(contract, input) {
  const errors = []

  if (!input.toStatus) {
    errors.push({ field: 'toStatus', code: 105010, message: '目标状态不能为空' })
    return { valid: false, errors }
  }

  // 校验是否允许流转
  const allowed = CONTRACT_STATUS_TRANSITIONS[contract.status] || []
  if (!allowed.includes(input.toStatus)) {
    const allowedLabels = allowed.map(s => CONTRACT_STATUS_LABELS[s] || s).join('、')
    errors.push({
      field: 'toStatus',
      code: 105011,
      message: `不允许从「${CONTRACT_STATUS_LABELS[contract.status] || contract.status}」流转到「${CONTRACT_STATUS_LABELS[input.toStatus] || input.toStatus}」，允许的目标：${allowedLabels}`
    })
  }

  // 已是 archived 不可再流转
  if (contract.status === 'archived') {
    errors.push({
      field: 'status',
      code: 105012,
      message: '已归档的合同不可再流转'
    })
  }

  // comment：可选，最多 500
  if (input.comment && input.comment.length > 500) {
    errors.push({ field: 'comment', code: 105013, message: '审批备注不能超过 500 个字符' })
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 创建合同审批记录
 * @param {Object} database - 完整的数据集
 * @param {Object} contract - 合同对象
 * @param {Object} input - { toStatus, comment? }
 * @param {string} operatorId - 操作人 ID
 * @returns {Object} 审批记录
 */
export function createContractApprovalRecord(database, contract, input, operatorId) {
  if (!database.contractApprovalRecords) {
    database.contractApprovalRecords = []
  }

  let action
  if (input.toStatus === 'approving' && contract.status === 'draft') {
    action = 'submit'
  } else if (input.toStatus === 'approving' && contract.status === 'rejected') {
    action = 'resubmit'
  } else if (input.toStatus === 'approved') {
    action = 'approve'
  } else if (input.toStatus === 'rejected') {
    action = 'reject'
  } else if (input.toStatus === 'signed') {
    action = 'sign'
  } else if (input.toStatus === 'archived') {
    action = 'archive'
  } else {
    action = 'change'
  }

  const record = {
    id: crypto.randomUUID(),
    contractId: contract.id,
    fromStatus: contract.status,
    toStatus: input.toStatus,
    action,
    operatorId,
    comment: input.comment || '',
    operatedAt: new Date().toISOString()
  }

  database.contractApprovalRecords.unshift(record)
  return record
}

/**
 * 获取合同详情（含审批记录、附件列表）
 * @param {Object} database - 完整的数据集
 * @param {string} id - 合同 ID
 * @returns {Object|null}
 */
export function getContractDetail(database, id) {
  const { contracts, customers, opportunities, profiles, contractApprovalRecords, contractAttachments } = database

  const contract = contracts.find(c => c.id === id)
  if (!contract) return null

  const customerNames = new Map(customers.map(c => [c.id, c.name]))
  const opportunityNames = new Map(opportunities.map(o => [o.id, o.title]))
  const ownerNames = new Map(profiles.map(p => [p.id, p.name]))
  const profileNames = new Map(profiles.map(p => [p.id, p.name]))

  // 审批记录（按时间倒序）
  const approvalRecords = (contractApprovalRecords || [])
    .filter(r => r.contractId === id)
    .map(r => ({
      ...r,
      operatorName: profileNames.get(r.operatorId) || '未知用户',
      fromStatusLabel: CONTRACT_STATUS_LABELS[r.fromStatus] || r.fromStatus || '无',
      toStatusLabel: CONTRACT_STATUS_LABELS[r.toStatus] || r.toStatus
    }))
    .sort((a, b) => new Date(b.operatedAt) - new Date(a.operatedAt))

  // 附件列表
  const attachments = (contractAttachments || [])
    .filter(a => a.contractId === id)

  return {
    ...contract,
    customerName: customerNames.get(contract.customerId) || '未知客户',
    opportunityName: opportunityNames.get(contract.opportunityId) || '未知商机',
    ownerName: ownerNames.get(contract.ownerId) || '未知用户',
    statusLabel: CONTRACT_STATUS_LABELS[contract.status] || contract.status,
    statusType: CONTRACT_STATUS_TYPES[contract.status] || 'info',
    approvalRecords,
    attachments
  }
}

/**
 * 检查删除合同时的关联冲突
 * @param {Object} database - 完整的数据集
 * @param {string} contractId - 合同 ID
 * @returns {{ hasConflict: boolean, conflicts: Array }}
 */
export function getContractDeleteConflict(database, contractId) {
  // 合同级联删除无业务冲突（合同是最底层关联实体）
  return { hasConflict: false, conflicts: [] }
}

/**
 * 合同附件大小限制（10 MB）
 */
export const CONTRACT_ATTACHMENT_MAX_SIZE = 10 * 1024 * 1024

/**
 * 合同附件支持的扩展名列表
 */
export const CONTRACT_ATTACHMENT_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg'
]

/**
 * 合同附件 MIME 类型对照表
 */
export const CONTRACT_ATTACHMENT_MIME_MAP = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg'
}

/**
 * 校验合同附件上传参数
 *
 * @param {Object} database - 完整的数据集
 * @param {string} contractId - 合同 ID
 * @param {Object} input - { name, type, size }
 * @returns {{ valid: boolean, errors: Array }}
 */
export function validateContractAttachmentInput(database, contractId, input) {
  const errors = []

  // 合同必须存在
  const contract = database.contracts.find(c => c.id === contractId)
  if (!contract) {
    errors.push({ field: 'contractId', code: 105020, message: '合同不存在' })
    return { valid: false, errors }
  }

  // 已归档不可上传
  if (contract.status === 'archived') {
    errors.push({ field: 'status', code: 105021, message: '已归档的合同不可上传附件' })
    return { valid: false, errors }
  }

  // 文件名
  const name = (input.name || '').trim()
  if (!name) {
    errors.push({ field: 'name', code: 105022, message: '文件名不能为空' })
  }

  // 文件扩展名校验
  if (name) {
    const ext = name.split('.').pop().toLowerCase()
    if (!CONTRACT_ATTACHMENT_EXTENSIONS.includes(ext)) {
      errors.push({
        field: 'name',
        code: 105023,
        message: `不支持的文件格式「${ext}」，允许：${CONTRACT_ATTACHMENT_EXTENSIONS.join(', ')}`
      })
    }
  }

  // 文件大小校验
  const size = Number(input.size)
  if (!size || size <= 0) {
    errors.push({ field: 'size', code: 105024, message: '文件大小无效' })
  } else if (size > CONTRACT_ATTACHMENT_MAX_SIZE) {
    errors.push({
      field: 'size',
      code: 105025,
      message: `文件大小不能超过 ${CONTRACT_ATTACHMENT_MAX_SIZE / 1024 / 1024}MB`
    })
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 创建合同附件记录
 *
 * @param {string} contractId - 合同 ID
 * @param {Object} input - { name, type, size }
 * @param {string} uploaderId - 上传人 ID
 * @returns {Object} 附件对象
 */
export function createContractAttachment(contractId, input, uploaderId) {
  const ext = (input.name || '').split('.').pop().toLowerCase()
  const mimeType = CONTRACT_ATTACHMENT_MIME_MAP[ext] || 'application/octet-stream'

  const attachment = {
    id: crypto.randomUUID(),
    contractId,
    name: (input.name || '').trim(),
    type: ext,
    mimeType,
    size: Number(input.size) || 0,
    url: `/mock-files/contracts/${contractId}/${crypto.randomUUID()}.${ext}`,
    uploadedBy: uploaderId,
    uploadedAt: new Date().toISOString()
  }

  return attachment
}

/**
 * 判断是否可操作合同附件
 *
 * @param {Object} contract - 合同对象
 * @returns {boolean}
 */
export function canManageContractAttachments(contract) {
  return contract && contract.status !== 'archived'
}

/**
 * 获取即将到期/已到期的合同列表
 *
 * @param {Object} database - 完整的数据集
 * @param {number} [days=30] - 到期阈值（默认 30 天）
 * @param {number} [limit=10] - 最多返回数量
 * @returns {Array} 按到期时间升序排列的合同列表
 */
export function getExpiringContracts(database, days = 30, limit = 10) {
  const { contracts, customers, profiles } = database
  const customerNames = new Map(customers.map(c => [c.id, c.name]))
  const ownerNames = new Map(profiles.map(p => [p.id, p.name]))

  const now = new Date()
  const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

  const expiring = contracts
    .filter(c => {
      // 排除已归档的
      if (c.status === 'archived') return false
      const end = new Date(c.endDate)
      // 在阈值之前到期（已过期或即将到期）
      return end <= threshold
    })
    .map(c => {
      const { expiryStatus, daysRemaining } = getContractExpiry(c, now)
      return {
        ...c,
        customerName: customerNames.get(c.customerId) || '未知客户',
        ownerName: ownerNames.get(c.ownerId) || '未知用户',
        expiryStatus,
        daysRemaining,
        statusLabel: CONTRACT_STATUS_LABELS[c.status] || c.status,
        statusType: CONTRACT_STATUS_TYPES[c.status] || 'info'
      }
    })
    // 到期时间升序（最紧迫的排最前）
    .sort((a, b) => new Date(a.endDate) - new Date(b.endDate))
    .slice(0, limit)

  return expiring
}
