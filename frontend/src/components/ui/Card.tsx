import { type ReactNode } from 'react'
import { cn } from './cn'

export interface CardProps {
  title?: ReactNode
  extra?: ReactNode
  children?: ReactNode
  className?: string
  bodyClassName?: string
  style?: React.CSSProperties
  bordered?: boolean
  onClick?: () => void
}

// 卡片
export function Card({
  title,
  extra,
  children,
  className,
  bodyClassName,
  style,
  bordered = true,
  onClick,
}: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded shadow-sm',
        bordered && 'border border-gray-200',
        onClick && 'cursor-pointer transition-shadow hover:shadow-md',
        className,
      )}
      style={style}
      onClick={onClick}
    >
      {(title || extra) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="font-medium text-gray-800">{title}</div>
          <div>{extra}</div>
        </div>
      )}
      <div className={cn('p-4', bodyClassName)}>{children}</div>
    </div>
  )
}
