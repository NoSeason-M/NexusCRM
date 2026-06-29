# NexusCRM

基于 Vue 3 + JavaScript 构建的客户关系管理系统。

## 技术栈

- **框架**: Vue 3 + Vite
- **状态管理**: Pinia
- **路由**: Vue Router
- **UI 组件库**: Element Plus
- **图表**: ECharts
- **HTTP 客户端**: Axios
- **模拟接口**: MSW (Mock Service Worker) + Faker.js
- **样式**: Sass

## 项目结构

```
nexus-crm/
├── index.html                    # 入口 HTML
├── package.json                  # 项目配置与依赖
├── vite.config.js                # Vite 配置（@ 路径别名、SCSS 自动注入）
├── public/
│   └── mockServiceWorker.js      # MSW Service Worker
└── src/
    ├── App.vue                   # 根组件（router-view）
    ├── main.js                   # 应用入口（异步启动 MSW 后挂载应用）
    ├── api/
    │   ├── request.js            # Axios 实例（Token 拦截器、错误处理）
    │   ├── auth.js               # 认证 API（login/logout/profile/routes/permissions）
    │   ├── customer.js           # 客户管理 API（列表/详情/筛选选项）
    │   ├── opportunity.js        # 商机管理 API（列表/统计/看板/CRUD/阶段流转）
    │   ├── dashboard.js          # Dashboard API（概览指标、客户选项）
    │   └── mock.js               # Mock API 函数
    ├── composables/
    │   └── usePagination.js      # 分页组合式函数（page/pageSize/total 管理）
    ├── layout/
    │   ├── Layout.vue            # 主布局（侧边栏 + 顶部栏 + 内容区）
    │   └── components/
    │       ├── Sidebar.vue       # 侧边栏（深色主题、动态菜单、支持折叠/展开）
    │       ├── HeaderBar.vue     # 顶部栏（折叠按钮 + 面包屑 + 用户头像 + 退出登录）
    │       └── Breadcrumb.vue    # 面包屑导航（基于路由 meta.title）
    ├── mock/
    │   ├── browser.js            # MSW Worker 启动入口
    │   ├── database/
    │   │   ├── seed.js           # Faker.js 种子数据（zh_CN + seed 2026）
    │   │   ├── store.js          # localStorage 持久化存储（含 DATABASE_VERSION 版本校验）
    │   │   ├── dashboard.js      # Dashboard 数据聚合层（filter/reduce 统计）
    │   │   ├── customers.js      # 客户查询层（组合筛选 + 分页 + 详情 + 校验）
    │   │   └── opportunities.js  # 商机查询层（列表/统计/详情/看板/校验/阶段流转）
    │   └── handlers/
    │       └── index.js          # MSW 接口处理器（认证 + dashboard + 客户 + 商机）
    ├── router/
    │   ├── index.js              # 路由配置 + 导航守卫（鉴权 + 角色权限检查）
    │   └── menu.js               # 侧边栏菜单配置（备用，现由动态菜单取代）
    ├── stores/
    │   ├── index.js              # Pinia Store（sidebarCollapsed 状态）
    │   └── user.js               # 用户 Store（Token/用户信息/菜单/权限管理）
    ├── styles/
    │   ├── variables.scss        # SCSS 全局变量（颜色、字体、间距、阴影等）
    │   └── index.scss            # 全局样式（重置、body、page-card）
    ├── utils/
    │   ├── storage.js            # localStorage 工具函数（Token/用户/菜单/权限持久化）
    │   ├── permission.js         # 权限检查函数（hasPermission / hasAnyPermission）
    │   ├── format.js             # 格式化工具（数字/金额/百分比/日期）
    │   └── echarts.js            # ECharts 按需引入（Funnel/Line/Bar/Pie + CanvasRenderer）
    └── views/
        ├── api-docs/
        │   └── ApiDocsView.vue   # 接口文档页（在线调试模拟接口）
        ├── common/
        │   └── ModulePlaceholderView.vue  # 通用模块占位页
        ├── customers/
        │   ├── CustomerListView.vue     # 客户列表页（搜索/筛选/分页表格）
        │   ├── CustomerDetailView.vue   # 客户详情页（基本信息/负责人/联系人/跟进时间线）
        │   ├── CustomerFormDialog.vue   # 客户新增/编辑弹窗
        │   └── FollowFormDialog.vue     # 跟进记录新增弹窗
        ├── opportunities/
        │   ├── OpportunityListView.vue   # 商机列表页（统计概览/筛选/分页表格/CRUD）
        │   ├── OpportunityBoardView.vue  # 销售阶段看板（6 列卡片墙/阶段推进/双视图切换）
        │   ├── OpportunityDetailView.vue # 商机详情页（基本信息/阶段流转按钮/流转历史时间线）
        │   ├── OpportunityFormDialog.vue # 商机新增/编辑弹窗
        │   └── components/
        │       └── OpportunityCard.vue   # 看板卡片组件（商机摘要/阶段推进按钮）
        ├── dashboard/
        │   ├── DashboardView.vue # 工作台页面（指标卡 + 待办/跟进 + 3 个图表）
        │   ├── chartOptions.js   # ECharts option 工厂函数（漏斗/趋势/饼图）
        │   └── components/
        │       ├── MetricCard.vue      # 指标卡组件（4 种色调，悬停动效）
        │       ├── TodoList.vue        # 待办事项列表（复选框切换状态、增删改）
        │       ├── RecentFollowList.vue # 近期跟进记录列表（点击编辑）
        │       ├── ActivityFormDialog.vue # 通用活动表单弹窗（新增/编辑待办或跟进）
        │       └── BaseChart.vue       # 通用 ECharts 图表容器（响应式尺寸）
        ├── login/
        │   └── LoginView.vue     # 登录页面（默认填充测试账号）
        └── error/
            ├── ForbiddenView.vue # 403 页面
            └── NotFoundView.vue  # 404 页面
```

