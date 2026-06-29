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
  manager: ['dashboard:view', 'customer:view', 'customer:create', 'customer:edit', 'customer:delete', 'customer:assign', 'customer:follow', 'opportunity:view', 'opportunity:create', 'opportunity:edit', 'opportunity:delete', 'opportunity:stage', 'contract:view', 'contract:create', 'contract:edit', 'contract:delete', 'contract:approve', 'contract:attachment', 'ticket:view'],
  sales:   ['dashboard:view', 'customer:view', 'customer:create', 'customer:edit', 'customer:delete', 'customer:follow', 'opportunity:view', 'opportunity:create', 'opportunity:edit', 'opportunity:delete', 'opportunity:stage', 'contract:view', 'contract:create', 'contract:attachment'],
  support: ['dashboard:view', 'customer:view', 'customer:follow', 'ticket:view', 'ticket:handle'],
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
 * 客户状态（含权重）
 */
export const CUSTOMER_STATUSES = ['active', 'active', 'active', 'potential', 'inactive', 'at_risk', 'lead']

/**
 * 客户级别
 */
export const CUSTOMER_LEVELS = ['platinum', 'gold', 'silver', 'regular']

/**
 * 行业列表
 */
export const INDUSTRIES = ['互联网/IT', '金融/银行', '医疗健康', '教育培训', '制造业', '零售电商', '房地产', '物流运输', '能源环保', '文化传媒']

/**
 * 省份列表
 */
export const PROVINCES = ['北京市', '上海市', '广东省', '浙江省', '江苏省', '四川省', '湖北省', '山东省', '福建省', '河南省']

/**
 * 来源渠道
 */
export const SOURCES = ['官网注册', '线下展会', '客户推荐', '电话邀约', '在线广告', '合作伙伴']

/**
 * 生成客户数据（30~40 条）
 * @param {Array} profiles - 用户档案列表，用于 ownerId 外键
 */
export function generateCustomers(profiles) {
  const count = faker.number.int({ min: 30, max: 40 })
  const customers = []
  for (let i = 0; i < count; i++) {
    const createdAt = faker.date.between({ from: '2025-01-01', to: new Date() }).toISOString()
    customers.push({
      id: faker.string.uuid(),
      name: faker.company.name(),
      // 行业
      industry: faker.helpers.arrayElement(INDUSTRIES),
      // 客户级别
      level: faker.helpers.arrayElement(CUSTOMER_LEVELS),
      // 状态
      status: faker.helpers.arrayElement(CUSTOMER_STATUSES),
      // 负责人
      ownerId: pickUserId(profiles),
      // 地址
      province: faker.helpers.arrayElement(PROVINCES),
      city: faker.helpers.arrayElement(['东城区', '西城区', '朝阳区', '浦东新区', '天河区', '南山区', '西湖区', '高新区', '工业园区', '经开区']),
      address: faker.location.streetAddress(),
      // 来源
      source: faker.helpers.arrayElement(SOURCES),
      // 联系人
      contactName: faker.person.fullName(),
      contactPhone: faker.phone.number(),
      contactTitle: faker.helpers.arrayElement(['CEO', 'CTO', '技术总监', '产品经理', '销售总监', '采购经理', '项目经理', '运营总监']),
      contactEmail: faker.internet.email(),
      // 描述
      description: faker.helpers.arrayElement([
        '长期合作客户，信任度高',
        '新开发客户，需持续跟进',
        '战略合作伙伴，深度绑定',
        '重点维护客户，定期回访',
        '高潜力客户，正在培育',
        '行业标杆客户，有示范效应'
      ]),
      // 跟进信息
      lastFollowAt: faker.date.between({ from: '2026-05-01', to: new Date() }).toISOString(),
      // 时间戳
      createdAt,
      updatedAt: faker.date.between({ from: createdAt, to: new Date() }).toISOString()
    })
  }
  return customers
}

/**
 * 商机阶段（含概率权重）
 *
 * 阶段与概率映射：
 *   lead         → 10%
 *   qualified    → 30%
 *   proposal     → 50%
 *   negotiation  → 75%
 *   won          → 100%
 *   lost         → 0%
 */
