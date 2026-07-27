import { type TextareaHTMLAttributes, forwardRef } from 'react'
import { cn } from './cn'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

// 多行文本框
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, rows = 4, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        'w-full px-3 py-2 rounded border border-gray-300 bg-white text-gray-800 text-sm',
        'placeholder:text-gray-400 resize-y',
        'focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600',
        'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
        className,
      )}
      {...rest}
    />
  )
})
