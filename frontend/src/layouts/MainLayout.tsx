import { useState, Suspense, type ReactNode } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Home,
  MessageSquare,
  HelpCircle,
  FileText,
  CloudDownload,
  Bug,
  BookOpen,
  User,
  LogOut,
  LogIn,
  SquarePen,
  Users,
  Menu as MenuIcon,
} from 'lucide-react'
import { Github } from '@/components/ui/icons/Github'
import { useAuthStore } from '@/store/auth'
import Loading from '@/components/Loading'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Dropdown, type DropdownItem } from '@/components/ui/Dropdown'
import { NAV_MENU_ITEMS, DOCS_URL, GITHUB_REPO_URL } from '@/utils/constants'

// 主布局：顶部导航栏 + 侧边栏 + 内容区
export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuthStore()

  // 导航菜单图标映射
  const iconMap: Record<string, ReactNode> = {
    '/': <Home className="h-4 w-4" />,
    '/forum': <MessageSquare className="h-4 w-4" />,
    '/qa': <HelpCircle className="h-4 w-4" />,
    '/articles': <FileText className="h-4 w-4" />,
    '/resources': <CloudDownload className="h-4 w-4" />,
    '/community': <Bug className="h-4 w-4" />,
    '/admin/users': <Users className="h-4 w-4" />,
    docs: <BookOpen className="h-4 w-4" />,
  }

  // 当前选中菜单项
  const selectedKey = location.pathname.startsWith('/admin')
    ? '/admin'
    : NAV_MENU_ITEMS.find(
        (item) => item.key !== 'docs' && item.key !== '/' && location.pathname.startsWith(item.key),
      )?.key ?? (location.pathname === '/' ? '/' : '')

  // 侧边栏快捷菜单
  const siderMenuItems = [
    { key: '/', icon: <Home className="h-4 w-4" />, label: '首页' },
    { key: '/forum', icon: <MessageSquare className="h-4 w-4" />, label: '论坛' },
    { key: '/qa', icon: <HelpCircle className="h-4 w-4" />, label: '问答' },
    { key: '/articles', icon: <FileText className="h-4 w-4" />, label: '文章' },
    { key: '/resources', icon: <CloudDownload className="h-4 w-4" />, label: '资源' },
    { key: '/community', icon: <Bug className="h-4 w-4" />, label: '社区建设' },
    ...(user?.role === 'admin'
      ? [{ key: '/admin', icon: <Users className="h-4 w-4" />, label: '管理后台' }]
      : []),
  ]

  // 处理菜单点击
  const handleMenuClick = (key: string) => {
    if (key === 'docs') {
      window.open(DOCS_URL, '_blank')
    } else if (key === 'github') {
      window.open(GITHUB_REPO_URL, '_blank')
    } else {
      navigate(key)
    }
  }

  // 发帖下拉菜单选项
  const createMenuItems: DropdownItem[] = [
    { key: 'discussion', label: '发讨论帖', icon: <MessageSquare className="h-4 w-4" /> },
    { key: 'question', label: '提问题', icon: <HelpCircle className="h-4 w-4" /> },
    { key: 'article', label: '写文章', icon: <FileText className="h-4 w-4" /> },
    { key: 'resource', label: '传资源', icon: <CloudDownload className="h-4 w-4" /> },
  ]

  // 处理发帖点击：未登录跳转登录页
  const handleCreate = (key: string) => {
    if (!user) {
      navigate('/login')
      return
    }
    navigate(`/topic/create?type=${key}`)
  }

  // 用户下拉菜单
  const userMenuItems: DropdownItem[] = [
    {
      key: 'profile',
      label: '个人中心',
      icon: <User className="h-4 w-4" />,
      onClick: () => navigate('/user/profile'),
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogOut className="h-4 w-4" />,
      onClick: () => {
        logout()
        navigate('/login')
      },
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-10 flex items-center px-6 h-16 bg-white border-b border-gray-200">
        {/* Logo */}
        <div
          className="cursor-pointer mr-8 flex items-center"
          onClick={() => navigate('/')}
        >
          <div className="w-8 h-8 rounded-lg bg-primary-600 text-white flex items-center justify-center font-bold text-base">
            R
          </div>
          <span className="ml-2 text-lg font-semibold text-primary-600">RustPBX</span>
        </div>

        {/* 顶部导航菜单 */}
        <nav className="flex-1 flex items-center gap-1">
          {NAV_MENU_ITEMS.filter((item) => item.key !== 'docs').map((item) => (
            <NavBtn
              key={item.key}
              active={selectedKey === item.key}
              icon={iconMap[item.key]}
              label={item.label}
              onClick={() => handleMenuClick(item.key)}
            />
          ))}
          {user?.role === 'admin' && (
            <NavBtn
              active={selectedKey === '/admin'}
              icon={<Users className="h-4 w-4" />}
              label="管理后台"
              onClick={() => navigate('/admin')}
            />
          )}
          <NavBtn
            icon={<BookOpen className="h-4 w-4" />}
            label="文档"
            onClick={() => handleMenuClick('docs')}
          />
          <NavBtn
            icon={<Github className="h-4 w-4" />}
            label="GitHub"
            onClick={() => handleMenuClick('github')}
          />
        </nav>

        {/* 发帖下拉菜单 */}
        <Dropdown
          menu={{ items: createMenuItems, onClick: (key) => handleCreate(key) }}
          placement="bottomRight"
        >
          <Button variant="primary" className="mr-4">
            <SquarePen className="h-4 w-4" />
            发帖
          </Button>
        </Dropdown>

        {/* 用户菜单 */}
        {user ? (
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <span className="inline-flex items-center gap-1.5 cursor-pointer">
              <Avatar size="small" src={user.avatar} icon={<User className="h-4 w-4" />} />
              <span className="text-sm text-gray-700">{user.username}</span>
            </span>
          </Dropdown>
        ) : (
          <Button variant="primary" onClick={() => navigate('/login')}>
            <LogIn className="h-4 w-4" />
            登录
          </Button>
        )}
      </header>

      <div className="flex flex-1">
        {/* 侧边栏 */}
        <aside
          className={`bg-white border-r border-gray-200 transition-all duration-200 ${
            collapsed ? 'w-16' : 'w-[200px]'
          }`}
        >
          <button
            className="w-full flex items-center justify-center py-3 text-gray-400 hover:text-primary-600"
            onClick={() => setCollapsed((c) => !c)}
          >
            <MenuIcon className="h-4 w-4" />
          </button>
          <nav className="pt-2">
            {siderMenuItems.map((item) => (
              <SiderBtn
                key={item.key}
                active={selectedKey === item.key}
                icon={item.icon}
                label={item.label}
                collapsed={collapsed}
                onClick={() => navigate(item.key)}
              />
            ))}
          </nav>
        </aside>

        {/* 内容区 */}
        <main className="flex-1 p-6 bg-gray-50">
          <Suspense fallback={<Loading />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}

// 顶部导航按钮
function NavBtn({
  active,
  icon,
  label,
  onClick,
}: {
  active?: boolean
  icon: ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 h-10 text-sm rounded transition-colors border-b-2 ${
        active
          ? 'border-primary-600 text-primary-600 font-medium'
          : 'border-transparent text-gray-600 hover:text-primary-600'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

// 侧边栏按钮
function SiderBtn({
  active,
  icon,
  label,
  collapsed,
  onClick,
}: {
  active?: boolean
  icon: ReactNode
  label: string
  collapsed: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
        collapsed ? 'justify-center' : ''
      } ${
        active
          ? 'bg-primary-50 text-primary-600 font-medium border-r-2 border-primary-600'
          : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
      }`}
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </button>
  )
}
