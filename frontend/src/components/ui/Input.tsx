import { type InputHTMLAttributes, type ReactNode, useState, forwardRef } from 'react'
import { cn } from './cn'
import { Eye, EyeOff, X } from 'lucide-react'

type Size = 'small' | 'middle' | 'large'

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  size?: Size
  prefix?: ReactNode
  allowClear?: boolean
  onPressEnter?: () => void
}

const sizeClass: Record<Size, string> = {
  small: 'h-7 text-xs',
  middle: 'h-9 text-sm',
  large: 'h-11 text-base',
}

// 输入框
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    size = 'middle',
    prefix,
    allowClear,
    onPressEnter,
    className,
    value,
    onChange,
    disabled,
    ...rest
  },
  ref,
) {
  const showClear = allowClear && value && !disabled
  return (
    <div className={cn('relative inline-flex items-center w-full', className)}>
      {prefix && (
        <span className="absolute left-2.5 text-gray-400 pointer-events-none flex items-center">
          {prefix}
        </span>
      )}
      <input
        ref={ref}
        className={cn(
          'w-full px-3 rounded border border-gray-300 bg-white text-gray-800',
          'placeholder:text-gray-400',
          'focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600',
          'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
          sizeClass[size],
          prefix && 'pl-8',
          showClear && 'pr-7',
        )}
        value={value}
        onChange={onChange}
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onPressEnter?.()
        }}
        {...rest}
      />
      {showClear && (
        <button
          type="button"
          className="absolute right-2 text-gray-400 hover:text-gray-600 flex items-center"
          onClick={() =>
            onChange?.({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>)
          }
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
})

interface PasswordProps extends InputProps {}

export const InputPassword = forwardRef<HTMLInputElement, PasswordProps>(function InputPassword(
  { size = 'middle', prefix, className, ...props },
  ref,
) {
  const [visible, setVisible] = useState(false)
  return (
    <div className={cn('relative inline-flex items-center w-full', className)}>
      {prefix && (
        <span className="absolute left-2.5 text-gray-400 pointer-events-none flex items-center">
          {prefix}
        </span>
      )}
      <input
        ref={ref}
        {...props}
        type={visible ? 'text' : 'password'}
        className={cn(
          'w-full px-3 rounded border border-gray-300 bg-white text-gray-800',
          'placeholder:text-gray-400',
          'focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600',
          'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
          sizeClass[size],
          prefix && 'pl-8',
          'pr-8',
        )}
      />
      <button
        type="button"
        className="absolute right-2 text-gray-400 hover:text-gray-600 flex items-center"
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
})

// 挂上 Password，兼容 antd 的 Input.Password 写法
;(Input as any).Password = InputPassword
