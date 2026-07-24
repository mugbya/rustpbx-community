import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Form, Input, Button, Divider, Typography, message } from 'antd'
import { MailOutlined, LockOutlined, UserOutlined, GithubOutlined } from '@ant-design/icons'
import { GITHUB_AUTHORIZE_URL } from '@/utils/constants'
import client from '@/api/client'
import { useAuthStore } from '@/store/auth'
import type { UserInfo } from '@/api/types'

// 注册页
export default function Register() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [loading, setLoading] = useState(false)

  // 邮箱密码注册
  const handleRegister = async (values: {
    username: string
    email: string
    password: string
    confirm: string
  }) => {
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
    } catch {
      // 错误已由拦截器处理
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
      <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 32 }}>
        创建账号
      </Typography.Title>

      <Form name="register" layout="vertical" onFinish={handleRegister} autoComplete="off">
        <Form.Item
          name="username"
          label="用户名"
          rules={[
            { required: true, message: '请输入用户名' },
            { min: 3, max: 20, message: '用户名长度为 3-20 个字符' },
          ]}
        >
          <Input prefix={<UserOutlined />} placeholder="请输入用户名" size="large" />
        </Form.Item>

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
          rules={[
            { required: true, message: '请输入密码' },
            { min: 8, message: '密码至少 8 个字符' },
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" size="large" />
        </Form.Item>

        <Form.Item
          name="confirm"
          label="确认密码"
          dependencies={['password']}
          rules={[
            { required: true, message: '请确认密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error('两次输入的密码不一致'))
              },
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="请再次输入密码" size="large" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={loading}>
            注册
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
        使用 GitHub 注册
      </Button>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Typography.Text type="secondary">
          已有账号？ <Link to="/login">立即登录</Link>
        </Typography.Text>
      </div>
    </div>
  )
}
