import { useEffect } from 'react'
import { AppRouter } from '@/router'
import { initCdnConfig } from '@/utils/image'

// 根组件：渲染路由
function App() {
  // 初始化 CDN 配置（从后端获取 CDN 域名，用于图片 URL 替换）
  useEffect(() => {
    initCdnConfig()
  }, [])

  return <AppRouter />
}

export default App
