import axios from 'axios'
import { ElMessage } from 'element-plus'
import { getToken, clearAuthStorage } from '@/utils/storage'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截器 — 自动附加 Token
request.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const res = response.data

    // 业务错误
    if (res.code !== 0) {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }

    return res
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      // 401 未登录 — 清除所有认证存储并跳转
      if (status === 401) {
        clearAuthStorage()
        window.location.href = '/login'
        return Promise.reject(error)
      }
      switch (status) {
        case 403:
          ElMessage.error(data?.message || '没有权限访问')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error(data?.message || '服务器内部错误')
          break
        default:
          ElMessage.error(`请求失败 (${status})`)
      }
    } else if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时')
    } else {
      ElMessage.error('网络异常，请检查网络连接')
    }
    return Promise.reject(error)
  }
)

export default request
