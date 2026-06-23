import request from './request'

/**
 * 登录
 * @param {string} username
 * @param {string} password
 */
export function login(data) {
  return request.post('/auth/login', data)
}

/**
 * 退出登录
 */
export function logout() {
  return request.post('/auth/logout')
}

/**
 * 获取当前用户信息
 */
export function getProfile() {
  return request.get('/auth/profile')
}

/**
 * 获取当前用户可访问的路由/菜单
 */
export function getAuthRoutes() {
  return request.get('/auth/routes')
}

/**
 * 获取当前用户权限列表
 */
export function getPermissions() {
  return request.get('/auth/permissions')
}
