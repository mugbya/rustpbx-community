import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import { message } from 'antd'
import { API_BASE_URL, TOKEN_KEY } from '@/utils/constants'

// 创建 axios 实例
const client: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器：自动携带 JWT token
client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 响应拦截器：统一处理返回数据和错误
client.interceptors.response.use(
  (response) => {
    const res = response.data
    // 如果响应有 code 字段（ApiResponse 格式），检查 code === 0 返回 data
    if (res && typeof res === 'object' && 'code' in res) {
      if (res.code === 0) {
        return res.data
      }
      // 业务错误
      message.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    // 没有 code 字段（如 PaginatedData），直接返回整个响应数据
    return res
  },
  (error) => {
    if (error.response) {
      const { status } = error.response
      switch (status) {
        case 401:
          // token 失效，清除并跳转登录
          localStorage.removeItem(TOKEN_KEY)
          message.error('登录已过期，请重新登录')
          window.location.href = '/login'
          break
        case 403:
          message.error('没有权限访问')
          break
        case 404:
          message.error('请求的资源不存在')
          break
        case 500:
          message.error('服务器内部错误')
          break
        default:
          message.error(error.response.data?.message || '请求失败')
      }
    } else if (error.request) {
      message.error('网络异常，请检查网络连接')
    } else {
      message.error('请求发送失败')
    }
    return Promise.reject(error)
  },
)

export default client
