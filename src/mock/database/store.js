import { generateUsers } from './seed'

const STORAGE_KEY = 'nexus-crm-mock-data'

/**
 * 从 localStorage 加载数据，不存在则生成种子数据
 */
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw)
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
    users: generateUsers(5)
  }
  save(data)
  return data
}

// 启动时自动初始化
const store = load() || reset()

export function getStore() {
  return store
}

export function resetStore() {
  return reset()
}
