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
import QAList from '@/pages/QA/List'
import ArticleList from '@/pages/Article/List'
import ResourceList from '@/pages/Resource/List'
import Profile from '@/pages/User/Profile'
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
      { path: 'qa', element: <QAList /> },
      { path: 'articles', element: <ArticleList /> },
      { path: 'resources', element: <ResourceList /> },
      {
        // 受保护路由：个人中心需要登录
        path: 'user/profile',
        element: (
          <ProtectedRoute>
            <Profile />
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
