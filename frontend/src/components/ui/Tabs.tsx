import { type ReactNode } from 'react'
import { Tab } from '@headlessui/react'
import { cn } from './cn'

export interface TabItem {
  key: string
  label: ReactNode
  children?: ReactNode
}

export interface TabsProps {
  activeKey: string
  onChange?: (key: string) => void
  items: TabItem[]
  className?: string
}

// 标签页
export function Tabs({ activeKey, onChange, items, className }: TabsProps) {
  const index = Math.max(0, items.findIndex((i) => i.key === activeKey))
  return (
    <Tab.Group
      selectedIndex={index}
      onChange={(i) => onChange?.(items[i].key)}
    >
      <Tab.List className={cn('flex gap-1 border-b border-gray-200', className)}>
        {items.map((item) => (
          <Tab
            key={item.key}
            className={({ selected }) =>
              cn(
                'px-4 py-2 text-sm -mb-px border-b-2 cursor-pointer outline-none transition-colors',
                selected
                  ? 'border-primary-600 text-primary-600 font-medium'
                  : 'border-transparent text-gray-600 hover:text-primary-600',
              )
            }
          >
            {item.label}
          </Tab>
        ))}
      </Tab.List>
      {/* Tabs 在本项目仅用作切换内容区，内容渲染由父组件根据 activeKey 控制，故不在此渲染 Panel */}
    </Tab.Group>
  )
}