## 路由

| 路径 | 页面 | Layout | 角色限制 | 说明 |
|------|------|--------|----------|------|
| `/login` | LoginView | ❌ | - | 登录页（路由守卫白名单） |
| `/dashboard` | DashboardView | ✅ | 全部角色 | 工作台（6 个指标卡，loading/error/empty 状态处理） |
| `/customers` | CustomerListView | ✅ | 全部角色 | 客户管理（搜索/筛选/分页列表） |
| `/customers/:id` | CustomerDetailView | ✅ | 全部角色 | 客户详情（基本信息/负责人变更/联系人/跟进时间线） |
| `/opportunities` | OpportunityListView | ✅ | admin / manager / sales | 商机列表（统计/筛选/CRUD） |
| `/opportunities/board` | OpportunityBoardView | ✅ | admin / manager / sales | 销售阶段看板（6 列卡片墙） |
| `/opportunities/:id` | OpportunityDetailView | ✅ | admin / manager / sales | 商机详情（阶段流转/历史记录） |
| `/contracts` | ModulePlaceholderView | ✅ | admin / manager / sales | 合同管理 |
| `/tickets` | ModulePlaceholderView | ✅ | admin / manager / support | 工单管理 |
| `/settings` | ModulePlaceholderView | ✅ | admin | 系统设置 |
| `/api-docs` | ApiDocsView | ✅ | 全部角色 | 接口文档 |
| `/forbidden` | ForbiddenView | ❌ | - | 403 无权限 |
| `/*` | NotFoundView | ❌ | - | 404 页面不存在 |

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 认证系统

### 路由导航守卫

守卫执行流程：

```
请求页面
  ├─ meta.public=true → 放行（登录页/403/404）
  ├─ 未登录 → /login?redirect=目标路径
  ├─ 已登录但无菜单 → restoreSession() 恢复会话
  ├─ meta.roles 存在且当前角色不匹配 → /forbidden
  └─ 放行
```

- 未登录用户访问受保护页面 → 自动跳转 `/login?redirect=目标路径`
- 已登录用户访问 `/login` → 自动跳转 `/dashboard`
- 刷新页面后自动恢复用户会话（Token + 用户信息 + 菜单 + 权限）
- 页面级角色控制：路由 meta.roles 定义可访问角色列表，不匹配跳 403

### 数据持久化工具层

`src/utils/storage.js` 统一封装 localStorage 操作：

| 函数 | 说明 |
|------|------|
| `getToken()` / `setToken(token)` | Token 读写 |
| `getStoredUser()` / `setStoredUser(user)` | 用户信息读写 |
| `getStoredMenus()` / `setStoredMenus(menus)` | 菜单数据读写 |
| `getStoredPermissions()` / `setStoredPermissions(permissions)` | 权限列表读写 |
| `clearAuthStorage()` | 清除所有认证数据 |

