import { faker } from '@faker-js/faker/locale/zh_CN'

// 设置随机种子，确保每次开发环境生成的数据一致
faker.seed(2026)

/**
 * 预设账号（用户名 / 密码 / 角色）
 */
export const PRESET_ACCOUNTS = [
  { username: 'admin',   password: 'Admin@2026',   role: 'admin' },
  { username: 'manager', password: 'Manager@2026', role: 'manager' },
  { username: 'sales',   password: 'Sales@2026',   role: 'sales' },
  { username: 'support', password: 'Support@2026', role: 'support' },
  { username: 'viewer',  password: 'Viewer@2026',  role: 'viewer' }
]

/**
 * 角色中文名映射
 */
const ROLE_NAMES = {
  admin: '超级管理员',
  manager: '经理',
  sales: '销售',
  support: '客服',
  viewer: '观察者'
}

/**
 * 角色权限配置
 */
export const ROLE_PERMISSIONS = {
  admin:   ['*'],
  manager: ['dashboard:view', 'customer:view', 'customer:create', 'opportunity:view', 'opportunity:create', 'contract:view', 'contract:approve', 'ticket:view'],
  sales:   ['dashboard:view', 'customer:view', 'customer:create', 'opportunity:view', 'opportunity:create', 'contract:view'],
  support: ['dashboard:view', 'customer:view', 'ticket:view', 'ticket:handle'],
  viewer:  ['dashboard:view', 'customer:view']
}

/**
 * 菜单路由配置（基于角色的可访问性）
 */
export const ROLE_MENUS = {
  admin: [
    { path: '/dashboard', title: '仪表盘', shortLabel: '盘', icon: 'Odometer' },
    { path: '/customers', title: '客户管理', shortLabel: '客', icon: 'User' },
    { path: '/opportunities', title: '商机管理', shortLabel: '机', icon: 'TrendCharts' },
    { path: '/contracts', title: '合同管理', shortLabel: '同', icon: 'Document' },
    { path: '/tickets', title: '工单管理', shortLabel: '单', icon: 'Ticket' },
    { path: '/api-docs', title: '接口文档', shortLabel: '档', icon: 'Document' },
    { path: '/settings', title: '系统设置', shortLabel: '设', icon: 'Setting' }
  ],
  manager: [
    { path: '/dashboard', title: '仪表盘', shortLabel: '盘', icon: 'Odometer' },
    { path: '/customers', title: '客户管理', shortLabel: '客', icon: 'User' },
    { path: '/opportunities', title: '商机管理', shortLabel: '机', icon: 'TrendCharts' },
    { path: '/contracts', title: '合同管理', shortLabel: '同', icon: 'Document' },
    { path: '/tickets', title: '工单管理', shortLabel: '单', icon: 'Ticket' },
    { path: '/api-docs', title: '接口文档', shortLabel: '档', icon: 'Document' }
  ],
  sales: [
    { path: '/dashboard', title: '仪表盘', shortLabel: '盘', icon: 'Odometer' },
    { path: '/customers', title: '客户管理', shortLabel: '客', icon: 'User' },
    { path: '/opportunities', title: '商机管理', shortLabel: '机', icon: 'TrendCharts' },
    { path: '/contracts', title: '合同管理', shortLabel: '同', icon: 'Document' },
    { path: '/api-docs', title: '接口文档', shortLabel: '档', icon: 'Document' }
  ],
  support: [
    { path: '/dashboard', title: '仪表盘', shortLabel: '盘', icon: 'Odometer' },
    { path: '/customers', title: '客户管理', shortLabel: '客', icon: 'User' },
    { path: '/tickets', title: '工单管理', shortLabel: '单', icon: 'Ticket' },
    { path: '/api-docs', title: '接口文档', shortLabel: '档', icon: 'Document' }
  ],
  viewer: [
    { path: '/dashboard', title: '仪表盘', shortLabel: '盘', icon: 'Odometer' },
    { path: '/customers', title: '客户管理', shortLabel: '客', icon: 'User' },
    { path: '/api-docs', title: '接口文档', shortLabel: '档', icon: 'Document' }
  ]
}

/**
 * 从预设账号 id 列表中随机取一个
 */
function pickUserId(profiles) {
  return faker.helpers.arrayElement(profiles).id
}

/**
 * 生成用户数据
 */
export function generateUsers(count = 5) {
  const users = []
  for (let i = 0; i < count; i++) {
    users.push({
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      phone: faker.phone.number(),
      role: faker.helpers.arrayElement(['admin', 'manager', 'sales', 'support', 'viewer']),
      createdAt: faker.date.between({ from: '2026-01-01', to: new Date() }).toISOString()
    })
  }
  return users
}

