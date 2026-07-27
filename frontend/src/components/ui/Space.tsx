import { type ReactNode } from 'react'
import { cn } from './cn'

type Size = 'small' | 'middle' | 'large' | number
type Direction = 'horizontal' | 'vertical'

export interface SpaceProps {
  direction?: Direction
  size?: Size | [Size, Size]
  wrap?: boolean
  align?: 'start' | 'center' | 'end' | 'baseline'
  children?: ReactNode
  className?: string
  style?: React.CSSProperties
}

const sizeMap: Record<Exclude<Size, number>, number> = { small: 8, middle: 12, large: 16 }

function toPx(s: Size): number {
  return typeof s === 'number' ? s : sizeMap[s]
}

// 间距容器
export function Space({
  direction = 'horizontal',
  size = 'small',
  wrap = false,
  align,
  children,
  className,
  style,
}: SpaceProps) {
  const [main, cross] = Array.isArray(size) ? size : [size, size]
  const gap = `${toPx(cross)}px ${toPx(main)}px`
  return (
    <div
      className={cn(
        'flex',
        direction === 'vertical' ? 'flex-col' : 'flex-row',
        wrap && 'flex-wrap',
        align === 'center' && 'items-center',
        align === 'start' && 'items-start',
        align === 'end' && 'items-end',
        align === 'baseline' && 'items-baseline',
        className,
      )}
      style={{ gap, ...style }}
    >
      {children}
    </div>
  )
}
