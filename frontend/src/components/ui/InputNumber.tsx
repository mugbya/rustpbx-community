import { useState, useEffect } from 'react'
import { cn } from './cn'

export interface InputNumberProps {
  value?: number
  onChange?: (value: number | undefined) => void
  min?: number
  max?: number
  className?: string
  style?: React.CSSProperties
  disabled?: boolean
}

// 数字输入框
export function InputNumber({
  value,
  onChange,
  min,
  max,
  className,
  style,
  disabled,
}: InputNumberProps) {
  const [text, setText] = useState(value === undefined ? '' : String(value))

  useEffect(() => {
    setText(value === undefined ? '' : String(value))
  }, [value])

  const commit = (raw: string) => {
    if (raw === '') {
      onChange?.(undefined)
      return
    }
    let n = Number(raw)
    if (Number.isNaN(n)) {
      setText(value === undefined ? '' : String(value))
      return
    }
    if (min !== undefined) n = Math.max(min, n)
    if (max !== undefined) n = Math.min(max, n)
    setText(String(n))
    onChange?.(n)
  }

  return (
    <input
      type="number"
      value={text}
      disabled={disabled}
      onChange={(e) => setText(e.target.value)}
      onBlur={(e) => commit(e.target.value)}
      className={cn(
        'w-full h-9 px-3 rounded border border-gray-300 bg-white text-sm text-gray-800',
        'focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600',
        'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
        className,
      )}
      style={style}
    />
  )
}
