import { type ReactNode } from 'react'
import { cn } from './cn'

export interface RadioGroupProps<T = string> {
  value?: T
  onChange?: (value: T) => void
  children?: ReactNode
  className?: string
}

// 提供给 Radio 读取上下文（简易实现：通过 children 解析）
// 这里采用受控 + 克隆 children 注入 checked/onChange 的方式
import { cloneElement, isValidElement, type ReactElement } from 'react'

interface RadioProps<T = string> {
  value: T
  children?: ReactNode
  checked?: boolean
  onChange?: (value: T) => void
}

export function Radio<T = string>({ value, children, checked, onChange }: RadioProps<T>) {
  return (
    <label className="inline-flex items-center gap-1.5 cursor-pointer text-sm text-gray-700">
      <input
        type="radio"
        className="text-primary-600 focus:ring-primary-600"
        checked={checked}
        onChange={() => onChange?.(value)}
      />
      {children}
    </label>
  )
}

export function RadioGroup<T = string>({ value, onChange, children, className }: RadioGroupProps<T>) {
  return (
    <div className={cn('inline-flex items-center gap-4', className)}>
      {(children as ReactElement<RadioProps<T>>[]) &&
        (Array.isArray(children) ? children : [children]).map((child, idx) => {
          if (!isValidElement<RadioProps<T>>(child)) return child
          return cloneElement(child, {
            key: idx,
            checked: value === child.props.value,
            onChange,
          } as Partial<RadioProps<T>>)
        })}
    </div>
  )
}
