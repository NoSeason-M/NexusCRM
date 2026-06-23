/**
 * 权限检查工具函数
 */

/**
 * 检查是否有指定权限
 * @param {string[]} permissions - 当前用户权限列表
 * @param {string} permission - 所需权限编码，为空返回 true
 * @returns {boolean}
 */
export function hasPermission(permissions, permission) {
  if (!permission) return true
  // 通配符权限 '*'
  if (permissions.includes('*')) return true
  return permissions.includes(permission)
}

/**
 * 检查是否拥有任一权限
 * @param {string[]} permissions - 当前用户权限列表
 * @param {string[]} requiredPermissions - 所需权限编码数组
 * @returns {boolean}
 */
export function hasAnyPermission(permissions, requiredPermissions) {
  return requiredPermissions.some((permission) =>
    hasPermission(permissions, permission)
  )
}
