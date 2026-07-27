import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, User } from 'lucide-react'
import { Github } from '@/components/ui/icons/Github'
import { GITHUB_AUTHORIZE_URL } from '@/utils/constants'
import client from '@/api/client'
import { useAuthStore } from '@/store/auth'
import type { UserInfo } from '@/api/types'
import { Input, InputPassword } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Divider } from '@/components/ui/Divider'
import { Alert } from '@/components/ui/Alert'
import { FormItem } from '@/components/ui/FormItem'
import { Title, Text } from '@/components/ui/Typography'
import { message } from '@/components/ui/MessageProvider'

const schema = z
  .object({
    username: z
      .string()
      .min(1, '请输入用户名')
      .min(3, '用户名长度为 3-20 个字符')
      .max(20, '用户名长度为 3-20 个字符'),
    email: z.string().min(1, '请输入邮箱').email('请输入有效的邮箱地址'),
    password: z.string().min(1, '请输入密码').min(8, '密码至少 8 个字符'),
    confirm: z.string().min(1, '请确认密码'),
  })
  .refine((data) => data.password === data.confirm, {
    message: '两次输入的密码不一致',
    path: ['confirm'],
  })
type FormValues = z.infer<typeof schema>

// 注册页
export default function Register() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  // 邮箱密码注册
  const handleRegister = async (values: FormValues) => {
    setError('')
    setLoading(true)
    try {
      const data = await client.post<unknown, { access_token: string; user: UserInfo }>(
        '/v1/auth/register',
        { email: values.email, username: values.username, password: values.password },
      )
      // 注册成功后自动登录
      setAuth(data.access_token, data.user)
      message.success('注册成功')
      navigate('/')
    } catch (err: any) {
      const errMsg = err?.response?.data?.detail || err?.response?.data?.message
      setError(errMsg || '注册失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // GitHub OAuth 注册
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
        创建账号
      </Title>

      <form onSubmit={handleSubmit(handleRegister)} autoComplete="off" onChange={() => error && setError('')}>
        <FormItem label="用户名" error={errors.username?.message} required>
          <Input size="large" prefix={<User className="h-4 w-4" />} placeholder="请输入用户名" {...register('username')} />
        </FormItem>

        <FormItem label="邮箱" error={errors.email?.message} required>
          <Input size="large" prefix={<Mail className="h-4 w-4" />} placeholder="请输入邮箱" {...register('email')} />
        </FormItem>

        <FormItem label="密码" error={errors.password?.message} required>
          <InputPassword size="large" prefix={<Lock className="h-4 w-4" />} placeholder="请输入密码" {...register('password')} />
        </FormItem>

        <FormItem label="确认密码" error={errors.confirm?.message} required>
          <InputPassword size="large" prefix={<Lock className="h-4 w-4" />} placeholder="请再次输入密码" {...register('confirm')} />
        </FormItem>

        {error && (
          <Alert type="error" message={error} closable onClose={() => setError('')} className="mb-4" />
        )}

        <Button type="submit" variant="primary" block size="large" loading={loading}>
          注册
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
        使用 GitHub 注册
      </Button>

      <div className="text-center mt-6">
        <Text type="secondary">
          已有账号？ <Link to="/login" className="text-primary-600 hover:underline">立即登录</Link>
        </Text>
      </div>
    </div>
  )
}