/**
 * 生成预设账号的完整用户档案
 */
export function generateProfiles() {
  return PRESET_ACCOUNTS.map(({ username, role }) => ({
    id: faker.string.uuid(),
    username,
    name: username === 'admin' ? '系统管理员'
      : username === 'manager' ? '张经理'
      : username === 'sales' ? '李销售'
      : username === 'support' ? '王客服'
      : '赵观察',
    email: `${username}@nexuscrm.com`,
    phone: faker.phone.number(),
    avatar: '',
    role,
    roleName: ROLE_NAMES[role],
    status: 'active',
    lastLoginAt: faker.date.recent({ days: 7 }).toISOString()
  }))
}

/**
 * 客户状态
 */
const CUSTOMER_STATUSES = ['active', 'active', 'active', 'inactive', 'lead']

/**
 * 生成客户数据（30~40 条）
 * @param {Array} profiles - 用户档案列表，用于 ownerId 外键
 */
export function generateCustomers(profiles) {
  const count = faker.number.int({ min: 30, max: 40 })
  const customers = []
  for (let i = 0; i < count; i++) {
    customers.push({
      id: faker.string.uuid(),
      name: faker.company.name(),
      phone: faker.phone.number(),
      email: faker.internet.email(),
      ownerId: pickUserId(profiles),
      status: faker.helpers.arrayElement(CUSTOMER_STATUSES),
      createdAt: faker.date.between({ from: '2025-01-01', to: new Date() }).toISOString()
    })
  }
  return customers
}

/**
 * 商机阶段
 */
const OPP_STAGES = ['qualification', 'qualification', 'proposal', 'proposal', 'negotiation', 'closed_won', 'closed_lost']

/**
 * 生成商机数据（20~30 条）
 * @param {Array} customers - 客户列表
 * @param {Array} profiles  - 用户档案列表
 */
export function generateOpportunities(customers, profiles) {
  const count = faker.number.int({ min: 20, max: 30 })
  const opportunities = []
  for (let i = 0; i < count; i++) {
    opportunities.push({
      id: faker.string.uuid(),
      title: faker.helpers.arrayElement([
        `${faker.company.buzzPhrase()}项目`,
        `${faker.company.buzzNoun()}升级方案`,
        `${faker.company.buzzVerb()}合作计划`
      ]),
      customerId: faker.helpers.arrayElement(customers).id,
      ownerId: pickUserId(profiles),
      amount: faker.number.int({ min: 50000, max: 5000000 }),
      stage: faker.helpers.arrayElement(OPP_STAGES),
      probability: faker.number.int({ min: 10, max: 100 }),
      expectedCloseDate: faker.date.between({ from: '2026-01-01', to: '2027-06-01' }).toISOString(),
      createdAt: faker.date.between({ from: '2025-06-01', to: new Date() }).toISOString()
    })
  }
  return opportunities
}

/**
 * 合同状态
 */
const CONTRACT_STATUSES = ['draft', 'pending_approval', 'active', 'active', 'completed', 'terminated']

/**
 * 生成合同数据（25~35 条）
 * @param {Array} customers     - 客户列表
 * @param {Array} opportunities - 商机列表
 */
export function generateContracts(customers, opportunities) {
  const count = faker.number.int({ min: 25, max: 35 })
  const contracts = []
  for (let i = 0; i < count; i++) {
    contracts.push({
      id: faker.string.uuid(),
      title: `${faker.company.buzzNoun()}服务合同`,
      customerId: faker.helpers.arrayElement(customers).id,
      opportunityId: faker.helpers.arrayElement(opportunities).id,
      amount: faker.number.int({ min: 100000, max: 10000000 }),
      status: faker.helpers.arrayElement(CONTRACT_STATUSES),
      signedAt: faker.date.between({ from: '2026-01-01', to: new Date() }).toISOString(),
      createdAt: faker.date.between({ from: '2025-06-01', to: new Date() }).toISOString()
    })
  }
  return contracts
}

/**
 * 工单优先级
 */
const TICKET_PRIORITIES = ['low', 'medium', 'medium', 'high', 'urgent']

/**
 * 工单状态
 */
const TICKET_STATUSES = ['open', 'open', 'in_progress', 'pending', 'resolved', 'closed']

/**
 * 生成工单数据（20~25 条）
 * @param {Array} customers - 客户列表
 * @param {Array} profiles  - 用户档案列表（用于 assigneeId）
 */
