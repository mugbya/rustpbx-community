import { type ReactNode } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { cn } from './cn'

export interface DropdownItem {
  key: string
  label: ReactNode
  icon?: ReactNode
  onClick?: () => void
}

export interface DropdownProps {
  menu: { items: DropdownItem[]; onClick?: (key: string) => void }
  children: ReactNode
  placement?: 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight'
}

const placementClass = {
  bottomLeft: 'left-0 top-full mt-1',
  bottomRight: 'right-0 top-full mt-1',
  topLeft: 'left-0 bottom-full mb-1',
  topRight: 'right-0 bottom-full mb-1',
}

// 下拉菜单
export function Dropdown({ menu, children, placement = 'bottomLeft' }: DropdownProps) {
  return (
    <Menu as="div" className="relative inline-block">
      <Menu.Button as="div">{children}</Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <Menu.Items
          className={cn(
            'absolute z-40 min-w-[120px] bg-white rounded-md shadow-lg border border-gray-200 py-1 focus:outline-none origin-top-left',
            placementClass[placement],
          )}
        >
          {menu.items.map((item) => (
            <Menu.Item key={item.key}>
              {({ active }) => (
                <button
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left text-gray-700',
                    active && 'bg-gray-50 text-primary-600',
                  )}
                  onClick={() => item.onClick?.() ?? menu.onClick?.(item.key)}
                >
                  {item.icon && <span className="text-gray-400">{item.icon}</span>}
                  {item.label}
                </button>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
