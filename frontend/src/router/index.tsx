import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import MainLayout from '@/layouts/MainLayout'
import AuthLayout from '@/layouts/AuthLayout'
import Loading from '@/components/Loading'
import { useAuthStore } from '@/store/auth'

// 路由懒加载：每个页面拆成独立 chunk，首屏只加载当前路由所需代码
const Home = lazy(() => import('@/pages/Home'))
const Login = lazy(() => import('@/pages/auth/Login'))
const Register = lazy(() => import('@/pages/auth/Register'))
const GitHubCallback = lazy(() => import('@/pages/auth/GitHubCallback'))
const ForumList = lazy(() => import('@/pages/Forum/List'))
const TopicDetail = lazy(() => import('@/pages/Forum/TopicDetail'))
const TopicCreate = lazy(() => import('@/pages/Topic/Create'))
const QAList = lazy(() => import('@/pages/QA/List'))
const ArticleList = lazy(() => import('@/pages/Article/List'))
const ResourceList = lazy(() => import('@/pages/Resource/List'))
const CommunityList = lazy(() => import('@/pages/Community/List'))
const CommunityDetail = lazy(() => import('@/pages/Community/Detail'))
const CommunityCreate = lazy(() => import('@/pages/Community/Create'))
const Profile = lazy(() => import('@/pages/User/Profile'))
const AdminUsers = lazy(() => import('@/pages/Admin/Users'))
const NotFound = lazy(() => import('@/pages/NotFound'))

// 路由守卫：未登录用户重定向到登录页
function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = useAuthStore((state) => state.token)
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

// 路由懒加载占位：页面 chunk 加载期间显示 Loading
function LazyPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<Loading />}>{children}</Suspense>
}

// 路由配置
const router = createBrowserRouter([
  {
    // 主布局路由
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <LazyPage><Home /></LazyPage> },
      { path: 'forum', element: <LazyPage><ForumList /></LazyPage> },
      // 帖子详情：四个分区共用同一组件，按分区前缀路由以便导航高亮正确匹配。
      // /forum/topic/:id 同时兼容旧书签；详情页拿到 topic.type 后会自纠偏到正确前缀。
      { path: 'forum/topic/:id', element: <LazyPage><TopicDetail /></LazyPage> },
      { path: 'qa/topic/:id', element: <LazyPage><TopicDetail /></LazyPage> },
      { path: 'articles/topic/:id', element: <LazyPage><TopicDetail /></LazyPage> },
      { path: 'resources/topic/:id', element: <LazyPage><TopicDetail /></LazyPage> },
      {
        // 受保护路由：创建帖子需要登录
        path: 'topic/create',
        element: (
          <ProtectedRoute>
            <LazyPage><TopicCreate /></LazyPage>
          </ProtectedRoute>
        ),
      },
      { path: 'qa', element: <LazyPage><QAList /></LazyPage> },
      { path: 'articles', element: <LazyPage><ArticleList /></LazyPage> },
      { path: 'resources', element: <LazyPage><ResourceList /></LazyPage> },
      { path: 'community', element: <LazyPage><CommunityList /></LazyPage> },
      { path: 'community/detail/:id', element: <LazyPage><CommunityDetail /></LazyPage> },
      {
        // 受保护路由：社区发帖需要登录
        path: 'community/create',
        element: (
          <ProtectedRoute>
            <LazyPage><CommunityCreate /></LazyPage>
          </ProtectedRoute>
        ),
      },
      {
        // 受保护路由：个人中心需要登录
        path: 'user/profile',
        element: (
          <ProtectedRoute>
            <LazyPage><Profile /></LazyPage>
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin',
        element: (
          <ProtectedRoute>
            <LazyPage><AdminUsers /></LazyPage>
          </ProtectedRoute>
        ),
      },
      // 404
      { path: '*', element: <LazyPage><NotFound /></LazyPage> },
    ],
  },
  {
    // 认证布局路由
    path: '/login',
    element: <AuthLayout />,
    children: [{ index: true, element: <LazyPage><Login /></LazyPage> }],
  },
  {
    path: '/register',
    element: <AuthLayout />,
    children: [{ index: true, element: <LazyPage><Register /></LazyPage> }],
  },
  {
    // GitHub OAuth 回调页（独立页面，不需要布局）
    path: '/auth/github/callback',
    element: <LazyPage><GitHubCallback /></LazyPage>,
  },
])

// 应用路由组件
export function AppRouter() {
  return <RouterProvider router={router} />
}
