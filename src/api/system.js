/**
 * 系统管理 API
 */
import request from './request'

/** 获取系统用户列表 */
export function getSystemUsers(params = {}) {
  return request.get('/system/users', { params })
}

/** 获取系统用户选项（角色列表） */
export function getSystemUserOptions() {
  return request.get('/system/users/options')
}

/** 创建系统用户 */
export function createSystemUser(data) {
  return request.post('/system/users', data)
}

/** 更新系统用户 */
export function updateSystemUser(id, data) {
  return request.put(`/system/users/${id}`, data)
}

/** 变更用户状态 */
export function updateSystemUserStatus(id, status) {
  return request.patch(`/system/users/${id}/status`, { status })
}

/** 获取角色列表 */
export function getSystemRoles() {
  return request.get('/system/roles')
}

/** 获取菜单树 */
export function getSystemMenus() {
  return request.get('/system/menus')
}

/** 获取操作日志列表 */
export function getSystemLogs(params = {}) {
  return request.get('/system/logs', { params })
}

/** 获取操作日志选项（模块/操作人筛选） */
export function getSystemLogOptions() {
  return request.get('/system/logs/options')
}