export const OPP_STAGES = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']

/**
 * 商机阶段中文名映射
 */
export const OPP_STAGE_LABELS = {
  lead: '初步接触',
  qualified: '需求确认',
  proposal: '方案报价',
  negotiation: '商务谈判',
  won: '赢单',
  lost: '输单'
}

/**
 * 商机阶段对应概率
 */
export const OPP_STAGE_PROBABILITY = {
  lead: 10,
  qualified: 30,
  proposal: 50,
  negotiation: 75,
  won: 100,
  lost: 0
}

/**
 * 商机阶段在表格/统计中的显示顺序
 */
export const OPP_STAGE_ORDER = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']

/**
 * 商机阶段允许流转规则
 * key 为当前阶段，value 为可流转到的阶段列表
 */
export const OPP_STAGE_TRANSITIONS = {
  lead: ['qualified', 'lost'],
  qualified: ['proposal', 'lost'],
  proposal: ['negotiation', 'lost'],
  negotiation: ['won', 'lost'],
  won: [],
  lost: []
}

/**
 * 生成商机数据（40~48 条）
 * @param {Array} customers - 客户列表
 * @param {Array} profiles  - 用户档案列表
 */
export function generateOpportunities(customers, profiles) {
  const count = faker.number.int({ min: 40, max: 48 })
  const opportunities = []
  for (let i = 0; i < count; i++) {
    const stage = faker.helpers.arrayElement(OPP_STAGES)
    const probability = OPP_STAGE_PROBABILITY[stage]
    const createdAt = faker.date.between({ from: '2025-06-01', to: new Date() }).toISOString()
    const expectedCloseDate = faker.date.between({ from: '2026-01-01', to: '2027-06-01' }).toISOString()

    opportunities.push({
      id: faker.string.uuid(),
      title: faker.helpers.arrayElement([
        `${faker.company.buzzNoun()}数字化升级项目`,
        `${faker.company.buzzVerb()}平台建设项目`,
        `${faker.company.buzzNoun()}系统集成方案`,
        `企业${faker.company.buzzNoun()}解决方案`,
        `${faker.company.buzzVerb()}服务合作协议`
      ]),
      customerId: faker.helpers.arrayElement(customers).id,
      ownerId: pickUserId(profiles),
      stage,
      probability,
      amount: faker.number.int({ min: 50000, max: 5000000 }),
      expectedCloseDate,
      nextStep: faker.helpers.arrayElement([
        '安排产品演示',
        '准备详细报价',
        '客户高层拜访',
        '技术方案评审',
        '合同条款协商',
        '等待客户内部审批',
        '推进POC测试',
        '商务谈判准备'
      ]),
      description: faker.helpers.arrayElement([
        '客户信息化建设重点项目，预算充足',
        '老客户增购需求，合作基础好',
        '竞争对手已介入，需加速推进',
        '客户需求明确，周期较短',
        '战略级项目，高层高度关注',
        '客户首次合作，需建立信任',
        '项目涉及多个部门，决策链较长'
      ]),
      createdAt,
      updatedAt: faker.date.between({ from: createdAt, to: new Date() }).toISOString()
    })
  }
  return opportunities
}

/**
 * 生成商机阶段流转记录
 * 每个商机生成 1~2 条历史记录（模拟阶段推进过程）
 * @param {Array} opportunities - 商机列表
 * @param {Array} profiles - 用户档案列表
 */
export function generateOpportunityStageRecords(opportunities, _profiles) {
  const records = []
  for (const opp of opportunities) {
    // 记录初始阶段
    records.push({
      id: faker.string.uuid(),
      opportunityId: opp.id,
      fromStage: null,
      toStage: opp.stage,
      changedBy: opp.ownerId,
      note: '初始创建',
      changedAt: opp.createdAt
    })

    // 如果阶段靠后，模拟一条推进记录
    const stageIndex = OPP_STAGE_ORDER.indexOf(opp.stage)
    if (stageIndex >= 2) {
      const prevStage = OPP_STAGE_ORDER[stageIndex - 1]
      const changedAt = faker.date.between({ from: opp.createdAt, to: new Date() }).toISOString()
      records.push({
        id: faker.string.uuid(),
        opportunityId: opp.id,
        fromStage: prevStage,
        toStage: opp.stage,
        changedBy: opp.ownerId,
        note: faker.helpers.arrayElement([
          '需求确认完成，推进方案阶段',
          '方案评审通过，进入商务谈判',
          '客户需求明确，阶段推进',
          '经过多次沟通，达成一致推进'
        ]),
        changedAt
      })
    }
  }
  return records
}

