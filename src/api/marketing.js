/**
 * 营销活动 API
 */
import request from './request'

/** 组合查询营销活动列表 */
export function getMarketingCampaigns(params = {}) {
  return request.get('/marketing/campaigns', { params })
}

/** 获取营销活动筛选选项 */
export function getMarketingCampaignOptions() {
  return request.get('/marketing/campaigns/options')
}

/** 获取营销活动统计概览 */
export function getMarketingStatistics() {
  return request.get('/marketing/statistics')
}

/** 获取营销 ROI 分析数据 */
export function getMarketingAnalysisData() {
  return request.get('/marketing/analysis')
}

/** 获取营销活动详情 */
export function getMarketingCampaignDetail(id) {
  return request.get(`/marketing/campaigns/${id}`)
}

/** 新建营销活动 */
export function createMarketingCampaign(data) {
  return request.post('/marketing/campaigns', data)
}

/** 更新营销活动 */
export function updateMarketingCampaign(id, data) {
  return request.put(`/marketing/campaigns/${id}`, data)
}
