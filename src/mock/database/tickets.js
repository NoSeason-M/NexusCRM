/**
 * 工单数据查询与操作层
 *
 * 提供组合查询、筛选选项、详情查询、创建工单、分配、状态流转等功能。
 */
import {
  TICKET_STATUS_LABELS,
  TICKET_STATUS_TYPES,
  TICKET_PRIORITY_LABELS,
  TICKET_PRIORITY_TYPES,
  ISSUE_TYPE_LABELS
} from './seed'

/**
 * 工单状态流转规则
 * pending→processing 通过分配操作自动执行，不在此表中定义
 */
export const TICKET_STATUS_TRANSITIONS = {
  pending: [],
  processing: ['pending_confirmation'],
  pending_confirmation: ['resolved'],
  resolved: ['closed'],
  closed: []
}

/**
 * 组合查询工单列表（含关键词搜索、多条件筛选、分页）
 *
 * @param {Object} database - 完整的数据集
 * @param {Object} searchParams - 查询参数
 * @param {string}  [searchParams.keyword]              - 关键词（模糊匹配 title / ticketNo / customerName）
 * @param {string}  [searchParams.customerId]           - 客户筛选
 * @param {string}  [searchParams.issueType]            - 工单类型筛选
 * @param {string}  [searchParams.status]               - 状态筛选
 * @param {string}  [searchParams.priority]             - 优先级筛选
 * @param {string}  [searchParams.assigneeId]           - 负责人筛选（"unassigned"=未分配）
 * @param {string}  [searchParams.createdStart]         - 创建日期起始
 * @param {string}  [searchParams.createdEnd]           - 创建日期截止
 * @param {number}  [searchParams.page=1]               - 页码（从 1 开始）
 * @param {number}  [searchParams.pageSize=20]          - 每页条数（最大 100）
 * @returns {{ list: Array, total: number, page: number, pageSize: number }}
 */
export function queryTickets(database, searchParams = {}) {
  const { tickets, customers, profiles, ticketRecords } = database

  // 构建名称映射
  const customerNames = new Map(customers.map(c => [c.id, c.name]))
  const profileNames = new Map(profiles.map(p => [p.id, p.name]))

  // 参数提取与默认值
  const {
    keyword, customerId, issueType, status, priority, assigneeId,
    createdStart, createdEnd
  } = searchParams
  let page = parseInt(searchParams.page, 10) || 1
  let pageSize = parseInt(searchParams.pageSize, 10) || 20

  if (page < 1) page = 1
  if (pageSize < 1) pageSize = 20
  if (pageSize > 100) pageSize = 100

  // 筛选
  let filtered = [...tickets]

  // 关键词搜索：title / ticketNo / customerName
  if (keyword && keyword.trim()) {
    const kw = keyword.trim().toLowerCase()
    filtered = filtered.filter(t =>
      t.title.toLowerCase().includes(kw) ||
      (t.ticketNo || '').toLowerCase().includes(kw) ||
      (customerNames.get(t.customerId) || '').toLowerCase().includes(kw)
    )
  }

  // 客户筛选
  if (customerId) {
    filtered = filtered.filter(t => t.customerId === customerId)
  }

  // 工单类型筛选
  if (issueType) {
    filtered = filtered.filter(t => t.issueType === issueType)
  }

  // 状态筛选
  if (status) {
    filtered = filtered.filter(t => t.status === status)
  }

  // 优先级筛选
  if (priority) {
    filtered = filtered.filter(t => t.priority === priority)
  }

  // 负责人筛选（"unassigned"=未分配）
  if (assigneeId === 'unassigned') {
    filtered = filtered.filter(t => !t.assigneeId)
  } else if (assigneeId) {
    filtered = filtered.filter(t => t.assigneeId === assigneeId)
  }

  // 创建日期范围
  if (createdStart) {
    const start = new Date(createdStart)
    start.setHours(0, 0, 0, 0)
    if (!Number.isNaN(start.getTime())) {
      filtered = filtered.filter(t => new Date(t.createdAt).getTime() >= start.getTime())
    }
  }
  if (createdEnd) {
    const end = new Date(createdEnd)
    end.setHours(23, 59, 59, 999)
    if (!Number.isNaN(end.getTime())) {
      filtered = filtered.filter(t => new Date(t.createdAt).getTime() <= end.getTime())
    }
  }

  // 总数
  const total = filtered.length

  // 分页
  const start = (page - 1) * pageSize
  const paged = filtered.slice(start, start + pageSize)

  // 补充名称、标签等信息
  const list = paged.map(t => ({
    ...t,
    customerName: customerNames.get(t.customerId) || '未知客户',
    creatorName: profileNames.get(t.creatorId) || '未知用户',
    assigneeName: t.assigneeId ? (profileNames.get(t.assigneeId) || '未知用户') : null,
    statusLabel: TICKET_STATUS_LABELS[t.status] || t.status,
    statusType: TICKET_STATUS_TYPES[t.status] || 'info',
    priorityLabel: TICKET_PRIORITY_LABELS[t.priority] || t.priority,
    priorityType: TICKET_PRIORITY_TYPES[t.priority] || '',
    issueTypeLabel: ISSUE_TYPE_LABELS[t.issueType] || t.issueType
  }))

  return { list, total, page, pageSize }
}

