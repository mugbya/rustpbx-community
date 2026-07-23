import { create } from 'zustand'
import { TOKEN_KEY } from '@/utils/constants'
import type { UserInfo } from '@/api/types'

// 认证状态接口
interface AuthState {
  token: string | null
  user: UserInfo | null
  // 初始化：从 localStorage 读取 token
  initAuth: () => void
  // 设置登录态（保存 token 和用户信息）
  setAuth: (token: string, user: UserInfo) => void
  // 更新用户信息
  setUser: (user: UserInfo) => void
  // 登出：清除登录态
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,

  initAuth: () => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      set({ token })
    }
  },

  setAuth: (token: string, user: UserInfo) => {
    localStorage.setItem(TOKEN_KEY, token)
    set({ token, user })
  },

  setUser: (user: UserInfo) => {
    set({ user })
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    set({ token: null, user: null })
  },
}))
