import { type ReactNode } from 'react'
import { cn } from './cn'

export interface FormItemProps {
  label?: ReactNode
  error?: string
  required?: boolean
  children: ReactNode
  className?: string
  help?: ReactNode
}

// 表单项：label + 控件 + 错误提示。配合 react-hook-form 使用（错误由 useForm 的 errors 传入）
export function FormItem({ label, error, required, children, className, help }: FormItemProps) {
  return (
    <div className={cn('mb-4', className)}>
      {label && (
        <label className="block mb-1.5 text-sm text-gray-700">
          {required && <span className="text-red-500 mr-0.5">*</span>}
          {label}
        </label>
      )}
      {children}
      {help && !error && <div className="mt-1 text-xs text-gray-400">{help}</div>}
      {error && <div className="mt-1 text-xs text-red-500">{error}</div>}
    </div>
  )
}