Token、用户信息、菜单、权限全部持久化到 localStorage，刷新后优先从本地恢复，再异步验证 Token 有效性。

### 预设测试账号

| 用户名 | 密码 | 角色 | 菜单 |
|--------|------|------|------|
| `admin` | `Admin@2026` | 超级管理员 | 仪表盘、客户、商机、合同、工单、接口文档、系统设置 |
| `manager` | `Manager@2026` | 经理 | 仪表盘、客户、商机、合同、工单、接口文档 |
| `sales` | `Sales@2026` | 销售 | 仪表盘、客户、商机、合同、接口文档 |
| `support` | `Support@2026` | 客服 | 仪表盘、客户、工单、接口文档 |
| `viewer` | `Viewer@2026` | 观察者 | 仪表盘、客户、接口文档 |

Token 基于 Base64 编码的 JSON 负载模拟，存储在 `localStorage`。Axios 请求拦截器自动附加 `Authorization: Bearer <token>`，响应拦截器遇到 401 自动清除 Token 并跳转登录页。

## 数据模型

模拟数据包含以下业务实体，各实体间通过 ID 外键关联：

| 实体 | 生成数量 | 关键字段 |
|------|---------|---------|
| 客户 (customers) | 30~40 条 | id, name, industry, level (platinum/gold/silver/regular), status (active/potential/inactive/at_risk/lead), ownerId, province, city, address, source, contactName, contactPhone, contactTitle, contactEmail, description, lastFollowAt, createdAt, updatedAt |
| 商机 (opportunities) | 40~48 条 | id, title, customerId, ownerId, amount, stage (lead/qualified/proposal/negotiation/won/lost), probability (10/30/50/75/100/0), expectedCloseDate, nextStep, description, createdAt, updatedAt |
| 商机阶段流转记录 (opportunityStageRecords) | 每个商机 1~2 条 | id, opportunityId, fromStage, toStage, changedBy, note, changedAt |
| 合同 (contracts) | 25~35 条 | id, title, customerId, opportunityId, amount, status (draft/pending_approval/active/completed/terminated) |
| 工单 (tickets) | 20~25 条 | id, title, customerId, assigneeId, priority (low/medium/high/urgent), status (open/in_progress/pending/resolved/closed) |
| 待办 (todos) | 8~12 条 | id, title, customerId, ownerId, priority (high/medium/low), status (pending/in_progress/completed), dueAt |
| 跟进记录 (recentFollows) | 每个客户 2~4 条 | id, customerId, ownerId, method (phone/visit/wechat/email), content, nextFollowAt, createdAt |
| 文档 (documents) | 5~10 条 | id, title, type, fileSize, uploadedBy |

数据使用 Faker.js 中文语言包（`zh_CN`），固定种子 `seed(2026)` 确保数据一致性。持久化到 `localStorage`，带 `DATABASE_VERSION` 版本校验，版本不匹配时自动重置。

## 工作台模块

工作台页面（`/dashboard`）登录后自动展示，通过 `GET /api/dashboard/summary` 获取聚合指标。

### 指标卡 MetricCard

`src/views/dashboard/components/MetricCard.vue`

| Prop | 类型 | 说明 |
|------|------|------|
| label | String | 指标标签 |
| value | String / Number | 指标数值 |
| description | String | 底部描述文字 |
| tone | String | 色调：primary / success / warning / danger / info |

数值格式化使用 `src/utils/format.js`：
- `formatNumber(value)` — 千分位数字（如 `1,234,567`）
- `formatCurrency(value)` — 人民币金额（如 `¥1,234,567`）
- `formatPercent(value)` — 百分比（如 `85%`）
- `formatDate(date)` — 日期（如 `2026/06/24`）

### 页面状态

工作台页面覆盖 4 种展示状态：

| 状态 | 触发条件 | 展示内容 |
|------|---------|---------|
| loading | 数据请求中 | 旋转动画 + "数据加载中..." |
| error | 请求失败 | el-result 错误提示 + "重新加载" 按钮 |
| empty | 数据全为 0 | el-empty 占位 + "刷新数据" 按钮 |
| 正常 | 数据加载成功 | 6 个 MetricCard 指标卡网格 |

