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