/**
 * 合同状态（完整生命周期）
 * draft → approving → approved/rejected → signed → archived
 */
const CONTRACT_STATUSES = ['draft', 'approving', 'approved', 'signed', 'signed', 'archived']

/**
 * 合同编号前缀
 */
let contractNoCounter = 20260001
function nextContractNo() {
  return `CT-${contractNoCounter++}`
}

/**
 * 生成合同数据（30 条）
 * @param {Array} customers     - 客户列表
 * @param {Array} opportunities - 商机列表（仅取 won 状态的）
 */
export function generateContracts(customers, opportunities, profiles) {
  const count = 30
  const contracts = []
  // 只取 won 状态的商机用于合同关联
  const wonOpps = opportunities.filter(o => o.stage === 'won')
  // 如果 won 商机不够，退而求其次
  const validOpps = wonOpps.length > 0 ? wonOpps : opportunities

  for (let i = 0; i < count; i++) {
    const status = faker.helpers.arrayElement(CONTRACT_STATUSES)
    const createdAt = faker.date.between({ from: '2025-06-01', to: new Date() }).toISOString()
    const signedAt = status === 'signed' || status === 'archived'
      ? faker.date.between({ from: '2026-01-01', to: new Date() }).toISOString()
      : null
    const startDate = faker.date.between({ from: '2026-01-01', to: '2026-06-01' }).toISOString()
    const endDate = faker.date.between({ from: '2026-07-01', to: '2027-12-31' }).toISOString()

    contracts.push({
      id: faker.string.uuid(),
      contractNo: nextContractNo(),
      name: faker.helpers.arrayElement([
        `${faker.company.buzzNoun()}系统开发合同`,
        `${faker.company.buzzNoun()}服务合作协议`,
        `企业${faker.company.buzzNoun()}解决方案合同`,
        `${faker.company.buzzVerb()}平台运维合同`,
        `${faker.company.buzzNoun()}技术咨询合同`,
        `年度${faker.company.buzzNoun()}服务合同`
      ]),
      customerId: faker.helpers.arrayElement(customers).id,
      opportunityId: faker.helpers.arrayElement(validOpps).id,
      ownerId: pickUserId(profiles),
      amount: faker.number.int({ min: 100000, max: 10000000 }),
      status,
      startDate,
      endDate,
      signedAt,
      description: faker.helpers.arrayElement([
        '双方经友好协商，达成以下合作条款',
        '本合同为框架协议，具体项目另行约定',
        '根据招标结果签订本合同',
        '续签合同，条款与上一年度一致',
        '为保障项目顺利实施，特签订本合同'
      ]),
      createdAt,
      updatedAt: faker.date.between({ from: createdAt, to: new Date() }).toISOString()
    })
  }
  return contracts
}

/**
 * 生成合同审批记录（每个合同 1~3 条）
 * @param {Array} contracts - 合同列表
 * @param {Array} profiles  - 用户档案列表
 */
