import { type ReactNode } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { cn } from './cn'
import { Button } from './Button'

export interface ModalProps {
  title?: ReactNode
  open: boolean
  onOk?: () => void
  onCancel?: () => void
  okText?: string
  cancelText?: string
  children?: ReactNode
  width?: number | string
  confirmLoading?: boolean
  className?: string
}

// 对话框
export function Modal({
  title,
  open,
  onOk,
  onCancel,
  okText = '确定',
  cancelText = '取消',
  children,
  width = 520,
  confirmLoading,
  className,
}: ModalProps) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={() => onCancel?.()} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/45" />
        </Transition.Child>
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel
              className={cn('w-full bg-white rounded-lg shadow-xl', className)}
              style={{ maxWidth: typeof width === 'number' ? `${width}px` : width }}
            >
              {title && (
                <div className="px-5 py-4 border-b border-gray-100 font-medium text-gray-800">
                  {title}
                </div>
              )}
              <div className="px-5 py-5">{children}</div>
              {(onOk || onCancel) && (
                <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
                  {onCancel && (
                    <Button onClick={onCancel}>{cancelText}</Button>
                  )}
                  {onOk && (
                    <Button variant="primary" loading={confirmLoading} onClick={onOk}>
                      {okText}
                    </Button>
                  )}
                </div>
              )}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}
