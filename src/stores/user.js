import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, logout as logoutApi, getProfile, getAuthRoutes, getPermissions } from '@/api/auth'
import {
  getToken, setToken,
  getStoredUser, setStoredUser,
  setStoredMenus, setStoredPermissions,
  clearAuthStorage
} from '@/utils/storage'

import {
  hasPermission as checkHasPermission,
  hasAnyPermission as checkHasAnyPermission
} from '@/utils/permission'

export const useUserStore = defineStore('user', () => {
  // ─── State ───
  const token = ref(getToken())
  const user = ref(getStoredUser())
  const menus = ref([])
  const permissions = ref([])

  // ─── Getters ───
  const isLoggedIn = computed(() => !!token.value)
  const username = computed(() => user.value?.username || '')
  const roleName = computed(() => user.value?.roleName || '')
  const role = computed(() => user.value?.role || '')

  // ─── Actions ───

  /**
   * 登录
   */
  async function login(credentials) {
    const res = await loginApi(credentials)
    const { token: newToken, user: userInfo } = res.data

    // 保存状态
    token.value = newToken
    user.value = userInfo

    // 持久化到 localStorage
    setToken(newToken)
    setStoredUser(userInfo)

    // 加载菜单和权限
    await Promise.all([
      fetchMenus(),
      fetchPermissions()
    ])
  }

  /**
   * 退出登录（调用 API 后清除本地状态）
   */
  async function logout() {
    try {
      await logoutApi()
    } catch {
      // 忽略退出失败
    }
    clearSession()
  }

  /**
   * 清除会话
   */
  function clearSession() {
    token.value = ''
    user.value = null
    menus.value = []
    permissions.value = []
    clearAuthStorage()
  }

  /**
   * 从 localStorage 恢复会话
   */
  async function restoreSession() {
    if (!token.value) return false

    try {
      const [profileRes, menusRes, permsRes] = await Promise.all([
        getProfile(),
        getAuthRoutes(),
        getPermissions()
      ])
      user.value = profileRes.data
      menus.value = menusRes.data
      permissions.value = permsRes.data
      // 同步更新 localStorage
      setStoredUser(user.value)
      setStoredMenus(menus.value)
      setStoredPermissions(permissions.value)
      return true
    } catch {
      // Token 过期或无效
      clearSession()
      return false
    }
  }

  /**
   * 获取用户信息
   */
  async function fetchProfile() {
    const res = await getProfile()
    user.value = res.data
    setStoredUser(user.value)
  }

  /**
   * 获取菜单
   */
  async function fetchMenus() {
    const res = await getAuthRoutes()
    menus.value = res.data
    setStoredMenus(menus.value)
  }

  /**
   * 获取权限
   */
  async function fetchPermissions() {
    const res = await getPermissions()
    permissions.value = res.data
    setStoredPermissions(permissions.value)
  }

  /**
   * 检查是否有指定权限
   */
  function hasPermission(perm) {
    return checkHasPermission(permissions.value, perm)
  }

  /**
   * 检查是否拥有任一权限
   */
  function checkAnyPermission(perms) {
    return checkHasAnyPermission(permissions.value, perms)
  }

  return {
    token,
    user,
    menus,
    permissions,
    isLoggedIn,
    username,
    roleName,
    role,
    login,
    logout,
    clearSession,
    restoreSession,
    fetchProfile,
    fetchMenus,
    fetchPermissions,
    hasPermission,
    checkAnyPermission
  }
})
