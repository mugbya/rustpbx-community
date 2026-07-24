import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Form, Input, Button, Divider, Typography, Alert, App as AntApp } from 'antd'
import { MailOutlined, LockOutlined, GithubOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/store/auth'
import { GITHUB_AUTHORIZE_URL } from '@/utils/constants'
import client from '@/api/client'
import type { UserInfo } from '@/api/types'

// 登录页：邮箱密码 + GitHub OAuth
export default function Login() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const { message } = AntApp.useApp()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 邮箱密码登录
  const handleLogin = async (values: { email: string; password: string }) => {
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
      <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 32 }}>
        欢迎回来
      </Typography.Title>

      <Form
        name="login"
        layout="vertical"
        onFinish={handleLogin}
        autoComplete="off"
        onValuesChange={() => error && setError('')}
      >
        <Form.Item
          name="email"
          label="邮箱"
          rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '请输入有效的邮箱地址' },
          ]}
        >
          <Input prefix={<MailOutlined />} placeholder="请输入邮箱" size="large" />
        </Form.Item>

        <Form.Item
          name="password"
          label="密码"
          rules={[{ required: true, message: '请输入密码' }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" size="large" />
        </Form.Item>

        {error && (
          <Alert
            type="error"
            message={error}
            showIcon
            closable
            onClose={() => setError('')}
            style={{ marginBottom: 16 }}
          />
        )}

        <Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={loading}>
            登录
          </Button>
        </Form.Item>
      </Form>

      <Divider plain>或</Divider>

      <Button
        block
        size="large"
        icon={<GithubOutlined />}
        onClick={handleGitHubLogin}
        style={{ background: '#24292e', color: '#fff', borderColor: '#24292e' }}
      >
        使用 GitHub 登录
      </Button>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Typography.Text type="secondary">
          还没有账号？ <Link to="/register">立即注册</Link>
        </Typography.Text>
      </div>
    </div>
  )
}
