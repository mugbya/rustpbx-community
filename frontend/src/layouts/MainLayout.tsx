import { useState, type ReactNode } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Dropdown, Avatar, Space, Typography, Button } from 'antd'
import {
  HomeOutlined,
  MessageOutlined,
  QuestionCircleOutlined,
  FileTextOutlined,
  CloudDownloadOutlined,
  BookOutlined,
  UserOutlined,
  LogoutOutlined,
  LoginOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/store/auth'
import { NAV_MENU_ITEMS, DOCS_URL } from '@/utils/constants'

const { Header, Content, Sider } = Layout

// 主布局：顶部导航栏 + 侧边栏 + 内容区
export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuthStore()

  // 导航菜单图标映射
  const iconMap: Record<string, ReactNode> = {
    '/': <HomeOutlined />,
    '/forum': <MessageOutlined />,
    '/qa': <QuestionCircleOutlined />,
    '/articles': <FileTextOutlined />,
    '/resources': <CloudDownloadOutlined />,
    docs: <BookOutlined />,
  }

  // 当前选中菜单项
  const selectedKey =
    NAV_MENU_ITEMS.find((item) => item.key !== 'docs' && location.pathname.startsWith(item.key) && item.key !== '/')?.key ??
    (location.pathname === '/' ? '/' : '')

  // 侧边栏快捷菜单
  const siderMenuItems = [
    { key: '/', icon: <HomeOutlined />, label: '首页' },
    { key: '/forum', icon: <MessageOutlined />, label: '论坛' },
    { key: '/qa', icon: <QuestionCircleOutlined />, label: '问答' },
    { key: '/articles', icon: <FileTextOutlined />, label: '文章' },
    { key: '/resources', icon: <CloudDownloadOutlined />, label: '资源' },
  ]

  // 处理菜单点击
  const handleMenuClick = (key: string) => {
    if (key === 'docs') {
      window.open(DOCS_URL, '_blank')
    } else {
      navigate(key)
    }
  }

  // 用户下拉菜单
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/user/profile'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout()
        navigate('/login')
      },
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 顶部导航栏 */}
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        {/* Logo */}
        <div
          style={{ cursor: 'pointer', marginRight: 32, display: 'flex', alignItems: 'center' }}
          onClick={() => navigate('/')}
        >
          <Space>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: '#ce422b',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              R
            </div>
            <Typography.Title level={4} style={{ margin: 0, color: '#ce422b' }}>
              RustPBX
            </Typography.Title>
          </Space>
        </div>

        {/* 顶部导航菜单 */}
        <Menu
          mode="horizontal"
          selectedKeys={selectedKey ? [selectedKey] : []}
          style={{ flex: 1, borderBottom: 'none' }}
          items={NAV_MENU_ITEMS.map((item) => ({
            key: item.key,
            icon: iconMap[item.key],
            label: item.label,
          }))}
          onClick={({ key }) => handleMenuClick(key)}
        />

        {/* 用户菜单 */}
        {user ? (
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar size="small" src={user.avatar} icon={<UserOutlined />} />
              <span>{user.nickname || user.username}</span>
            </Space>
          </Dropdown>
        ) : (
          <Button type="primary" icon={<LoginOutlined />} onClick={() => navigate('/login')}>
            登录
          </Button>
        )}
      </Header>

      <Layout>
        {/* 侧边栏 */}
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          width={200}
          style={{ background: '#fff' }}
        >
          <Menu
            mode="inline"
            selectedKeys={selectedKey ? [selectedKey] : []}
            style={{ borderRight: 'none', paddingTop: 16 }}
            items={siderMenuItems}
            onClick={({ key }) => navigate(key)}
          />
        </Sider>

        {/* 内容区 */}
        <Content style={{ padding: 24, background: '#f5f5f5' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
