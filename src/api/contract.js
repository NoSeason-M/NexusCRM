/**
 * 合同管理 API
 */
import request from './request'

/**
 * 组合查询合同列表
 * @param {Object} params - 查询参数（keyword, status, customerId, opportunityId, ownerId, expiryStatus, endDateStart, endDateEnd, page, pageSize）
 * @returns {Promise}
 */
export function getContracts(params = {}) {
  return request.get('/contracts', { params })
}

/**
 * 获取合同筛选选项
 * @returns {Promise}
 */
export function getContractOptions() {
  return request.get('/contracts/options')
}

/**
 * 获取合同统计概览
 * @param {Object} params - 筛选参数（与列表一致，不含分页）
 * @returns {Promise}
 */
export function getContractStatistics(params = {}) {
  return request.get('/contracts/statistics', { params })
}

/**
 * 获取到期合同列表
 * @param {Object} params - { days?, limit? }
 * @returns {Promise}
 */
export function getExpiringContracts(params = {}) {
  return request.get('/contracts/expiring', { params })
}

/**
 * 获取合同详情
 * @param {string} id - 合同 ID
 * @returns {Promise}
 */
export function getContract(id) {
  return request.get(`/contracts/${id}`)
}

/**
 * 新建合同
 * @param {Object} data - 合同数据
 * @returns {Promise}
 */
export function createContract(data) {
  return request.post('/contracts', data)
}

/**
 * 更新合同
 * @param {string} id - 合同 ID
 * @param {Object} data - 更新的字段
 * @returns {Promise}
 */
export function updateContract(id, data) {
  return request.put(`/contracts/${id}`, data)
}

/**
 * 删除合同
 * @param {string} id - 合同 ID
 * @returns {Promise}
 */
export function deleteContract(id) {
  return request.delete(`/contracts/${id}`)
}

/**
 * 合同状态流转
 * @param {string} id - 合同 ID
 * @param {Object} data - { toStatus, comment? }
 * @returns {Promise}
 */
export function updateContractStatus(id, data) {
  return request.patch(`/contracts/${id}/status`, data)
}

/**
 * 上传合同附件
 * @param {string} id - 合同 ID
 * @param {Object} data - { name, type, size }
 * @returns {Promise}
 */
export function createContractAttachment(id, data) {
  return request.post(`/contracts/${id}/attachments`, data)
}

/**
 * 删除合同附件
 * @param {string} id - 合同 ID
 * @param {string} attachmentId - 附件 ID
 * @returns {Promise}
 */
export function deleteContractAttachment(id, attachmentId) {
  return request.delete(`/contracts/${id}/attachments/${attachmentId}`)
}
