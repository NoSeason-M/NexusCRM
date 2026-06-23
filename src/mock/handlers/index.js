import { http, HttpResponse } from 'msw'
import { getStore, resetStore } from '../database/store'
import { ROLE_MENUS, ROLE_PERMISSIONS } from '../database/seed'

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
    JSON.stringify({ code, message, data: {} }),
    { status, headers: { 'Content-Type': 'application/json' } }
  )
}

/**
 * 从请求头中提取并验证 Token
 * Token 格式: base64(JSON.stringify({ username, timestamp }))
 */
function resolveUser(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  try {
    const token = authHeader.slice(7)
    const payload = JSON.parse(atob(token))
    const store = getStore()
    return store.profiles.find(p => p.username === payload.username) || null
  } catch {
    return null
  }
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
  }),

  // ──── 认证接口 ────

  // POST /api/auth/login — 登录
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return fail('请输入用户名和密码', 1001, 400)
    }

    const store = getStore()
    const account = store.accounts.find(a => a.username === username)

    if (!account) {
      return fail('用户不存在', 1002, 401)
    }

    if (account.password !== password) {
      return fail('密码错误', 1003, 401)
    }

    // 生成 Token（模拟 JWT）
    const payload = btoa(JSON.stringify({
      username: account.username,
      role: account.role,
      timestamp: Date.now()
    }))

    const profile = store.profiles.find(p => p.username === username)

    return success({
      token: payload,
      user: profile
    })
  }),

  // POST /api/auth/logout — 退出登录
  http.post('/api/auth/logout', () => {
    return success({ message: '已退出登录' })
  }),

  // GET /api/auth/profile — 获取当前用户档案
  http.get('/api/auth/profile', ({ request }) => {
    const user = resolveUser(request.headers.get('Authorization'))
    if (!user) {
      return fail('未登录或 Token 已过期', 1004, 401)
    }
    return success(user)
  }),

  // GET /api/auth/routes — 获取当前用户可访问的路由/菜单
  http.get('/api/auth/routes', ({ request }) => {
    const user = resolveUser(request.headers.get('Authorization'))
    if (!user) {
      return fail('未登录或 Token 已过期', 1004, 401)
    }
    const menus = ROLE_MENUS[user.role] || []
    return success(menus)
  }),

  // GET /api/auth/permissions — 获取当前用户权限列表
  http.get('/api/auth/permissions', ({ request }) => {
    const user = resolveUser(request.headers.get('Authorization'))
    if (!user) {
      return fail('未登录或 Token 已过期', 1004, 401)
    }
    const permissions = ROLE_PERMISSIONS[user.role] || []
    return success(permissions)
  })
]
