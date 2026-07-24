import { useEffect } from 'react'
import { App as AntApp } from 'antd'
import { AppRouter } from '@/router'
import { setMessageInstance } from '@/utils/messageHolder'

// 根组件：渲染路由
function App() {
  const { message } = AntApp.useApp()

  // 将 message 实例存到全局，供非组件代码（如 axios 拦截器）使用
  useEffect(() => {
    setMessageInstance(message)
  }, [message])

  return <AppRouter />
}

export default App
