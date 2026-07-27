import { type ReactNode } from 'react'
import { cn } from './cn'

export interface EmptyProps {
  description?: ReactNode
  className?: string
}

// 空状态
export function Empty({ description = '暂无数据', className }: EmptyProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-10 text-gray-400', className)}>
      <svg className="h-16 w-16 mb-3" viewBox="0 0 64 64" fill="none">
        <rect x="8" y="12" width="48" height="40" rx="4" className="fill-gray-100" />
        <rect x="14" y="18" width="36" height="6" rx="2" className="fill-gray-200" />
        <rect x="14" y="28" width="28" height="4" rx="2" className="fill-gray-200" />
        <rect x="14" y="36" width="32" height="4" rx="2" className="fill-gray-200" />
      </svg>
      <span className="text-sm">{description}</span>
    </div>
  )
}