/**
 * 获取工单筛选选项
 *
 * @param {Object} database - 完整的数据集
 * @returns {{ statuses: Array, priorities: Array, issueTypes: Array, customers: Array, assignees: Array }}
 */
export function getTicketOptions(database) {
  const { customers, profiles } = database

  const statuses = Object.entries(TICKET_STATUS_LABELS).map(([value, label]) => ({
    value, label
  }))

  const priorities = Object.entries(TICKET_PRIORITY_LABELS).map(([value, label]) => ({
    value, label
  }))

  const issueTypes = Object.entries(ISSUE_TYPE_LABELS).map(([value, label]) => ({
    value, label
  }))

  const customerOpts = customers.map(c => ({ id: c.id, name: c.name }))

  const assignees = profiles
    .filter(p => p.status !== 'inactive')
    .map(p => ({ id: p.id, name: p.name }))

  return { statuses, priorities, issueTypes, customers: customerOpts, assignees }
}

/**
 * 获取工单详情（含操作记录）
 *
 * @param {Object} database - 完整的数据集
 * @param {string} id - 工单 ID
 * @returns {Object|null}
 */
export function getTicketDetail(database, id) {
  const { tickets, customers, profiles, ticketRecords } = database

  const ticket = tickets.find(t => t.id === id)
  if (!ticket) return null

  const customerNames = new Map(customers.map(c => [c.id, c.name]))
  const profileNames = new Map(profiles.map(p => [p.id, p.name]))

  // 操作记录（按时间正序排列）
  const records = (ticketRecords || [])
    .filter(r => r.ticketId === id)
    .map(r => ({
      ...r,
      operatorName: profileNames.get(r.operatorId) || '未知用户',
      fromStatusLabel: r.fromStatus ? (TICKET_STATUS_LABELS[r.fromStatus] || r.fromStatus) : null,
      toStatusLabel: TICKET_STATUS_LABELS[r.toStatus] || r.toStatus
    }))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

  return {
    ...ticket,
    customerName: customerNames.get(ticket.customerId) || '未知客户',
    creatorName: profileNames.get(ticket.creatorId) || '未知用户',
    assigneeName: ticket.assigneeId ? (profileNames.get(ticket.assigneeId) || '未知用户') : null,
    statusLabel: TICKET_STATUS_LABELS[ticket.status] || ticket.status,
    statusType: TICKET_STATUS_TYPES[ticket.status] || 'info',
    priorityLabel: TICKET_PRIORITY_LABELS[ticket.priority] || ticket.priority,
    priorityType: TICKET_PRIORITY_TYPES[ticket.priority] || '',
    issueTypeLabel: ISSUE_TYPE_LABELS[ticket.issueType] || ticket.issueType,
    records
  }
}

// ──── 工单编号自增 ────

let ticketNoCounter = null

function getNextTicketNo(database) {
  if (ticketNoCounter === null) {
    const max = database.tickets.reduce((maxNo, t) => {
      const num = parseInt((t.ticketNo || 'TK-20260000').replace('TK-', ''), 10)
      return num > maxNo ? num : maxNo
    }, 20260000)
    ticketNoCounter = max + 1
  }
  return `TK-${ticketNoCounter++}`
}

/**
 * 1. validateTicketInput — 校验工单输入
 *
 * @param {Object} database - 完整的数据集
 * @param {Object} input - 工单输入
 * @returns {{ valid: boolean, errors: Array<{ code: number, message: string }>, data?: Object }}
 */
