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
    ├── main.js                   # 应用入口（按需启动 MSW 模拟接口）
    ├── api/
    │   ├── request.js            # Axios 实例（Token 拦截器、错误处理）
    │   ├── auth.js               # 认证 API（login/logout/profile/routes/permissions）
    │   ├── dashboard.js          # Dashboard API（概览指标、客户选项）
    │   └── mock.js               # Mock API 函数
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
    │   │   └── dashboard.js      # Dashboard 数据聚合层（filter/reduce 统计）
    │   └── handlers/
    │       └── index.js          # MSW 接口处理器（认证 + dashboard 接口）
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
| `/customers` | ModulePlaceholderView | ✅ | 全部角色 | 客户管理 |
| `/opportunities` | ModulePlaceholderView | ✅ | admin / manager / sales | 商机管理 |
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
| 客户 (customers) | 30~40 条 | id, name, phone, email, ownerId, status (active/inactive/lead) |
| 商机 (opportunities) | 20~30 条 | id, title, customerId, ownerId, amount, stage (qualification/proposal/negotiation/closed_won/closed_lost) |
| 合同 (contracts) | 25~35 条 | id, title, customerId, opportunityId, amount, status (draft/pending_approval/active/completed/terminated) |
| 工单 (tickets) | 20~25 条 | id, title, customerId, assigneeId, priority (low/medium/high/urgent), status (open/in_progress/pending/resolved/closed) |
| 待办 (todos) | 8~12 条 | id, title, customerId, ownerId, priority (high/medium/low), status (pending/in_progress/completed), dueAt |
| 跟进记录 (recentFollows) | 10 条 | id, customerId, ownerId, method (call/email/meeting/other), content, nextFollowAt |
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
| `opportunity:create` | 新建商机 | admin / manager / sales |
| `contract:approve` | 审批合同 | admin / manager |
| `ticket:handle` | 处理工单 | admin / support |
| `*` | 通配（admin 专有）| admin |

admin 角色的权限为 `['*']` 通配，因此拥有所有按钮权限。

## 模拟接口

基于 MSW (Mock Service Worker) 在前端拦截请求，无需真实后端即可开发调试。

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

数据源使用 Faker.js 中文语言包（`zh_CN`），固定种子 `2026`，确保每次开发环境启动数据一致。数据持久化在 `localStorage` 中。

## 构建

```bash
npm run build
```

构建产物输出到 `dist/` 目录。