### 待办与跟进

工作台页面包含两个交互面板：

**待办列表 (TodoList)**
- 复选框循环切换状态：待处理 ↔ 进行中 ↔ 已完成
- Hover 显示编辑/删除按钮
- 优先级标签（高/中/低）
- "新增待办"按钮打开 ActivityFormDialog 弹窗

**跟进记录 (RecentFollowList)**
- 客户头像、跟进方式标签（电话/邮件/面谈/其他）、内容预览
- 负责人、下次跟进日期显示
- 点击任意记录打开编辑弹窗

**通用表单弹窗 (ActivityFormDialog)**
- 通过 `type` prop 切换"待办"和"跟进"两种模式
- 客户选项从接口动态拉取
- 按表单校验规则验证后提交

## 图表模块

通过 ECharts 树摇（tree-shaking）按需引入，只注册实际使用的图表类型和组件，减小打包体积。

### ECharts 按需引入

`src/utils/echarts.js` 使用 `echarts/core` + `echarts/charts` + `echarts/components` + `echarts/renderers` 按需注册：

| 模块 | 注册项 |
|------|--------|
| charts | FunnelChart, LineChart, BarChart, PieChart |
| components | GridComponent, LegendComponent, TooltipComponent |
| renderers | CanvasRenderer |

### BaseChart 组件

`src/views/dashboard/components/BaseChart.vue` 通用图表容器：

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| option | Object | null | ECharts option 配置 |
| loading | Boolean | false | 加载中状态 |
| empty | Boolean | false | 空数据状态 |
| emptyText | String | '暂无数据' | 空数据提示文字 |
| height | String/Number | 300 | 图表高度（px） |
| theme | String | '' | ECharts 主题 |
| renderer | String | 'canvas' | 渲染器：canvas / svg |
| notMerge | Boolean | false | setOption 是否不合并 |

特性：
- `onMounted` → `nextTick` → DOM 就绪 → `echarts.init` → `setOption`
- `ResizeObserver` 监听容器尺寸变化 + `window resize` 事件双重自适应
- `watch(option)` 变化时 `setOption` 增量更新
- `onBeforeUnmount` → 断开 ResizeObserver → `chart.dispose()`

### 图表工厂函数

`src/views/dashboard/chartOptions.js` 将 API 原始数据转换为 ECharts option：

| 函数 | 图表类型 | 数据来源 |
|------|---------|---------|
| `buildFunnelOption(data)` | 漏斗图 | `GET /api/dashboard/charts/sales-funnel` |
| `buildTrendOption(data)` | 柱线混合图 | `GET /api/dashboard/charts/contract-trend` |
| `buildPieOption(data)` | 环形饼图 | `GET /api/dashboard/charts/ticket-status` |

销售漏斗 tooltip 展示数量和金额，金额为 0 时显示 `¥0`；合同趋势双 Y 轴（合同数 + 金额）；工单饼图按状态着色。

## 动态菜单与按钮权限

### 动态菜单

侧边栏菜单不再硬编码，而是登录后从 `GET /api/auth/routes` 拉取，基于当前角色返回对应的菜单项。不同角色看到的菜单不同：

- 使用 `userStore.menus`（Pinia 响应式数据）渲染
- 菜单数据持久化到 `localStorage`，刷新页面优先从本地恢复
- `src/router/menu.js` 中的静态配置已由动态菜单取代

### 按钮权限

`src/utils/permission.js` 提供两个核心函数：

```js
import { hasPermission, hasAnyPermission } from '@/utils/permission'

hasPermission(permissions, 'customer:create')        // 是否拥有指定权限
hasAnyPermission(permissions, ['customer:create', ...]) // 是否拥有任一权限
```

在组件模板中通过 `userStore.hasPermission()` 控制按钮显示：

```html
<el-button v-if="userStore.hasPermission('customer:create')">新建客户</el-button>
```

### 权限编码

