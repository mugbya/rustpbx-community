import { useEffect } from 'react'
import { AppRouter } from '@/router'
import { MessageProvider, message } from '@/components/ui/MessageProvider'
import { setMessageInstance } from '@/utils/messageHolder'
import { useAuthStore } from '@/store/auth'
import client from '@/api/client'
import type { UserInfo } from '@/api/types'

// 根组件：渲染路由
function App() {
  const initAuth = useAuthStore((state) => state.initAuth)
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)

  // 将 message 实例存到全局，供非组件代码（如 axios 拦截器）使用
  useEffect(() => {
    setMessageInstance(message)
  }, [])

  // 初始化：从 localStorage 恢复 token
  useEffect(() => {
    initAuth()
  }, [initAuth])

  // 有 token 但没 user，用 token 获取用户信息
  useEffect(() => {
    if (token && !user) {
      client
        .get<unknown, UserInfo>('/v1/auth/me')
        .then((data) => {
          useAuthStore.getState().setUser(data)
        })
        .catch(() => {
          // token 过期，清除登录态
          useAuthStore.getState().logout()
        })
    }
  }, [token, user])

  return (
    <MessageProvider>
      <AppRouter />
    </MessageProvider>
  )
}

export default App
