import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Form, Input, Button, Divider, Typography, message } from 'antd'
import { MailOutlined, LockOutlined, UserOutlined, GithubOutlined } from '@ant-design/icons'
import { GITHUB_CLIENT_ID, GITHUB_AUTHORIZE_URL, GITHUB_REDIRECT_URI } from '@/utils/constants'

// 注册页
export default function Register() {
  const navigate = useNavigate()
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
      // TODO: 调用后端注册接口
      // await client.post('/auth/register', values)
      console.log('注册参数：', values)
      message.success('注册成功，请登录')
      navigate('/login')
    } catch {
      message.error('注册失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // GitHub OAuth 注册
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
