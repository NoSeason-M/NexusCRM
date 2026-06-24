import request from './request'

/**
 * 获取仪表盘概览指标
 * @param {Object} config - 可选配置 { params: { scenario: 'empty'|'error' } }
 */
export function getDashboardSummary(config) {
  return request.get('/dashboard/summary', config)
}

/**
 * 获取客户选项列表（用于筛选器等）
 * @param {Object} config - 可选配置
 */
export function getDashboardCustomerOptions(config) {
  return request.get('/dashboard/customers', config)
}

// ──── 待办 API ────

/** 获取待办列表 */
export function getTodos() {
  return request.get('/dashboard/todos')
}

/** 新建待办 */
export function createTodo(data) {
  return request.post('/dashboard/todos', data)
}

/** 更新待办 */
export function updateTodo(id, data) {
  return request.put(`/dashboard/todos/${id}`, data)
}

/** 删除待办 */
export function deleteTodo(id) {
  return request.delete(`/dashboard/todos/${id}`)
}

// ──── 跟进记录 API ────

/** 获取跟进记录列表 */
export function getRecentFollows() {
  return request.get('/dashboard/recent-follows')
}

/** 新建跟进记录 */
export function createFollow(data) {
  return request.post('/dashboard/recent-follows', data)
}

/** 更新跟进记录 */
export function updateFollow(id, data) {
  return request.put(`/dashboard/recent-follows/${id}`, data)
}

// ──── 图表数据 API ────

/** 获取销售漏斗数据 */
export function getSalesFunnel(config) {
  return request.get('/dashboard/charts/sales-funnel', config)
}

/** 获取合同签约趋势 */
export function getContractTrend(config) {
  return request.get('/dashboard/charts/contract-trend', config)
}

/** 获取工单状态分布 */
export function getTicketStatus(config) {
  return request.get('/dashboard/charts/ticket-status', config)
}