| 编码 | 说明 | 可用的角色 |
|------|------|------------|
| `dashboard:view` | 查看仪表盘 | 全部 |
| `customer:view` | 查看客户 | 全部 |
| `customer:create` | 新建客户 | admin / manager / sales |
| `customer:edit` | 编辑客户 | admin / manager / sales（sales 仅限本人负责的客户） |
| `customer:delete` | 删除客户 | admin / manager / sales（sales 仅限本人负责的客户） |
| `customer:assign` | 转移负责人 | admin / manager |
| `customer:follow` | 记录跟进 | admin / manager / sales / support |
| `opportunity:view` | 查看商机 | admin / manager / sales |
| `opportunity:create` | 新建商机 | admin / manager / sales |
| `opportunity:edit` | 编辑商机 | admin / manager / sales |
| `opportunity:delete` | 删除商机 | admin / manager / sales |
| `opportunity:stage` | 阶段流转 | admin / manager / sales |
| `contract:approve` | 审批合同 | admin / manager |
| `ticket:handle` | 处理工单 | admin / support |
| `*` | 通配（admin 专有）| admin |

admin 角色的权限为 `['*']` 通配，因此拥有所有按钮权限。

## 模拟接口

基于 MSW (Mock Service Worker) 在前端拦截请求，无需真实后端即可开发调试。

> **API 路径约定：** Axios 实例已配置 `baseURL: '/api'`（详见 `src/api/request.js`），因此前端 API 调用路径**不带** `/api` 前缀。例如 `request.get('/customers')` 实际请求 `/api/customers`。
> MSW 处理器中的路径**包含** `/api` 前缀（如 `http.get('/api/customers', ...)`），因为它直接拦截浏览器的完整请求路径。
> 下表列出的是 MSW 处理器的完整路径（含 `/api`），也是浏览器实际发出的请求路径。

### 基础接口

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/health` | 健康检查，返回服务状态及 seed 信息 |
| `POST` | `/api/mock/reset` | 重置模拟数据（重新生成 Faker 种子数据） |
| `GET` | `/api/mock/error` | 模拟 500 服务端错误 |

### 认证接口

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/auth/login` | 登录，返回 Token 和用户信息 |
| `POST` | `/api/auth/logout` | 退出登录 |
| `GET` | `/api/auth/profile` | 获取当前用户档案（需 Token） |
| `GET` | `/api/auth/routes` | 获取当前用户可访问菜单（基于角色） |
| `GET` | `/api/auth/permissions` | 获取当前用户权限列表（需 Token） |

### Dashboard 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/dashboard/summary` | 工作台概览指标（6 个核心指标 + 销售漏斗 + 合同趋势 + 工单分布） |
| `GET` | `/api/dashboard/customers` | 客户选项列表（id + name + status，用于筛选器下拉） |
| `GET` | `/api/dashboard/todos` | 待办列表（含 customerName/ownerName） |
| `POST` | `/api/dashboard/todos` | 新建待办 |
| `PUT` | `/api/dashboard/todos/:id` | 更新待办 |
| `DELETE` | `/api/dashboard/todos/:id` | 删除待办 |
| `GET` | `/api/dashboard/recent-follows` | 跟进记录列表（含 customerName/ownerName） |
| `POST` | `/api/dashboard/recent-follows` | 新建跟进记录 |
| `PUT` | `/api/dashboard/recent-follows/:id` | 更新跟进记录 |
| `GET` | `/api/dashboard/charts/sales-funnel` | 销售漏斗数据（stage, label, count, amount） |
| `GET` | `/api/dashboard/charts/contract-trend` | 合同签约趋势（month, count, amount） |
| `GET` | `/api/dashboard/charts/ticket-status` | 工单状态分布（status, label, count） |

`/api/dashboard/summary` 和图表接口支持以下查询参数：
| 参数 | 值 | 效果 |
|------|-----|------|
| `scenario` | `empty` | 返回空数据（测试空数据状态） |
| `scenario` | `error` | 模拟 500 错误（测试错误处理） |
| `scenario` | `partial` | 返回部分数据（测试局部渲染） |

**待办与跟进记录的权限控制：** 非 admin 角色只能操作（修改/删除）ownerId 为自己的记录，越权操作返回 403。

## 客户管理模块

### 客户列表页

`/customers` 路由指向 `CustomerListView.vue`，提供完整的客户数据管理界面：

- **关键词搜索**：模糊匹配客户名称、联系人、电话、地址
- **多维筛选**：行业、客户级别（铂金/黄金/白银/普通）、状态（活跃/潜在/已流失/风险/线索）、负责人
- **分页表格**：服务端分页，支持 10/20/50/100 条/页，列包括名称、行业、联系人、电话、级别标签、状态标签、省份、负责人、来源、最后跟进时间、操作
- **状态处理**：加载骨架屏（700px）、错误提示 + 重新加载、空数据 + 重置筛选
- **CRUD 操作**：新建/编辑通过 `CustomerFormDialog` 弹窗，删除通过 `ElMessageBox.confirm` 二次确认

