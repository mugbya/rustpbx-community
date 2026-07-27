import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock } from 'lucide-react'
import { Github } from '@/components/ui/icons/Github'
import { useAuthStore } from '@/store/auth'
import { GITHUB_AUTHORIZE_URL } from '@/utils/constants'
import client from '@/api/client'
import type { UserInfo } from '@/api/types'
import { Input, InputPassword } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Divider } from '@/components/ui/Divider'
import { Alert } from '@/components/ui/Alert'
import { FormItem } from '@/components/ui/FormItem'
import { Title, Text } from '@/components/ui/Typography'
import { message } from '@/components/ui/MessageProvider'

const schema = z.object({
  email: z.string().min(1, '请输入邮箱').email('请输入有效的邮箱地址'),
  password: z.string().min(1, '请输入密码'),
})
type FormValues = z.infer<typeof schema>

// 登录页：邮箱密码 + GitHub OAuth
export default function Login() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  // 邮箱密码登录
  const handleLogin = async (values: FormValues) => {
    setError('')
    setLoading(true)
    try {
      const data = await client.post<unknown, { access_token: string; user: UserInfo }>(
        '/v1/auth/login',
        values,
      )
      setAuth(data.access_token, data.user)
      message.success('登录成功')
      navigate('/')
    } catch (err: any) {
      const errMsg = err?.response?.data?.detail || err?.response?.data?.message
      setError(errMsg || '登录失败，请检查邮箱和密码')
    } finally {
      setLoading(false)
    }
  }

  // GitHub OAuth 登录
  const handleGitHubLogin = async () => {
    try {
      const res = await fetch('/api/v1/auth/github/config')
      const json = await res.json()
      const { client_id, redirect_uri } = json.data
      const params = new URLSearchParams({
        client_id,
        redirect_uri,
        scope: 'read:user user:email',
      })
      window.location.href = `${GITHUB_AUTHORIZE_URL}?${params.toString()}`
    } catch {
      message.error('GitHub 登录配置获取失败')
    }
  }

  return (
    <div>
      <Title level={3} className="text-center mb-8">
        欢迎回来
      </Title>

      <form onSubmit={handleSubmit(handleLogin)} autoComplete="off" onChange={() => error && setError('')}>
        <FormItem label="邮箱" error={errors.email?.message} required>
          <Input size="large" prefix={<Mail className="h-4 w-4" />} placeholder="请输入邮箱" {...register('email')} />
        </FormItem>

        <FormItem label="密码" error={errors.password?.message} required>
          <InputPassword size="large" prefix={<Lock className="h-4 w-4" />} placeholder="请输入密码" {...register('password')} />
        </FormItem>

        {error && (
          <Alert type="error" message={error} closable onClose={() => setError('')} className="mb-4" />
        )}

        <Button type="submit" variant="primary" block size="large" loading={loading}>
          登录
        </Button>
      </form>

      <Divider plain>或</Divider>

      <Button
        block
        size="large"
        onClick={handleGitHubLogin}
        className="bg-[#24292e] text-white border-[#24292e] hover:bg-[#24292e]"
      >
        <Github className="h-4 w-4" />
        使用 GitHub 登录
      </Button>

      <div className="text-center mt-6">
        <Text type="secondary">
          还没有账号？ <Link to="/register" className="text-primary-600 hover:underline">立即注册</Link>
        </Text>
      </div>
    </div>
  )
}
