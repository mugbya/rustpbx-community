import { type ReactNode } from 'react'
import { cn } from './cn'

type TagColor = 'default' | 'blue' | 'red' | 'green' | 'orange' | 'purple' | 'gold' | 'cyan'

export interface TagProps {
  color?: TagColor
  children?: ReactNode
  className?: string
}

const colorClass: Record<TagColor, string> = {
  default: 'bg-gray-100 text-gray-600 border-gray-200',
  blue: 'bg-blue-50 text-blue-600 border-blue-200',
  red: 'bg-red-50 text-red-600 border-red-200',
  green: 'bg-green-50 text-green-600 border-green-200',
  orange: 'bg-orange-50 text-orange-600 border-orange-200',
  purple: 'bg-purple-50 text-purple-600 border-purple-200',
  gold: 'bg-amber-50 text-amber-700 border-amber-200',
  cyan: 'bg-cyan-50 text-cyan-600 border-cyan-200',
}

// 标签
export function Tag({ color = 'default', children, className }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs rounded border leading-5 whitespace-nowrap',
        colorClass[color],
        className,
      )}
    >
      {children}
    </span>
  )
}