### 客户表单弹窗 CustomerFormDialog

`src/views/customers/CustomerFormDialog.vue` — 通用新建/编辑弹窗：

| Prop | 类型 | 说明 |
|------|------|------|
| modelValue | Boolean | v-model 控制显隐 |
| customer | Object / null | null=新建 / Object=编辑回填 |
| options | Object | 行业/级别/状态/负责人下拉数据 |
| saving | Boolean | 是否保存中 |

表单分为三个区域：
- **基本信息**：客户名称（必填）、行业、级别、状态、来源、省份/城市/地址
- **联系人信息**：联系人姓名、电话（正则校验）、职务、邮箱、负责人（必填）
- **其他信息**：客户描述 textarea

### 客户详情页

`/customers/:id` 路由指向 `CustomerDetailView.vue`，提供完整的客户详情管理：

- **基本信息展示**：客户名称、行业、来源、级别（标签）、状态（标签）、地区、创建/更新时间、描述
- **负责人信息卡片**：头像、姓名、角色、邮箱、电话；`customer:assign` 权限可点击"变更"弹窗选择新负责人
- **联系人表格**：姓名、电话、职务、邮箱
- **跟进时间线**：按时间倒序排列，每项展示跟进方式图标 + 标签、跟进人、时间、内容、下次跟进时间
- **新增跟进**：`customer:follow` 权限可见"新增跟进"按钮，打开 `FollowFormDialog` 弹窗
- **状态处理**：加载骨架屏、404 错误提示 + 返回列表、正常展示

### 跟进弹窗 FollowFormDialog

`src/views/customers/FollowFormDialog.vue` — 新增跟进记录弹窗：

| Prop | 类型 | 说明 |
|------|------|------|
| modelValue | Boolean | v-model 控制显隐 |
| saving | Boolean | 是否保存中 |

表单字段：
- **跟进方式**：Radio 单选（电话/拜访/微信/邮件）
- **跟进内容**：Textarea，必填，最多 500 字
- **下次跟进时间**：DatetimePicker，选填

### 跟进记录接口

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| `POST` | `/api/customers/:id/follows` | customer:follow | 新增跟进记录（校验 method/content），自动更新客户 lastFollowAt |
| `PUT` | `/api/customers/:id/owner` | customer:assign | 变更客户负责人（校验 ownerId 存在且活跃） |

跟进记录校验逻辑 `validateFollowRecordInput(input)`：
1. method：必填，枚举值 phone/visit/wechat/email
2. content：必填，1~500 字符
3. 返回 `{ valid, errors[] }`

### 客户详情接口增强

`GET /api/customers/:id` 在原有基础上增强返回结构：

```json
{
  "...customer": { },
  "owner": {
    "id", "name", "email", "phone", "avatar", "role", "roleName"
  },
  "contacts": [
    { "name", "phone", "title", "email", "primary": true }
  ],
  "followRecords": [
    {
      "id", "customerId", "ownerId", "ownerName",
      "method", "content", "nextFollowAt", "createdAt"
    }
  ]
}
```

跟进记录按 createdAt 倒序排列，便于时间线展示。

