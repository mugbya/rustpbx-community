import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import MainLayout from '@/layouts/MainLayout'
import AuthLayout from '@/layouts/AuthLayout'
import Home from '@/pages/Home'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import GitHubCallback from '@/pages/auth/GitHubCallback'
import ForumList from '@/pages/Forum/List'
import TopicDetail from '@/pages/Forum/TopicDetail'
import TopicCreate from '@/pages/Topic/Create'
import QAList from '@/pages/QA/List'
import ArticleList from '@/pages/Article/List'
import ResourceList from '@/pages/Resource/List'
import CommunityList from '@/pages/Community/List'
import CommunityDetail from '@/pages/Community/Detail'
import CommunityCreate from '@/pages/Community/Create'
import Profile from '@/pages/User/Profile'
import AdminUsers from '@/pages/Admin/Users'
import NotFound from '@/pages/NotFound'
import { useAuthStore } from '@/store/auth'

// 路由守卫：未登录用户重定向到登录页
function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = useAuthStore((state) => state.token)
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

// 路由配置
const router = createBrowserRouter([
  {
    // 主布局路由
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'forum', element: <ForumList /> },
      { path: 'forum/topic/:id', element: <TopicDetail /> },
      {
        // 受保护路由：创建帖子需要登录
        path: 'topic/create',
        element: (
          <ProtectedRoute>
            <TopicCreate />
          </ProtectedRoute>
        ),
      },
      { path: 'qa', element: <QAList /> },
      { path: 'articles', element: <ArticleList /> },
      { path: 'resources', element: <ResourceList /> },
      { path: 'community', element: <CommunityList /> },
      { path: 'community/detail/:id', element: <CommunityDetail /> },
      {
        // 受保护路由：社区发帖需要登录
        path: 'community/create',
        element: (
          <ProtectedRoute>
            <CommunityCreate />
          </ProtectedRoute>
        ),
      },
      {
        // 受保护路由：个人中心需要登录
        path: 'user/profile',
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin',
        element: (
          <ProtectedRoute>
            <AdminUsers />
          </ProtectedRoute>
        ),
      },
      // 404
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    // 认证布局路由
    path: '/login',
    element: <AuthLayout />,
    children: [{ index: true, element: <Login /> }],
  },
  {
    path: '/register',
    element: <AuthLayout />,
    children: [{ index: true, element: <Register /> }],
  },
  {
    // GitHub OAuth 回调页（独立页面，不需要布局）
    path: '/auth/github/callback',
    element: <GitHubCallback />,
  },
])

// 应用路由组件
export function AppRouter() {
  return <RouterProvider router={router} />
}
