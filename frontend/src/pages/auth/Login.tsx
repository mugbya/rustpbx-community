import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Form, Input, Button, Divider, Typography, message } from 'antd'
import { MailOutlined, LockOutlined, GithubOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/store/auth'
import { GITHUB_CLIENT_ID, GITHUB_AUTHORIZE_URL, GITHUB_REDIRECT_URI } from '@/utils/constants'

// 登录页：邮箱密码 + GitHub OAuth
export default function Login() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [loading, setLoading] = useState(false)

  // 邮箱密码登录
  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true)
    try {
      // TODO: 调用后端登录接口，获取 token 和用户信息
      // const { data } = await client.post('/auth/login', values)
      // setAuth(data.token, data.user)
      void setAuth // 待接口对接后启用
      console.log('登录参数：', values)
      message.success('登录成功')
      navigate('/')
    } catch {
      message.error('登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // GitHub OAuth 登录
  const handleGitHubLogin = () => {
    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      redirect_uri: GITHUB_REDIRECT_URI,
      scope: 'read:user user:email',
    })
    window.location.href = `${GITHUB_AUTHORIZE_URL}?${params.toString()}`
  }

  return (
    <div>
      <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 32 }}>
        欢迎回来
      </Typography.Title>

      <Form name="login" layout="vertical" onFinish={handleLogin} autoComplete="off">
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
