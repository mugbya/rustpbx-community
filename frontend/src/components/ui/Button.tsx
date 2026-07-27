import { type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from './cn'

type Variant = 'primary' | 'default' | 'danger' | 'text' | 'link'
type Size = 'small' | 'middle' | 'large'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  block?: boolean
  icon?: ReactNode
  children?: ReactNode
}

const variantClass: Record<Variant, string> = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 border border-transparent',
  default:
    'bg-white text-gray-700 border border-gray-300 hover:text-primary-600 hover:border-primary-600',
  danger: 'bg-white text-red-500 border border-red-300 hover:text-white hover:bg-red-500',
  text: 'bg-transparent text-gray-700 border border-transparent hover:bg-gray-100',
  link: 'bg-transparent text-primary-600 border border-transparent hover:text-primary-700 hover:underline p-0 h-auto',
}

const sizeClass: Record<Size, string> = {
  small: 'h-7 px-2.5 text-xs gap-1',
  middle: 'h-9 px-4 text-sm gap-1.5',
  large: 'h-11 px-6 text-base gap-2',
}

// 按钮
export function Button({
  variant = 'default',
  size = 'middle',
  loading = false,
  block = false,
  icon,
  children,
  className,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded font-normal cursor-pointer transition-colors',
        'focus:outline-none disabled:cursor-not-allowed disabled:opacity-60',
        variantClass[variant],
        sizeClass[size],
        block && 'w-full',
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {!loading && icon}
      {children}
    </button>
  )
}
