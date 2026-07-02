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

/**
 * 获取演示场景数据（包含账号、路由、诊断信息）
 */
export function getDemoScenario() {
  return request.get('/mock/demo-scenario')
}
