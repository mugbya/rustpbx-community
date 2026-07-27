import { type ReactNode, useState } from 'react'
import { cn } from './cn'

export interface AvatarProps {
  src?: string | null
  icon?: ReactNode
  size?: number | 'small' | 'default' | 'large'
  className?: string
  children?: ReactNode
}

const sizeMap = { small: 24, default: 32, large: 40 }

// 头像
export function Avatar({ src, icon, size = 'default', className, children }: AvatarProps) {
  const [err, setErr] = useState(false)
  const px = typeof size === 'number' ? size : sizeMap[size]
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-gray-200 text-gray-500 overflow-hidden flex-shrink-0',
        className,
      )}
      style={{ width: px, height: px }}
    >
      {src && !err ? (
        <img
          src={src}
          alt=""
          className="w-full h-full object-cover"
          onError={() => setErr(true)}
        />
      ) : icon ? (
        icon
      ) : children ? (
        <span className="text-xs">{children}</span>
      ) : (
        <span className="text-xs">U</span>
      )}
    </div>
  )
}
