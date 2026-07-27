import { type ReactNode, type ElementType } from 'react'
import { cn } from './cn'

interface TitleProps {
  level?: 1 | 2 | 3 | 4 | 5
  children?: ReactNode
  className?: string
  style?: React.CSSProperties
}

const titleTag: Record<number, ElementType> = { 1: 'h1', 2: 'h2', 3: 'h3', 4: 'h4', 5: 'h5' }
const titleClass: Record<number, string> = {
  1: 'text-3xl font-bold',
  2: 'text-2xl font-semibold',
  3: 'text-xl font-semibold',
  4: 'text-lg font-semibold',
  5: 'text-base font-semibold',
}

// 标题
export function Title({ level = 1, children, className, style }: TitleProps) {
  const Tag = titleTag[level]
  return <Tag className={cn(titleClass[level], className)} style={style}>{children}</Tag>
}

interface TextProps {
  type?: 'secondary' | 'success' | 'warning' | 'danger'
  strong?: boolean
  children?: ReactNode
  className?: string
  style?: React.CSSProperties
}

const textTypeClass = {
  secondary: 'text-gray-500',
  success: 'text-green-600',
  warning: 'text-amber-600',
  danger: 'text-red-500',
}

// 文本
export function Text({ type, strong, children, className, style }: TextProps) {
  return (
    <span
      className={cn(type && textTypeClass[type], strong && 'font-semibold', className)}
      style={style}
    >
      {children}
    </span>
  )
}

interface ParagraphProps {
  children?: ReactNode
  className?: string
  style?: React.CSSProperties
}

// 段落
export function Paragraph({ children, className, style }: ParagraphProps) {
  return <p className={cn('leading-relaxed', className)} style={style}>{children}</p>
}
