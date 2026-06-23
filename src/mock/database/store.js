import { generateUsers, generateProfiles, PRESET_ACCOUNTS } from './seed'

const STORAGE_KEY = 'nexus-crm-mock-data'

/**
 * 从 localStorage 加载数据，不存在或不完整则返回 null（触发 reset）
 */
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      // 校验必需字段，防止旧版本数据格式不完整导致报错
      if (data && Array.isArray(data.accounts) && Array.isArray(data.profiles)) {
        return data
      }
    }
  } catch {
    // ignore
  }
  return null
}

/**
 * 保存数据到 localStorage
 */
function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/**
 * 初始化 / 重置数据
 */
function reset() {
  const data = {
    // 预设账号（用于登录验证）
    accounts: PRESET_ACCOUNTS,
    // 用户档案数据
    profiles: generateProfiles(),
    // 随机用户（旧数据兼容，后续可移除）
    users: generateUsers(5)
  }
  save(data)
  return data
}

// 启动时自动初始化
let store = load() || reset()

export function getStore() {
  return store
}

export function resetStore() {
  store = reset()
  return store
}
