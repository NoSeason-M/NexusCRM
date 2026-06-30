/**
 * 工单管理 API
 */
import request from './request'

/**
 * 组合查询工单列表
 * @param {Object} params - 查询参数（keyword, customerId, issueType, status, priority, assigneeId, createdStart, createdEnd, page, pageSize）
 * @returns {Promise}
 */
export function getTickets(params = {}) {
  return request.get('/tickets', { params })
}

/**
 * 获取工单筛选选项
 * @returns {Promise}
 */
export function getTicketOptions() {
  return request.get('/tickets/options')
}

/**
 * 获取工单详情
 * @param {string} id - 工单 ID
 * @returns {Promise}
 */
export function getTicketDetail(id) {
  return request.get(`/tickets/${id}`)
}

/**
 * 新建工单
 * @param {Object} data - 工单数据
 * @returns {Promise}
 */
export function createTicket(data) {
  return request.post('/tickets', data)
}

/**
 * 分配工单
 * @param {string} id - 工单 ID
 * @param {string} assigneeId - 处理人 ID
 * @returns {Promise}
 */
export function assignTicket(id, assigneeId) {
  return request.patch(`/tickets/${id}/assign`, { assigneeId })
}

/**
 * 更新工单状态
 * @param {string} id - 工单 ID
 * @param {Object} data - { toStatus, comment? }
 * @returns {Promise}
 */
export function updateTicketStatus(id, data) {
  return request.patch(`/tickets/${id}/status`, data)
}

/**
 * 添加工单跟进记录
 * @param {string} id - 工单 ID
 * @param {string} content - 跟进内容
 * @returns {Promise}
 */
export function createTicketRecord(id, content) {
  return request.post(`/tickets/${id}/records`, { content })
}
