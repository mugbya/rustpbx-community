import { useState, useEffect, useCallback } from 'react'
import { List } from 'lucide-react'
import { cn } from '@/components/ui/cn'
import type { TocHeading } from '@/utils/slug'

export interface TocProps {
  // 由正文渲染收集到的标题列表
  headings: TocHeading[]
  className?: string
}

// 按 level 计算缩进
const indentByLevel: Record<number, string> = {
  1: 'pl-0',
  2: 'pl-3',
  3: 'pl-6',
  4: 'pl-9',
}

// 文章目录导航：列出标题，点击跳转，滚动时高亮当前章节
export function Toc({ headings, className }: TocProps) {
  const [activeId, setActiveId] = useState<string>('')

  // 滚动观察：标题进入视口上部时判定为当前章节
  useEffect(() => {
    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        // 取最靠上、仍在视口内的可见标题
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: '0px 0px -70% 0px', threshold: 0 },
    )

    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null)

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [headings])

  // 点击跳转：立即高亮，平滑滚动到对应标题
  const handleClick = useCallback((id: string) => {
    setActiveId(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  if (headings.length < 2) return null

  return (
    <nav
      className={cn(
        'sticky top-20',
        'max-h-[calc(100vh-6rem)] overflow-y-auto',
        'border-l border-gray-100 pl-4',
        className,
      )}
    >
      <div className="flex items-center gap-1.5 py-2 text-sm font-medium text-gray-700">
        <List className="h-4 w-4" />
        目录
      </div>
      <ul className="space-y-0.5">
        {headings.map((h) => {
          const active = h.id === activeId
          return (
            <li key={h.id}>
              <button
                onClick={() => handleClick(h.id)}
                className={cn(
                  'block w-full text-left text-sm leading-relaxed py-1 truncate',
                  'border-l-2 -ml-4 pl-4 transition-colors',
                  indentByLevel[h.level] ?? 'pl-0',
                  active
                    ? 'border-primary-600 text-primary-600 font-medium'
                    : 'border-transparent text-gray-500 hover:text-primary-600',
                )}
                title={h.text}
              >
                {h.text}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
