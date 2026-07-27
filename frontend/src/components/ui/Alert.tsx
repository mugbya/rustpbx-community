import { type ReactNode, useState } from 'react'
import { cn } from './cn'

export interface AlertProps {
  type?: 'success' | 'info' | 'warning' | 'error'
  message?: ReactNode
  showIcon?: boolean
  closable?: boolean
  onClose?: () => void
  className?: string
  style?: React.CSSProperties
}

const typeClass = {
  success: 'bg-green-50 text-green-700 border-green-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  error: 'bg-red-50 text-red-700 border-red-200',
}

// 警告提示条
export function Alert({ type = 'info', message, closable, onClose, className, style }: AlertProps) {
  const [closed, setClosed] = useState(false)
  if (closed) return null
  return (
    <div
      className={cn(
        'flex items-start gap-2 px-3 py-2 rounded border text-sm',
        typeClass[type],
        className,
      )}
      style={style}
    >
      <div className="flex-1">{message}</div>
      {closable && (
        <button
          className="text-current opacity-60 hover:opacity-100"
          onClick={() => {
            setClosed(true)
            onClose?.()
          }}
        >
          ✕
        </button>
      )}
    </div>
  )
}
