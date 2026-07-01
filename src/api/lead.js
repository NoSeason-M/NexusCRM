/**
 * 销售线索 API
 */
import request from './request'

/** 组合查询线索列表 */
export function getLeads(params = {}) {
  return request.get('/leads', { params })
}

/** 获取线索筛选选项 */
export function getLeadOptions() {
  return request.get('/leads/options')
}

/** 获取线索详情 */
export function getLeadDetail(id) {
  return request.get(`/leads/${id}`)
}

/** 新建线索 */
export function createLead(data) {
  return request.post('/leads', data)
}

/** 更新线索 */
export function updateLead(id, data) {
  return request.put(`/leads/${id}`, data)
}

/** 批量分配线索 */
export function assignLeads(data) {
  return request.patch('/leads/assign', data)
}

/** 添加线索跟进记录 */
export function createLeadFollow(id, data) {
  return request.post(`/leads/${id}/follows`, data)
}

/** 线索转化客户 */
export function convertLead(id, data) {
  return request.post(`/leads/${id}/convert`, data)
}
