import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spin } from '@/components/ui/Spin'
import { Result } from '@/components/ui/Result'
import { useAuthStore } from '@/store/auth'

// GitHub OAuth 回调页：从 URL 获取 code，发送到后端完成登录
export default function GitHubCallback() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [error, setError] = useState(false)
  // 防止 React StrictMode 开发模式下 useEffect 重复执行导致 code 被用两次
  const processedRef = useRef(false)

  useEffect(() => {
    if (processedRef.current) return
    processedRef.current = true

    const code = new URLSearchParams(window.location.search).get('code')
    if (!code) {
      setError(true)
      setTimeout(() => navigate('/login'), 2000)
      return
    }

    fetch('/api/v1/auth/github', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.detail || 'GitHub 登录失败')
        }
        // 保存登录态并跳转首页
        setAuth(data.access_token, data.user)
        navigate('/')
      })
      .catch(() => {
        setError(true)
        setTimeout(() => navigate('/login'), 2000)
      })
  }, [])

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Result
          status="error"
          title="GitHub 登录失败"
          subTitle="即将跳转到登录页..."
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col justify-center items-center gap-3 h-screen">
      <Spin size="large" />
      <span className="text-sm text-gray-500">正在登录...</span>
    </div>
  )
}
