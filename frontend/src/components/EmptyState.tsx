import { Empty } from '@/components/ui/Empty'
import { Button } from '@/components/ui/Button'

interface EmptyStateProps {
  // 描述文案
  description?: string
  // 自定义图标
  image?: React.ReactNode
  // 操作按钮文案
  actionText?: string
  // 操作按钮点击回调
  onAction?: () => void
}

// 空状态组件
export default function EmptyState({
  description = '暂无数据',
  image,
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10">
      {image ?? <Empty description={description} />}
      {image && <span className="mt-3 text-sm text-gray-500">{description}</span>}
      {actionText && onAction && (
        <Button variant="primary" className="mt-4" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  )
}
