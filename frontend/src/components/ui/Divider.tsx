import { type ReactNode } from 'react'
import { cn } from './cn'

export interface DividerProps {
  plain?: boolean
  children?: ReactNode
  className?: string
}

// 分隔线（含文字分隔）
export function Divider({ plain, children, className }: DividerProps) {
  if (!children) {
    return <hr className={cn('border-t border-gray-200 my-4', className)} />
  }
  return (
    <div className={cn('flex items-center my-4 text-gray-400', plain && 'text-xs', className)}>
      <span className="flex-1 border-t border-gray-200" />
      <span className="px-4">{children}</span>
      <span className="flex-1 border-t border-gray-200" />
    </div>
  )
}
