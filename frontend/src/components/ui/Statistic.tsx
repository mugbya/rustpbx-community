import { type ReactNode } from 'react'

export interface StatisticProps {
  title?: ReactNode
  value?: ReactNode
  prefix?: ReactNode
}

// 统计数值
export function Statistic({ title, value, prefix }: StatisticProps) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-1">{title}</div>
      <div className="flex items-center gap-2 text-2xl font-semibold text-gray-800">
        {prefix}
        {value}
      </div>
    </div>
  )
}
