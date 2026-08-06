import { useState, useRef, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { cn } from './cn'

export interface TagInputProps {
  value?: string[]
  onChange?: (value: string[]) => void
  placeholder?: string
  maxCount?: number
  tokenSeparators?: string[]
  disabled?: boolean
  className?: string
}

// 标签输入框：输入文本后按回车/分隔符确认，支持去重、限流、删除
export function TagInput({
  value = [],
  onChange,
  placeholder = '请输入标签',
  maxCount = 5,
  tokenSeparators = [','],
  disabled,
  className,
}: TagInputProps) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const full = value.length >= maxCount

  const commit = (raw: string) => {
    const tag = raw.trim()
    if (!tag || value.includes(tag) || value.length >= maxCount) {
      setInput('')
      return
    }
    onChange?.([...value, tag])
    setInput('')
  }

  const remove = (tag: string) => {
    onChange?.(value.filter((t) => t !== tag))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled || full) return
    // 分隔符确认
    if (tokenSeparators.includes(e.key)) {
      e.preventDefault()
      commit(input)
      return
    }
    // 回车确认
    if (e.key === 'Enter') {
      e.preventDefault()
      commit(input)
      return
    }
    // 输入框为空时退格删除最后一个
    if (e.key === 'Backspace' && !input && value.length) {
      remove(value[value.length - 1])
    }
  }

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-1 w-full min-h-9 px-2 py-1 rounded border border-gray-300 bg-white text-sm text-gray-800',
        'focus-within:outline-none focus-within:border-primary-600 focus-within:ring-1 focus-within:ring-primary-600',
        'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
        className,
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-0.5 px-2 py-0.5 text-xs rounded border bg-blue-50 text-blue-600 border-blue-200 leading-5"
        >
          {tag}
          {!disabled && (
            <button
              type="button"
              className="text-blue-400 hover:text-blue-600 flex items-center"
              onClick={(e) => {
                e.stopPropagation()
                remove(tag)
              }}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}
      {!full && !disabled && (
        <input
          ref={inputRef}
          className="flex-1 min-w-[80px] h-7 bg-transparent outline-none placeholder:text-gray-400"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length ? '' : placeholder}
          disabled={disabled}
        />
      )}
    </div>
  )
}
