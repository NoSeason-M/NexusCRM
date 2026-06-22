import { http, HttpResponse } from 'msw'
import { getStore, resetStore } from '../database/store'

/**
 * 统一响应格式
 * { code: 0, message: '操作成功', data: {} }
 */
function success(data = {}) {
  return HttpResponse.json({
    code: 0,
    message: '操作成功',
    data
  })
}

function fail(message = '操作失败', code = -1, status = 500) {
  return new HttpResponse(
    JSON.stringify({
      code,
      message,
      data: {}
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}

export const handlers = [
  // GET /api/health — 健康检查
  http.get('/api/health', () => {
    const store = getStore()
    return success({
      status: 'healthy',
      seed: 2026,
      users: store.users.length
    })
  }),

  // POST /api/mock/reset — 重置模拟数据
  http.post('/api/mock/reset', () => {
    const store = resetStore()
    return success({
      message: '模拟数据已重置',
      users: store.users.length
    })
  }),

  // GET /api/mock/error — 模拟服务器错误
  http.get('/api/mock/error', () => {
    return fail('模拟服务器内部错误', -1, 500)
  })
]
