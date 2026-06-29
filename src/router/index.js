import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/layout/Layout.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    meta: { title: '登录', public: true, requiresAuth: false },
    component: () => import('@/views/login/LoginView.vue')
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        meta: { title: '仪表盘', requiresAuth: true, roles: ['admin', 'manager', 'sales', 'support', 'viewer'] },
        component: () => import('@/views/dashboard/DashboardView.vue')
      },
      {
        path: 'customers',
        name: 'Customers',
        meta: { title: '客户管理', requiresAuth: true, roles: ['admin', 'manager', 'sales', 'support', 'viewer'] },
        component: () => import('@/views/customers/CustomerListView.vue')
      },
      {
        path: 'customers/:id',
        name: 'CustomerDetail',
        meta: { title: '客户详情', requiresAuth: true, roles: ['admin', 'manager', 'sales', 'support', 'viewer'] },
        component: () => import('@/views/customers/CustomerDetailView.vue')
      },
      {
        path: 'opportunities',
        name: 'Opportunities',
        meta: { title: '商机管理', requiresAuth: true, roles: ['admin', 'manager', 'sales'] },
        component: () => import('@/views/opportunities/OpportunityListView.vue')
      },
      {
        path: 'opportunities/board',
        name: 'OpportunityBoard',
        meta: { title: '商机看板', requiresAuth: true, roles: ['admin', 'manager', 'sales'] },
        component: () => import('@/views/opportunities/OpportunityBoardView.vue')
      },
      {
        path: 'opportunities/:id',
        name: 'OpportunityDetail',
        meta: { title: '商机详情', requiresAuth: true, roles: ['admin', 'manager', 'sales'] },
        component: () => import('@/views/opportunities/OpportunityDetailView.vue')
      },
      {
        path: 'contracts',
        name: 'Contracts',
        meta: { title: '合同管理', requiresAuth: true, roles: ['admin', 'manager', 'sales'] },
        component: () => import('@/views/contracts/ContractListView.vue')
      },
      {
        path: 'contracts/:id',
        name: 'ContractDetail',
        meta: { title: '合同详情', requiresAuth: true, roles: ['admin', 'manager', 'sales'] },
        component: () => import('@/views/contracts/ContractDetailView.vue')
      },
      {
        path: 'tickets',
        name: 'Tickets',
        meta: { title: '工单管理', requiresAuth: true, roles: ['admin', 'manager', 'support'] },
        component: () => import('@/views/common/ModulePlaceholderView.vue')
      },
      {
        path: 'settings',
        name: 'Settings',
        meta: { title: '系统设置', requiresAuth: true, roles: ['admin'] },
        component: () => import('@/views/common/ModulePlaceholderView.vue')
      },
      {
        path: 'api-docs',
        name: 'ApiDocs',
        meta: { title: '接口文档', requiresAuth: true, roles: ['admin', 'manager', 'sales', 'support', 'viewer'] },
        component: () => import('@/views/api-docs/ApiDocsView.vue')
      }
    ]
  },
  {
    path: '/forbidden',
    name: 'Forbidden',
    meta: { title: '403', public: true, requiresAuth: false },
    component: () => import('@/views/error/ForbiddenView.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    meta: { title: '404', public: true, requiresAuth: false },
    component: () => import('@/views/error/NotFoundView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// ─── 路由导航守卫 ───
router.beforeEach(async (to, _from, next) => {
  const { useUserStore } = await import('@/stores/user')
  const userStore = useUserStore()

  // 1. 公开页面
  if (to.meta?.public) {
    if (to.name === 'Login' && userStore.isLoggedIn) {
      return next('/dashboard')
    }
    return next()
  }

  // 2. 需登录
  if (!userStore.isLoggedIn) {
    return next(`/login?redirect=${to.path}`)
  }

  // 3. 恢复会话
  if (userStore.isLoggedIn && userStore.menus.length === 0) {
    const restored = await userStore.restoreSession()
    if (!restored) {
      return next(`/login?redirect=${to.path}`)
    }
  }

  // 4. 角色检查
  const allowedRoles = to.meta?.roles
  if (allowedRoles && Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    if (!userStore.role || !allowedRoles.includes(userStore.role)) {
      return next('/forbidden')
    }
  }

  next()
})

export default router
