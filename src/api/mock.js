import request from './request'

/**
 * 获取模拟服务健康状态
 */
export function getMockHealth() {
  return request.get('/health')
}

/**
 * 重置模拟数据
 */
export function resetMockData() {
  return request.post('/mock/reset')
}
