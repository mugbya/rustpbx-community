import { Outlet, Link } from 'react-router-dom'
import { Layout, Typography, Space } from 'antd'
import { DOCS_URL, GITHUB_REPO_URL } from '@/utils/constants'

const { Content, Footer } = Layout

// 认证布局：登录/注册页面的简洁布局
export default function AuthLayout() {
  return (
    <Layout
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #fff5f3 0%, #fff 50%, #f5f5f5 100%)',
      }}
    >
      <Content
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        {/* Logo 区域 */}
        <Link to="/" style={{ marginBottom: 40 }}>
          <Space direction="vertical" align="center" size={4}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                background: '#ce422b',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 28,
              }}
            >
              R
            </div>
            <Typography.Title level={3} style={{ margin: 0, color: '#ce422b' }}>
              RustPBX 中文社区
            </Typography.Title>
          </Space>
        </Link>

        {/* 表单内容区 */}
        <div
          style={{
            width: '100%',
            maxWidth: 400,
            background: '#fff',
            padding: 32,
            borderRadius: 12,
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
          }}
        >
          <Outlet />
        </div>
      </Content>

      <Footer style={{ textAlign: 'center', background: 'transparent' }}>
        <Space split={<span>·</span>}>
          <Typography.Link href={DOCS_URL} target="_blank">
            文档
          </Typography.Link>
          <Typography.Link href={GITHUB_REPO_URL} target="_blank">
            GitHub
          </Typography.Link>
          <Typography.Text type="secondary">
            © {new Date().getFullYear()} RustPBX 中文社区
          </Typography.Text>
        </Space>
      </Footer>
    </Layout>
  )
}
