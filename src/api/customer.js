/**
 * 客户管理 API
 */
import request from './request'

/**
 * 组合查询客户列表
 * @param {Object} params - 查询参数（keyword, industry, level, status, ownerId, page, pageSize）
 * @returns {Promise}
 */
export function getCustomers(params = {}) {
  return request.get('/customers', { params })
}

/**
 * 获取客户详情
 * @param {string} id - 客户 ID
 * @returns {Promise}
 */
export function getCustomer(id) {
  return request.get(`/customers/${id}`)
}

/**
 * 获取客户筛选选项（行业/级别/状态/负责人列表）
 * @returns {Promise}
 */
export function getCustomerFilterOptions() {
  return request.get('/customers/options')
}

/**
 * 新建客户
 * @param {Object} data - 客户数据
 * @returns {Promise}
 */
export function createCustomer(data) {
  return request.post('/customers', data)
}

/**
 * 更新客户
 * @param {string} id - 客户 ID
 * @param {Object} data - 更新的字段
 * @returns {Promise}
 */
export function updateCustomer(id, data) {
  return request.put(`/customers/${id}`, data)
}

/**
 * 删除客户
 * @param {string} id - 客户 ID
 * @returns {Promise}
 */
export function deleteCustomer(id) {
  return request.delete(`/customers/${id}`)
}

/**
 * 新增跟进记录
 * @param {string} id - 客户 ID
 * @param {Object} data - { method, content, nextFollowAt }
 * @returns {Promise}
 */
export function createFollowRecord(id, data) {
  return request.post(`/customers/${id}/follows`, data)
}

/**
 * 变更客户负责人
 * @param {string} id - 客户 ID
 * @param {string} ownerId - 新负责人 ID
 * @returns {Promise}
 */
export function updateCustomerOwner(id, ownerId) {
  return request.put(`/customers/${id}/owner`, { ownerId })
}
