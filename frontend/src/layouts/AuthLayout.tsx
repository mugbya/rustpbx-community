import { Suspense } from 'react'
import { Outlet, Link } from 'react-router-dom'
import Loading from '@/components/Loading'
import { DOCS_URL, GITHUB_REPO_URL } from '@/utils/constants'

// 认证布局：登录/注册页面的简洁布局
export default function AuthLayout() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #fff5f3 0%, #fff 50%, #f5f5f5 100%)' }}
    >
      {/* Logo 区域 */}
      <Link to="/" className="mb-10 flex flex-col items-center gap-1">
        <div className="w-14 h-14 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold text-[28px]">
          R
        </div>
        <h3 className="text-xl font-semibold text-primary-600 m-0">RustPBX 中文社区</h3>
      </Link>

      {/* 表单内容区 */}
      <div
        className="w-full max-w-[400px] bg-white p-8 rounded-xl"
        style={{ boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)' }}
      >
        <Suspense fallback={<Loading />}>
          <Outlet />
        </Suspense>
      </div>

      {/* 底部 */}
      <div className="mt-10 flex items-center gap-2 text-sm text-gray-400">
        <a href={DOCS_URL} target="_blank" rel="noopener noreferrer" className="hover:text-primary-600">
          文档
        </a>
        <span>·</span>
        <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer" className="hover:text-primary-600">
          GitHub
        </a>
        <span>·</span>
        <span>© {new Date().getFullYear()} RustPBX 中文社区</span>
      </div>
    </div>
  )
}