export function generateTickets(customers, profiles) {
  const count = faker.number.int({ min: 20, max: 25 })
  const tickets = []
  for (let i = 0; i < count; i++) {
    tickets.push({
      id: faker.string.uuid(),
      title: faker.helpers.arrayElement([
        '系统无法登录', '数据导出失败', '页面加载缓慢',
        '报表数据不一致', 'API 接口超时', '账号权限异常',
        '邮件通知未收到', '功能使用咨询', '数据备份申请',
        '性能优化需求'
      ]),
      customerId: faker.helpers.arrayElement(customers).id,
      assigneeId: pickUserId(profiles),
      priority: faker.helpers.arrayElement(TICKET_PRIORITIES),
      status: faker.helpers.arrayElement(TICKET_STATUSES),
      createdAt: faker.date.between({ from: '2026-03-01', to: new Date() }).toISOString()
    })
  }
  return tickets
}

/**
 * 生成文档数据（5~10 条）
 * @param {Array} profiles - 用户档案列表
 */
export function generateDocuments(profiles) {
  const count = faker.number.int({ min: 5, max: 10 })
  const docs = []
  for (let i = 0; i < count; i++) {
    docs.push({
      id: faker.string.uuid(),
      title: faker.helpers.arrayElement([
        '年度财务报告', '产品需求文档', '技术架构方案',
        '客户合作协议', '项目验收报告', '运维操作手册',
        '安全审计报告'
      ]),
      type: faker.helpers.arrayElement(['contract', 'report', 'proposal', 'other']),
      fileSize: faker.number.int({ min: 102400, max: 10485760 }),
      uploadedBy: pickUserId(profiles),
      createdAt: faker.date.between({ from: '2026-01-01', to: new Date() }).toISOString()
    })
  }
  return docs
}

/**
 * 待办优先级
 */
const TODO_PRIORITIES = ['high', 'medium', 'low']

/**
 * 待办状态
 */
const TODO_STATUSES = ['pending', 'in_progress', 'completed']

/**
 * 待办标题模板
 */
const TODO_TITLES = [
  '跟进客户合同续签', '整理季度销售报告', '安排产品演示',
  '更新客户档案信息', '回复客户咨询邮件', '准备提案材料',
  '检查工单处理进度', '安排团队周会', '完成数据备份',
  '审核合同条款', '处理客户投诉', '更新商机阶段'
]

/**
 * 生成待办数据（8~12 条）
 * @param {Array} customers - 客户列表
 * @param {Array} profiles  - 用户档案列表
 */
export function generateTodos(customers, profiles) {
  const count = faker.number.int({ min: 8, max: 12 })
  const todos = []
  for (let i = 0; i < count; i++) {
    todos.push({
      id: faker.string.uuid(),
      title: faker.helpers.arrayElement(TODO_TITLES),
      customerId: faker.helpers.arrayElement(customers).id,
      ownerId: pickUserId(profiles),
      priority: faker.helpers.arrayElement(TODO_PRIORITIES),
      status: faker.helpers.arrayElement(TODO_STATUSES),
      dueAt: faker.date.between({ from: new Date(), to: '2026-07-31' }).toISOString(),
      createdAt: faker.date.between({ from: '2026-06-01', to: new Date() }).toISOString()
    })
  }
  return todos
}

/**
 * 跟进方式
 */
const FOLLOW_METHODS = ['call', 'email', 'meeting', 'other']

/**
 * 生成跟进记录数据（10 条）
 * @param {Array} customers - 客户列表
 * @param {Array} profiles  - 用户档案列表
 */
export function generateRecentFollows(customers, profiles) {
  const count = 10
  const follows = []
  for (let i = 0; i < count; i++) {
    follows.push({
      id: faker.string.uuid(),
      customerId: faker.helpers.arrayElement(customers).id,
      ownerId: pickUserId(profiles),
      method: faker.helpers.arrayElement(FOLLOW_METHODS),
      content: faker.helpers.arrayElement([
        '沟通了项目需求细节，客户表示满意',
        '发送了最新报价单，等待客户确认',
        '安排了产品演示会议，客户反馈积极',
        '电话沟通了合同条款修改意见',
        '邮件回复了客户的技术问题',
        '拜访客户面谈合作方案',
        '确认了项目实施时间表',
        '处理了客户反馈的系统问题'
      ]),
      nextFollowAt: faker.date.between({ from: new Date(), to: '2026-07-31' }).toISOString(),
      createdAt: faker.date.between({ from: '2026-06-01', to: new Date() }).toISOString()
    })
  }
  return follows
}
