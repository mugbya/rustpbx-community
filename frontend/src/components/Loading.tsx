import { Spin } from 'antd'

interface LoadingProps {
  // 提示文案
  tip?: string
  // 是否全屏覆盖
  fullscreen?: boolean
}

// 加载组件
export default function Loading({ tip = '加载中...', fullscreen = false }: LoadingProps) {
  if (fullscreen) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.6)',
          zIndex: 1000,
        }}
      >
        <Spin tip={tip} size="large" />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
      <Spin tip={tip} size="large" />
    </div>
  )
}
