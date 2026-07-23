import { Empty, Button, Typography } from 'antd'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  // 描述文案
  description?: string
  // 自定义图标
  image?: ReactNode
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
    <Empty
      image={image ?? undefined}
      imageStyle={{ height: 80 }}
      description={<Typography.Text type="secondary">{description}</Typography.Text>}
    >
      {actionText && onAction && (
        <Button type="primary" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </Empty>
  )
}