export function generateContractApprovalRecords(contracts, profiles) {
  const records = []
  for (const contract of contracts) {
    const recordCount = contract.status === 'signed' || contract.status === 'archived' ? faker.number.int({ min: 2, max: 3 }) : 1

    for (let i = 0; i < recordCount; i++) {
      const prevStatus = i === 0 ? null : (contract.status === 'signed' ? ['draft', 'approving', 'approved'][i - 1] : null)
      const curStatus = contract.status === 'signed'
        ? ['draft', 'approving', 'approved'][i]
        : (i === 0 ? contract.status : null)

      if (!curStatus) continue

      records.push({
        id: faker.string.uuid(),
        contractId: contract.id,
        fromStatus: i === 0 ? null : prevStatus,
        toStatus: curStatus,
        action: i === 0 ? 'submit' : (curStatus === 'rejected' ? 'reject' : 'approve'),
        operatorId: pickUserId(profiles),
        comment: faker.helpers.arrayElement([
          '合同条款已审核，同意签署',
          '已确认合作内容，批准',
          '请补充相关附件资料',
          '金额过大，需重新评估',
          '审核通过，安排签署'
        ]),
        operatedAt: faker.date.between({ from: contract.createdAt, to: new Date() }).toISOString()
      })
    }
  }
  return records
}

/**
 * 生成合同附件（每个合同 0~3 个）
 * @param {Array} contracts - 合同列表
 * @param {Array} profiles  - 用户档案列表
 */
export function generateContractAttachments(contracts, profiles) {
  const attachments = []
  for (const contract of contracts) {
    const count = faker.number.int({ min: 0, max: 3 })
    for (let i = 0; i < count; i++) {
      attachments.push({
        id: faker.string.uuid(),
        contractId: contract.id,
        name: faker.helpers.arrayElement([
          '合同扫描件.pdf', '技术方案附件.docx',
          '报价清单.xlsx', '保密协议.pdf',
          '验收报告.pdf', '补充协议.docx'
        ]),
        type: faker.helpers.arrayElement(['pdf', 'docx', 'xlsx', 'pdf', 'pdf']),
        size: faker.number.int({ min: 102400, max: 5242880 }),
        url: `/api/files/contracts/${contract.id}/${i}`,
        uploadedBy: pickUserId(profiles),
        uploadedAt: faker.date.between({ from: contract.createdAt, to: new Date() }).toISOString()
      })
    }
  }
  return attachments
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
 * 跟进方式（与 PDF 任务3 保持一致）
 */
export const FOLLOW_METHODS = ['phone', 'visit', 'wechat', 'email']

/**
 * 跟进方式中文名映射
 */
export const FOLLOW_METHOD_LABELS = {
  phone: '电话',
  visit: '拜访',
  wechat: '微信',
  email: '邮件'
}

/**
 * 跟进内容模板（按方法分类）
 */
const FOLLOW_CONTENT_BY_METHOD = {
  phone: [
    '电话沟通了项目需求细节，客户表示满意',
    '电话确认了合同条款修改意见',
    '电话回访客户使用情况，反馈良好',
    '电话沟通了续约事宜，客户需考虑'
  ],
  visit: [
    '上门拜访客户，面谈合作方案',
    '拜访客户进行产品演示，反馈积极',
    '客户现场交流，确认了实施时间表',
    '拜访客户高层，推进战略合作'
  ],
  wechat: [
    '微信沟通了项目进度，客户确认OK',
    '微信发送了最新资料，客户已查收',
    '微信回复了客户的技术问题',
    '微信群沟通了多方协作方案'
  ],
  email: [
    '发送了最新报价单，等待客户确认',
    '邮件回复了客户的技术问题',
    '发送了项目方案文档，客户正在审阅',
    '邮件确认了会议纪要及下一步计划'
  ]
}

/**
 * 生成客户跟进记录（2~4 条/客户）
 * @param {Array} customers - 客户列表
 * @param {Array} profiles  - 用户档案列表
 */
export function generateRecentFollows(customers, profiles) {
  const follows = []
  for (const customer of customers) {
    const count = faker.number.int({ min: 2, max: 4 })
    for (let i = 0; i < count; i++) {
      const method = faker.helpers.arrayElement(FOLLOW_METHODS)
      follows.push({
        id: faker.string.uuid(),
        customerId: customer.id,
        ownerId: pickUserId(profiles),
        method,
        content: faker.helpers.arrayElement(FOLLOW_CONTENT_BY_METHOD[method]),
        nextFollowAt: faker.date.between({ from: new Date(), to: '2026-07-31' }).toISOString(),
        createdAt: faker.date.between({ from: customer.createdAt, to: new Date() }).toISOString()
      })
    }
  }
  return follows
}
