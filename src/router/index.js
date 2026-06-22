import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/layout/Layout.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
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
        meta: { title: '仪表盘' },
        component: () => import('@/views/dashboard/DashboardView.vue')
      },
      {
        path: 'api-docs',
        name: 'ApiDocs',
        meta: { title: '接口文档' },
        component: () => import('@/views/api-docs/ApiDocsView.vue')
      }
    ]
  },
  {
    path: '/forbidden',
    name: 'Forbidden',
    component: () => import('@/views/error/ForbiddenView.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/NotFoundView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
