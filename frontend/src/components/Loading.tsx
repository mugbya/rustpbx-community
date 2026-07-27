import { Spin } from '@/components/ui/Spin'

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
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-3 bg-white/60 z-[1000]">
        <Spin size="large" />
        <span className="text-sm text-gray-500">{tip}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <Spin size="large" />
      <span className="text-sm text-gray-500">{tip}</span>
    </div>
  )
}