### 客户接口

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/customers` | 组合查询 + 分页客户列表（支持 keyword/industry/level/status/ownerId/page/pageSize） |
| `GET` | `/api/customers/options` | 客户筛选选项（industries/levels/statuses/owners） |
| `GET` | `/api/customers/:id` | 客户详情（含 contacts 联系人 + followRecords 跟进记录，404 返回） |
| `POST` | `/api/customers` | 新建客户（校验输入，ownerId 不指定时默认为当前用户） |
| `PUT` | `/api/customers/:id` | 更新客户（禁止修改 createdAt/id/lastFollowAt；ownerId 变更需 customer:assign 权限） |
| `DELETE` | `/api/customers/:id` | 删除客户（检查关联商机/合同/工单 → 409 冲突） |
| `POST` | `/api/customers/:id/follows` | 新增跟进记录（校验 method/content，自动更新 lastFollowAt） |
| `PUT` | `/api/customers/:id/owner` | 变更客户负责人（校验 ownerId 存在且活跃） |

### 商机接口

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| `GET` | `/api/opportunities` | opportunity:view | 组合查询 + 分页列表（keyword/stage/ownerId/dateRange/page/pageSize） |
| `GET` | `/api/opportunities/statistics` | opportunity:view | 商机统计概览（总数/总额/赢单额/平均概率/逾期数/阶段分布） |
| `GET` | `/api/opportunities/options` | - | 筛选选项（阶段/负责人下拉） |
| `GET` | `/api/opportunities/board` | opportunity:view | 销售阶段看板（按 lead→lost 6 个阶段分组，含 count/amount/cards） |
| `GET` | `/api/opportunities/:id` | opportunity:view | 商机详情（含 customerName/ownerName/stageLabel/stageRecords） |
| `POST` | `/api/opportunities` | opportunity:create | 新建商机（校验输入，记录初始阶段） |
| `PUT` | `/api/opportunities/:id` | opportunity:edit | 更新商机（禁止修改 stage） |
| `DELETE` | `/api/opportunities/:id` | opportunity:delete | 删除商机（关联合同检测 → 409 冲突） |
| `PATCH` | `/api/opportunities/:id/stage` | opportunity:stage | 阶段流转（校验流转规则，记录流转历史） |

### CRUD 错误码

| 状态码 | 说明 |
|--------|------|
| 400 | 校验失败（名称为空/重复、无效枚举值、电话格式错误、跟进内容为空、负责人不存在） |
| 401 | 未登录或 Token 过期 |
| 403 | 无权限（缺少 customer:edit/customer:delete/customer:assign/customer:follow） |
| 404 | 客户不存在 |
| 409 | 删除冲突（客户存在关联商机/合同/工单） |

### 输入校验逻辑

`src/mock/database/customers.js` 中的 `validateCustomerInput()` 函数：

1. name：必填，1~50 字符，唯一性校验（排除自身 ID）
2. status/level/industry/source：必须在预定义枚举集合内
3. contactPhone：正则 `/^1[3-9]\d{9}$/` 校验
4. ownerId：必须在 profiles 中存在且非 inactive
5. 通过后规范化（trim/null 转换），返回 `{ valid, errors, data }`

### 删除冲突检测

`getCustomerDeleteConflict(database, customerId)` 检查该客户是否被商机/合同/工单引用。存在任一引用时 API 返回 409。

### 客户操作权限

| 编码 | 说明 | 可用角色 |
|------|------|----------|
| `customer:view` | 查看客户 | 全部 |
| `customer:create` | 新建客户 | admin / manager / sales |
| `customer:edit` | 编辑客户 | admin / manager / sales（sales 仅限本人负责） |
| `customer:delete` | 删除客户 | admin / manager / sales（sales 仅限本人负责） |
| `customer:assign` | 转移负责人 | admin / manager |
| `customer:follow` | 记录跟进 | admin / manager / sales / support |

### 组合查询逻辑

`src/mock/database/customers.js` 中的 `queryCustomers()` 函数：

1. 构建 `ownerNames` 映射（profiles → Map）
2. 参数提取与边界处理（page≥1，pageSize 限制 1~100）
3. 依次应用筛选条件：keyword（模糊搜索 name/contactName/contactPhone/address） → industry → level → status → ownerId
4. 计算 total（过滤后总数）
5. 执行分页 slice
6. 补充 ownerName 后返回 `{ list, total, page, pageSize }`

### usePagination 组合式函数

`src/composables/usePagination.js` 封装分页状态管理：

- `page` / `pageSize` / `total` 响应式引用
- `setTotal(val)` — 设置总数
- `resetPage()` — 重置到第一页（切换筛选时调用）
- `changePage(val)` — 切换页码
- `changePageSize(val)` — 切换每页条数（自动回到第一页）

数据源使用 Faker.js 中文语言包（`zh_CN`），固定种子 `2026`，确保每次开发环境启动数据一致。数据持久化在 `localStorage` 中。

## 商机管理模块

商机模块提供列表、看板、详情三种视图，支持完整的 CRUD 和阶段流转。

### 商机数据模型

商机有 6 个阶段，形成完整的销售漏斗：

| 阶段 | 编码 | 概率 | 可流转至 |
|------|------|------|----------|
| 初步接触 | lead | 10% | qualified / lost |
| 需求确认 | qualified | 30% | proposal / lost |
| 方案报价 | proposal | 50% | negotiation / lost |
| 商务谈判 | negotiation | 75% | won / lost |
| 赢单 | won | 100% | -（终态） |
| 输单 | lost | 0% | -（终态） |

阶段流转规则在 `OPP_STAGE_TRANSITIONS` 中定义，只能按顺序推进（lead → qualified → proposal → negotiation → won/lost），不可跳跃或回退。won/lost 为终态，不可再流转。

### 商机列表页

`/opportunities` 路由指向 `OpportunityListView.vue`：

- **统计概览**：5 个指标卡（商机总数、商机总额、赢单金额、平均概率、逾期商机）+ 阶段分布横条图
- **筛选区**：关键词搜索、阶段筛选、负责人筛选、预计关闭日期范围
- **分页表格**：10 列（名称、客户、阶段标签、金额、概率、预计关闭日期含逾期标记、负责人、下一步、操作）
- **CRUD**：新建/编辑通过 `OpportunityFormDialog` 弹窗，删除二次确认
- **双视图切换**：右上角"看板视图"按钮切换至 `/opportunities/board`
- **权限控制**：`opportunity:create/edit/delete` 控制按钮显隐

### 商机看板页

`/opportunities/board` 路由指向 `OpportunityBoardView.vue`：

- **看板布局**：6 列卡片墙（lead→lost），水平滚动，每列显示阶段色点 + 标签 + 卡片计数 + 金额合计
- **卡片组件**（`OpportunityCard.vue`）：展示商机名称、阶段标签、客户、金额（高亮）、概率、负责人、预计关闭日期（逾期红色警告）、下一步
- **阶段推进**：卡片底部根据当前阶段显示推进按钮（lead→qualified、qualified→proposal 等），negotiation 阶段弹窗选择赢单/输单
- **详情跳转**：点击卡片跳转 `/opportunities/:id`
- **双视图切换**：右上角"列表视图"按钮切换回列表
- **多状态处理**：加载骨架屏（6 列骨架）、错误重试、空数据

### 商机详情页

`/opportunities/:id` 路由指向 `OpportunityDetailView.vue`：

- **基本信息**：商机名称、客户名称、负责人、当前阶段标签、金额、概率、预计关闭日期、创建/更新时间、下一步计划、项目描述
- **阶段流转按钮**：根据当前阶段动态显示可流转目标，lost 确认弹窗（warning），won 确认弹窗（success）
- **流转历史时间线**：按时间倒序排列，每项展示 fromStage→toStage 箭头、操作人、时间、备注，不同阶段对应不同颜色圆点

### 商机表单弹窗 OpportunityFormDialog

`src/views/opportunities/OpportunityFormDialog.vue`：

| Prop | 类型 | 说明 |
|------|------|------|
| modelValue | Boolean | v-model 控制显隐 |
| opportunity | Object / null | null=新建 / Object=编辑回填 |
| saving | Boolean | 是否保存中 |

表单字段：商机名称（必填，max100）、关联客户（必填，编辑禁用）、商机金额（必填，>0）、当前阶段（编辑禁用，lead/qualified/proposal/negotiation）、预计关闭日期、负责人、下一步计划（max500）、项目描述（max500）

### 商机输入校验

`src/mock/database/opportunities.js` 中的 `validateOpportunityInput()` 函数：

1. title：必填，1~100 字符
2. customerId：必须在 customers 中存在且非 inactive
3. amount：必填，parseFloat > 0
4. stage：仅在新建时可选，不可为 won/lost
5. ownerId：可选，如提供需在 profiles 中非 inactive
6. nextStep：可选，最多 500 字符

### 阶段流转校验

`validateStageTransition(opportunity, input)` 校验规则：

1. toStage 必填
2. 检查 toStage 是否在 `OPP_STAGE_TRANSITIONS[当前阶段]` 内
3. won/lost 终态不可再流转
4. note 选填，最多 500 字符
5. 校验失败返回 409，附带具体错误信息

### 删除冲突检测

`getOpportunityDeleteConflict(database, opportunityId)` 检查合同关联。存在合同引用时 API 返回 409。

## 构建

```bash
npm run build
```

构建产物输出到 `dist/` 目录。
