import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import { API_BASE_URL, TOKEN_KEY } from '@/utils/constants'
import { getMessage } from '@/utils/messageHolder'

// 创建 axios 实例
const client: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 获取 message 实例（统一走 messageHolder 桥接）
function msg() {
  return getMessage()
}

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
      msg().error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    // 没有 code 字段（如 PaginatedData），直接返回整个响应数据
    return res
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      // FastAPI 错误格式是 { detail: "..." }，也兼容 { message: "..." }
      const errMsg = data?.detail || data?.message
      switch (status) {
        case 400:
          msg().error(errMsg || '请求参数错误')
          break
        case 401:
          // token 失效，清除 token
          localStorage.removeItem(TOKEN_KEY)
          // 如果不在登录页才跳转，避免刷新导致错误提示消失
          if (!window.location.pathname.startsWith('/login')) {
            msg().error(errMsg || '登录已过期，请重新登录')
            window.location.href = '/login'
          }
          break
        case 403:
          msg().error(errMsg || '没有权限访问')
          break
        case 404:
          msg().error(errMsg || '请求的资源不存在')
          break
        case 500:
          msg().error(errMsg || '服务器内部错误')
          break
        default:
          msg().error(errMsg || '请求失败')
      }
    } else if (error.request) {
      msg().error('网络异常，请检查网络连接')
    } else {
      msg().error('请求发送失败')
    }
    return Promise.reject(error)
  },
)

export default client
