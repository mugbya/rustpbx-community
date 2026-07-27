import { cn } from './cn'

export interface PaginationProps {
  current: number
  total: number
  pageSize: number
  onChange?: (page: number) => void
  showTotal?: (total: number) => React.ReactNode
  className?: string
}

// 分页器
export function Pagination({
  current,
  total,
  pageSize,
  onChange,
  showTotal,
  className,
}: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  if (pageCount <= 1 && !showTotal) return null

  // 生成页码：当前页附近 5 个，加首尾和省略号
  const pages: (number | string)[] = []
  const add = (p: number | string) => pages.push(p)
  if (pageCount <= 7) {
    for (let i = 1; i <= pageCount; i++) add(i)
  } else {
    add(1)
    const left = Math.max(2, current - 2)
    const right = Math.min(pageCount - 1, current + 2)
    if (left > 2) add('...')
    for (let i = left; i <= right; i++) add(i)
    if (right < pageCount - 1) add('...')
    add(pageCount)
  }

  const btn =
    'min-w-[32px] h-8 px-1.5 inline-flex items-center justify-center rounded text-sm border cursor-pointer transition-colors'

  return (
    <div className={cn('flex items-center gap-2 flex-wrap text-sm', className)}>
      {showTotal && <span className="text-gray-500 mr-2">{showTotal(total)}</span>}
      <button
        className={cn(btn, 'border-gray-300', current === 1 && 'opacity-50 cursor-not-allowed')}
        disabled={current === 1}
        onClick={() => onChange?.(current - 1)}
      >
        ‹
      </button>
      {pages.map((p, i) =>
        typeof p === 'number' ? (
          <button
            key={i}
            className={cn(
              btn,
              p === current
                ? 'border-primary-600 bg-primary-600 text-white'
                : 'border-gray-300 hover:border-primary-600 hover:text-primary-600',
            )}
            onClick={() => onChange?.(p)}
          >
            {p}
          </button>
        ) : (
          <span key={i} className="px-1 text-gray-400">
            {p}
          </span>
        ),
      )}
      <button
        className={cn(
          btn,
          'border-gray-300',
          current === pageCount && 'opacity-50 cursor-not-allowed',
        )}
        disabled={current === pageCount}
        onClick={() => onChange?.(current + 1)}
      >
        ›
      </button>
    </div>
  )
}
