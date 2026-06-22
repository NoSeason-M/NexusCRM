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
    │   ├── request.js            # Axios 实例（拦截器、错误处理）
    │   └── mock.js               # Mock API 函数
    ├── layout/
    │   ├── Layout.vue            # 主布局（侧边栏 + 顶部栏 + 内容区）
    │   └── components/
    │       ├── Sidebar.vue       # 侧边栏（深色主题、支持折叠/展开）
    │       ├── HeaderBar.vue     # 顶部栏（折叠按钮 + 面包屑）
    │       └── Breadcrumb.vue    # 面包屑导航（基于路由 meta.title）
    ├── mock/
    │   ├── browser.js            # MSW Worker 启动入口
    │   ├── database/
    │   │   ├── seed.js           # Faker.js 种子数据（zh_CN + seed 2026）
    │   │   └── store.js          # localStorage 持久化存储
    │   └── handlers/
    │       └── index.js          # MSW 接口处理器
    ├── router/
    │   ├── index.js              # 路由配置（/login、/dashboard、/api-docs、/forbidden、404）
    │   └── menu.js               # 侧边栏菜单配置
    ├── stores/
    │   └── index.js              # Pinia Store（sidebarCollapsed 状态）
    ├── styles/
    │   ├── variables.scss        # SCSS 全局变量（颜色、字体、间距、阴影等）
    │   └── index.scss            # 全局样式（重置、body、page-card）
    └── views/
        ├── api-docs/
        │   └── ApiDocsView.vue   # 接口文档页（在线调试模拟接口）
        ├── dashboard/
        │   └── DashboardView.vue # 仪表盘页面
        ├── login/
        │   └── LoginView.vue     # 登录页面（渐变背景 + 居中卡片）
        └── error/
            ├── ForbiddenView.vue # 403 页面
            └── NotFoundView.vue  # 404 页面
```

## 路由

| 路径 | 页面 | 说明 |
|------|------|------|
| `/login` | LoginView | 登录页（无 Layout） |
| `/dashboard` | DashboardView | 仪表盘（嵌套在 Layout 内） |
| `/api-docs` | ApiDocsView | 接口文档（在线调试 MSW 模拟接口） |
| `/forbidden` | ForbiddenView | 403 无权限 |
| `/*` | NotFoundView | 404 页面不存在 |

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

## 模拟接口

基于 MSW (Mock Service Worker) 在前端拦截请求，无需真实后端即可开发调试。

| 接口 | 说明 |
|------|------|
| `GET /api/health` | 健康检查，返回服务状态及 seed 信息 |
| `POST /api/mock/reset` | 重置模拟数据（重新生成 Faker 种子数据） |
| `GET /api/mock/error` | 模拟 500 服务端错误 |

数据源使用 Faker.js 中文语言包（`zh_CN`），固定种子 `2026`，确保每次开发环境启动数据一致。数据持久化在 `localStorage` 中。

## 构建

```bash
npm run build
```

构建产物输出到 `dist/` 目录。
