import { type ReactNode } from 'react'

export interface ResultProps {
  status?: 'success' | 'error' | 'info' | 'warning' | '404' | '403' | '500'
  title?: ReactNode
  subTitle?: ReactNode
  extra?: ReactNode
}

const emojiMap = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
  warning: '⚠️',
  '404': '🔍',
  '403': '🔒',
  '500': '💥',
}

// 结果页
export function Result({ status = 'info', title, subTitle, extra }: ResultProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-6xl mb-4">{emojiMap[status]}</div>
      <div className="text-xl font-semibold text-gray-800 mb-2">{title}</div>
      <div className="text-sm text-gray-500 mb-6">{subTitle}</div>
      {extra}
    </div>
  )
}
