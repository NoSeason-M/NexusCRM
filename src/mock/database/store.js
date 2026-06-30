import {
  PRESET_ACCOUNTS,
  generateUsers,
  generateProfiles,
  generateCustomers,
  generateOpportunities,
  generateOpportunityStageRecords,
  generateContracts,
  generateContractApprovalRecords,
  generateContractAttachments,
  generateTickets,
  generateTicketRecords,
  generateDocuments,
  generateTodos,
  generateRecentFollows
} from './seed'
import {
  generateSystemUsers,
  generateSystemRoles,
  generateSystemMenus,
  generateOperationLogs
} from './system'

const STORAGE_KEY = 'nexus-crm-mock-data'

/** 数据版本号，用于增量迁移 */
export const DATABASE_VERSION = 10

/**
 * 从 localStorage 加载数据，不存在或不完整则返回 null（触发 reset）
 */
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      // 校验必需字段，防止旧版本数据格式不完整导致报错
      if (data && data.version === DATABASE_VERSION && Array.isArray(data.accounts) && Array.isArray(data.profiles)) {
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
  const profiles = generateProfiles()
  const users = generateUsers(5)
  const customers = generateCustomers(profiles)
  const opportunities = generateOpportunities(customers, profiles)
  const contracts = generateContracts(customers, opportunities, profiles)
  const contractApprovalRecords = generateContractApprovalRecords(contracts, profiles)
  const contractAttachments = generateContractAttachments(contracts, profiles)
  const tickets = generateTickets(customers, profiles)
  const ticketRecords = generateTicketRecords(tickets, profiles)
  const documents = generateDocuments(profiles)

  const todos = generateTodos(customers, profiles)
  const recentFollows = generateRecentFollows(customers, profiles)
  const opportunityStageRecords = generateOpportunityStageRecords(opportunities, profiles)

  // 系统管理数据
  const systemUsers = generateSystemUsers(profiles)
  const operationLogs = generateOperationLogs(profiles)

  // 构建完整数据库用于角色 userCount
  const tempDb = { profiles, systemUsers }
  const systemRoles = generateSystemRoles(tempDb)
  const systemMenus = generateSystemMenus()

  const data = {
    version: DATABASE_VERSION,
    // 预设账号（用于登录验证）
    accounts: PRESET_ACCOUNTS,
    // 用户档案数据
    profiles,
    // 随机用户（旧数据兼容）
    users,
    // 业务数据
    customers,
    opportunities,
    contracts,
    contractApprovalRecords,
    contractAttachments,
    tickets,
    ticketRecords,
    documents,
    todos,
    recentFollows,
    opportunityStageRecords,
    // 系统管理数据
    systemUsers,
    systemRoles,
    systemMenus,
    operationLogs
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
