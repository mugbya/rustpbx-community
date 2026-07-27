import { type ReactNode } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { ChevronDown, Check, X } from 'lucide-react'
import { cn } from './cn'

export interface SelectOption {
  label: ReactNode
  value: string | number | boolean
}

export interface SelectProps {
  value?: string | number | boolean | (string | number | boolean)[]
  onChange?: (value: any) => void
  options: SelectOption[]
  placeholder?: string
  allowClear?: boolean
  mode?: 'multiple'
  disabled?: boolean
  className?: string
  style?: React.CSSProperties
}

// 下拉选择器（支持单选/多选）
export function Select({
  value,
  onChange,
  options,
  placeholder = '请选择',
  allowClear,
  mode,
  disabled,
  className,
  style,
}: SelectProps) {
  const multiple = mode === 'multiple'

  const isSel = (v: any) => (multiple ? Array.isArray(value) && value.includes(v) : value === v)

  const displayLabel = () => {
    if (multiple) {
      const arr = (value as any[]) ?? []
      if (!arr.length) return null
      return arr
        .map((v) => options.find((o) => o.value === v))
        .filter(Boolean)
        .map((o) => o!.label)
    }
    const opt = options.find((o) => o.value === value)
    return opt ? opt.label : null
  }

  return (
    <div className={cn('relative inline-block w-full', className)} style={style}>
      <Listbox
        value={value}
        onChange={(v: any) => onChange?.(v)}
        multiple={multiple}
        disabled={disabled}
      >
        {({ open }) => (
          <>
            <div className="relative">
              <Listbox.Button
                className={cn(
                  'w-full h-9 px-3 pr-8 text-left rounded border border-gray-300 bg-white text-sm text-gray-800',
                  'flex items-center justify-between gap-2',
                  'focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600',
                  'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
                  multiple && Array.isArray(value) && value.length > 0 && 'h-auto py-1',
                )}
              >
                <span className="flex flex-wrap gap-1 items-center min-h-[20px]">
                  {displayLabel() ? (
                    displayLabel()
                  ) : (
                    <span className="text-gray-400">{placeholder}</span>
                  )}
                </span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {allowClear && value && (multiple ? (value as any[]).length > 0 : true) && (
                    <span
                      role="button"
                      tabIndex={0}
                      className="text-gray-400 hover:text-gray-600"
                      onClick={(e) => {
                        e.stopPropagation()
                        onChange?.(multiple ? [] : undefined)
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </span>
                  )}
                  <ChevronDown
                    className={cn('h-4 w-4 text-gray-400 transition-transform', open && 'rotate-180')}
                  />
                </div>
              </Listbox.Button>
              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="absolute z-40 mt-1 w-full max-h-60 overflow-auto bg-white rounded border border-gray-200 shadow-lg py-1 focus:outline-none">
                  {options.map((opt, i) => (
                    <Listbox.Option
                      key={i}
                      value={opt.value}
                      className={({ active }) =>
                        cn(
                          'cursor-pointer select-none relative px-3 py-1.5 text-sm flex items-center justify-between',
                          active ? 'bg-primary-50 text-primary-700' : 'text-gray-700',
                        )
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span>{opt.label}</span>
                          {(selected || isSel(opt.value)) && (
                            <Check className="h-4 w-4 text-primary-600" />
                          )}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </>
        )}
      </Listbox>
    </div>
  )
}
