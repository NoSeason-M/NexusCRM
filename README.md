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
    │   │   └── store.js          # localStorage 持久化存储
    │   └── handlers/
    │       └── index.js          # MSW 接口处理器（含认证接口）
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
    │   └── storage.js            # localStorage 工具函数（Token/用户/菜单/权限持久化）
    ├── utils/
    │   ├── storage.js            # localStorage 工具函数（Token/用户/菜单/权限持久化）
    │   └── permission.js         # 权限检查函数（hasPermission / hasAnyPermission）
    └── views/
        ├── api-docs/
        │   └── ApiDocsView.vue   # 接口文档页（在线调试模拟接口）
        ├── common/
        │   └── ModulePlaceholderView.vue  # 通用模块占位页
        ├── dashboard/
        │   └── DashboardView.vue # 仪表盘页面（含按钮权限演示）
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
| `/dashboard` | DashboardView | ✅ | 全部角色 | 仪表盘（含按钮权限演示） |
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

数据源使用 Faker.js 中文语言包（`zh_CN`），固定种子 `2026`，确保每次开发环境启动数据一致。数据持久化在 `localStorage` 中。

## 构建

```bash
npm run build
```

构建产物输出到 `dist/` 目录。
