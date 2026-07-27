import { useState, type ReactNode } from 'react'
import { Button } from './Button'
import { cn } from './cn'

export interface ConfirmButtonProps {
  /** 确认提示文案 */
  title?: string
  /** 确认按钮文案 */
  okText?: string
  /** 取消按钮文案 */
  cancelText?: string
  /** 触发确认时调用 */
  onConfirm?: () => void | Promise<void>
  children?: ReactNode
  /** 未确认态按钮样式（沿用 Button variant） */
  variant?: 'default' | 'danger' | 'primary' | 'text' | 'link'
  size?: 'small' | 'middle' | 'large'
  className?: string
}

/**
 * 内联确认按钮：替代 antd Popconfirm。
 * 点击后按钮原地切换为「确认 / 取消」两步，再次点确认才触发 onConfirm。
 */
export function ConfirmButton({
  title,
  okText = '确认',
  cancelText = '取消',
  onConfirm,
  children,
  variant = 'default',
  size = 'small',
  className,
}: ConfirmButtonProps) {
  const [state, setState] = useState<'idle' | 'confirming'>('idle')
  const [loading, setLoading] = useState(false)

  if (state === 'idle') {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setState('confirming')}
      >
        {children}
      </Button>
    )
  }

  return (
    <span className={cn('inline-flex items-center gap-1', className)} title={title}>
      <Button
        variant="danger"
        size={size}
        loading={loading}
        onClick={async () => {
          try {
            setLoading(true)
            await onConfirm?.()
            setState('idle')
          } finally {
            setLoading(false)
          }
        }}
      >
        {okText}
      </Button>
      <Button
        variant="default"
        size={size}
        onClick={() => setState('idle')}
      >
        {cancelText}
      </Button>
    </span>
  )
}
