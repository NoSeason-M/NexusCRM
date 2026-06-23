/**
 * localStorage 工具函数
 * 统一管理认证相关的持久化数据
 */

const TOKEN_KEY = 'nexus-crm-token'
const USER_KEY = 'nexus-crm-user'
const MENUS_KEY = 'nexus-crm-menus'
const PERMISSIONS_KEY = 'nexus-crm-permissions'

// ─── Token ───

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY)
}

// ─── User ───

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setStoredUser(user) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(USER_KEY)
  }
}

// ─── Menus ───

export function getStoredMenus() {
  try {
    const raw = localStorage.getItem(MENUS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function setStoredMenus(menus) {
  if (menus && menus.length) {
    localStorage.setItem(MENUS_KEY, JSON.stringify(menus))
  } else {
    localStorage.removeItem(MENUS_KEY)
  }
}

// ─── Permissions ───

export function getStoredPermissions() {
  try {
    const raw = localStorage.getItem(PERMISSIONS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function setStoredPermissions(permissions) {
  if (permissions && permissions.length) {
    localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions))
  } else {
    localStorage.removeItem(PERMISSIONS_KEY)
  }
}

// ─── 批量操作 ───

/**
 * 清除所有认证相关存储
 */
export function clearAuthStorage() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(MENUS_KEY)
  localStorage.removeItem(PERMISSIONS_KEY)
}
