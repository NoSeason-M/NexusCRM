/**
 * 商机管理 API
 */
import request from './request'

/**
 * 组合查询商机列表
 * @param {Object} params - 查询参数（keyword, stage, ownerId, expectedCloseStart, expectedCloseEnd, page, pageSize）
 * @returns {Promise}
 */
export function getOpportunities(params = {}) {
  return request.get('/opportunities', { params })
}

/**
 * 获取商机统计概览
 * @param {Object} params - 筛选参数（与列表一致，不含分页）
 * @returns {Promise}
 */
export function getOpportunityStatistics(params = {}) {
  return request.get('/opportunities/statistics', { params })
}

/**
 * 获取商机筛选选项
 * @returns {Promise}
 */
export function getOpportunityFilterOptions() {
  return request.get('/opportunities/options')
}

/**
 * 获取商机详情
 * @param {string} id - 商机 ID
 * @returns {Promise}
 */
export function getOpportunityBoard() {
  return request.get('/opportunities/board')
}

/**
 * 获取商机详情
 * @param {string} id - 商机 ID
 * @returns {Promise}
 */
export function getOpportunity(id) {
  return request.get(`/opportunities/${id}`)
}

/**
 * 新建商机
 * @param {Object} data - 商机数据
 * @returns {Promise}
 */
export function createOpportunity(data) {
  return request.post('/opportunities', data)
}

/**
 * 更新商机
 * @param {string} id - 商机 ID
 * @param {Object} data - 更新的字段
 * @returns {Promise}
 */
export function updateOpportunity(id, data) {
  return request.put(`/opportunities/${id}`, data)
}

/**
 * 删除商机
 * @param {string} id - 商机 ID
 * @returns {Promise}
 */
export function deleteOpportunity(id) {
  return request.delete(`/opportunities/${id}`)
}

/**
 * 阶段流转
 * @param {string} id - 商机 ID
 * @param {Object} data - { toStage, note?, nextStep? }
 * @returns {Promise}
 */
export function updateOpportunityStage(id, data) {
  return request.patch(`/opportunities/${id}/stage`, data)
}