export function validateTicketInput(database, input) {
  const errors = []
  const { customers, profiles } = database

  // title — 必填，最大 100 字符
  if (!input.title || !input.title.trim()) {
    errors.push({ code: 2001, message: '工单标题不能为空' })
  } else if (input.title.length > 100) {
    errors.push({ code: 2002, message: '工单标题不能超过 100 个字符' })
  }

  // customerId — 必填，客户必须存在
  if (!input.customerId) {
    errors.push({ code: 2003, message: '请选择关联客户' })
  } else if (!customers.find(c => c.id === input.customerId)) {
    errors.push({ code: 2004, message: '指定的客户不存在' })
  }

  // issueType — 必填，枚举校验
  const validIssueTypes = ['system_bug', 'feature_request', 'data_issue', 'account_issue', 'consultation', 'complaint']
  if (!input.issueType || !validIssueTypes.includes(input.issueType)) {
    errors.push({ code: 2005, message: '无效的工单类型' })
  }

  // priority — 必填，枚举校验
  const validPriorities = ['low', 'medium', 'high', 'urgent']
  if (!input.priority || !validPriorities.includes(input.priority)) {
    errors.push({ code: 2006, message: '无效的优先级' })
  }

  // description — 可选，最大 2000 字符
  if (input.description && input.description.length > 2000) {
    errors.push({ code: 2007, message: '描述不能超过 2000 个字符' })
  }

  // ownerId (assigneeId) — 可选，指定时必须存在且活跃
  if (input.assigneeId) {
    const assignee = profiles.find(p => p.id === input.assigneeId)
    if (!assignee) {
      errors.push({ code: 2008, message: '指定的处理人不存在' })
    } else if (assignee.status === 'inactive') {
      errors.push({ code: 2009, message: '指定的处理人已停用' })
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  const data = {
    title: input.title.trim(),
    customerId: input.customerId,
    issueType: input.issueType,
    priority: input.priority,
    description: input.description ? input.description.trim() : '',
    assigneeId: input.assigneeId || null
  }

  return { valid: true, errors: [], data }
}

/**
 * 2. createTicket — 创建工单
 *
 * @param {Object} database - 完整的数据集
 * @param {Object} input - 已校验的工单输入
 * @param {string} creatorId - 创建人 ID
 * @returns {{ ticket: Object, record: Object }}
 */
export function createTicket(database, input, creatorId) {
  const now = new Date().toISOString()

  const ticket = {
    id: crypto.randomUUID(),
    ticketNo: getNextTicketNo(database),
    title: input.title,
    customerId: input.customerId,
    issueType: input.issueType,
    priority: input.priority,
    status: 'pending',
    description: input.description || '',
    creatorId,
    assigneeId: null,
    createdAt: now,
    updatedAt: now,
    resolvedAt: null,
    closedAt: null
  }

  // 创建操作记录
  const record = {
    id: crypto.randomUUID(),
    ticketId: ticket.id,
    type: 'create',
    fromStatus: null,
    toStatus: 'pending',
    operatorId: creatorId,
    content: '创建工单',
    createdAt: now
  }

  return { ticket, record }
}

/**
 * 3. validateTicketAssignment — 校验工单分配
 *
 * @param {Object} database - 完整的数据集
 * @param {Object} ticket - 工单对象
 * @param {Object} input - { assigneeId }
 * @returns {{ valid: boolean, errors: Array }}
 */
export function validateTicketAssignment(database, ticket, input) {
  const errors = []
  const { profiles } = database

  if (!input.assigneeId) {
    errors.push({ code: 2101, message: '请选择处理人' })
    return { valid: false, errors }
  }

  const assignee = profiles.find(p => p.id === input.assigneeId)
  if (!assignee) {
    errors.push({ code: 2102, message: '指定的处理人不存在' })
  } else if (assignee.status === 'inactive') {
    errors.push({ code: 2103, message: '指定的处理人已停用' })
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  return { valid: true, errors: [] }
}

/**
 * 4. assignTicket — 分配工单
 *
 * 设置 assigneeId，将状态从 pending 推进到 processing，记录 assign 操作。
 *
 * @param {Object} database - 完整的数据集
 * @param {Object} ticket - 工单对象（引用，会被修改）
 * @param {Object} input - { assigneeId }
 * @param {string} operatorId - 操作人 ID
 * @returns {{ ticket: Object, record: Object }}
 */
export function assignTicket(database, ticket, input, operatorId) {
  const now = new Date().toISOString()

  ticket.assigneeId = input.assigneeId
  ticket.updatedAt = now

  // 如果当前是 pending，自动推进到 processing
  const fromStatus = ticket.status
  if (ticket.status === 'pending') {
    ticket.status = 'processing'
  }

  const record = {
    id: crypto.randomUUID(),
    ticketId: ticket.id,
    type: 'assign',
    fromStatus,
    toStatus: ticket.status,
    operatorId,
    content: `分配工单给 ${input.assigneeId}`,
    createdAt: now
  }

  return { ticket, record }
}

/**
 * 5. validateTicketStatusTransition — 校验状态流转
 *
 * 规则：
 * 1. closed 状态不可再流转
 * 2. pending→processing 只允许通过分配操作（不在此处流转）
 * 3. 其他状态按 TICKET_STATUS_TRANSITIONS 规则流转
 * 4. toStatus 必须存在
 *
 * @param {Object} ticket - 工单对象
 * @param {Object} input - { toStatus }
 * @returns {{ valid: boolean, errors: Array }}
 */
export function validateTicketStatusTransition(ticket, input) {
  const errors = []

  if (!input.toStatus) {
    errors.push({ code: 2201, message: '目标状态不能为空' })
    return { valid: false, errors }
  }

  // closed 不可再流转
  if (ticket.status === 'closed') {
    errors.push({ code: 2202, message: '已关闭的工单不可再变更状态' })
    return { valid: false, errors }
  }

  // 校验状态是否存在
  const validStatuses = Object.keys(TICKET_STATUS_LABELS)
  if (!validStatuses.includes(input.toStatus)) {
    errors.push({ code: 2203, message: '无效的目标状态' })
    return { valid: false, errors }
  }

  if (input.toStatus === ticket.status) {
    errors.push({ code: 2204, message: '状态未发生变化' })
    return { valid: false, errors }
  }

  // pending→processing 只能通过分配操作
  if (ticket.status === 'pending' && input.toStatus === 'processing') {
    errors.push({ code: 2205, message: '请通过分配操作将工单状态变更为处理中' })
    return { valid: false, errors }
  }

  // 校验流转规则
  const allowedTransitions = TICKET_STATUS_TRANSITIONS[ticket.status] || []
  if (!allowedTransitions.includes(input.toStatus)) {
    errors.push({ code: 2206, message: `当前状态"${TICKET_STATUS_LABELS[ticket.status]}"不允许直接变更为"${TICKET_STATUS_LABELS[input.toStatus]}"` })
    return { valid: false, errors }
  }

  return { valid: true, errors: [] }
}

/**
 * 6. transitionTicketStatus — 执行状态流转
 *
 * @param {Object} database - 完整的数据集（未使用，保留参数一致性）
 * @param {Object} ticket - 工单对象（引用，会被修改）
 * @param {Object} input - { toStatus, comment? }
 * @param {string} operatorId - 操作人 ID
 * @returns {{ ticket: Object, record: Object }}
 */
export function transitionTicketStatus(database, ticket, input, operatorId) {
  const now = new Date().toISOString()
  const fromStatus = ticket.status

  // 更新工单状态
  ticket.status = input.toStatus
  ticket.updatedAt = now

  // 根据目标状态设置时间戳
  if (input.toStatus === 'resolved' && !ticket.resolvedAt) {
    ticket.resolvedAt = now
  }
  if (input.toStatus === 'closed' && !ticket.closedAt) {
    ticket.closedAt = now
  }

  // 创建状态变更记录
  const record = {
    id: crypto.randomUUID(),
    ticketId: ticket.id,
    type: 'status',
    fromStatus,
    toStatus: input.toStatus,
    operatorId,
    content: input.comment || `状态从"${TICKET_STATUS_LABELS[fromStatus]}"变更为"${TICKET_STATUS_LABELS[input.toStatus]}"`,
    createdAt: now
  }

  return { ticket, record }
}

/**
 * 7. validateTicketRecordInput — 校验跟进记录（备注）
 *
 * @param {Object} input - { content }
 * @returns {{ valid: boolean, errors: Array }}
 */
export function validateTicketRecordInput(input) {
  const errors = []

  if (!input.content || !input.content.trim()) {
    errors.push({ code: 2301, message: '跟进内容不能为空' })
  } else if (input.content.length > 1000) {
    errors.push({ code: 2302, message: '跟进内容不能超过 1000 个字符' })
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  return { valid: true, errors: [] }
}

/**
 * 8-9. persistTicketOperation — 持久化工单操作
 *
 * 将新创建的工单、操作记录持久化到 store 中。
 * 使用 nextTime 保证 created 时间有序：
 *   nextTime = max(Date.now(), latestTime + 1ms)
 *
 * @param {Object} database - 完整的数据集（引用，会被修改）
 * @param {Object} operation - { ticket?, record?, log? }
 *   - ticket: 工单对象（新建时推入 database.tickets）
 *   - record: 操作记录（推入 database.ticketRecords）
 *   - log: 操作日志（推入 database.operationLogs，可选）
 */
export function persistTicketOperation(database, operation) {
  const { ticket, record, log } = operation

  // 确保 record 的 createdAt 严格递增
  if (record) {
    const allRecords = database.ticketRecords || []
    const latestTime = allRecords.length > 0
      ? new Date(allRecords[allRecords.length - 1].createdAt).getTime()
      : 0
    const now = Date.now()
    const nextTime = Math.max(now, latestTime + 1)
    record.createdAt = new Date(nextTime).toISOString()
  }

  if (ticket) {
    if (!database.tickets) database.tickets = []
    database.tickets.unshift(ticket)
  }

  if (record) {
    if (!database.ticketRecords) database.ticketRecords = []
    database.ticketRecords.push(record)
  }

  if (log) {
    if (!database.operationLogs) database.operationLogs = []
    database.operationLogs.push(log)
  }
}

export { getNextTicketNo }
