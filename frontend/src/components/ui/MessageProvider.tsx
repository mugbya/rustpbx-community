import { Toaster, toast } from 'sonner'
import { type ReactNode } from 'react'

// 全局 Toast 提示容器，挂在 App 顶层
export function MessageProvider({ children }: { children?: ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-center"
        richColors
        toastOptions={{
          style: {
            fontSize: '14px',
          },
        }}
      />
    </>
  )
}

// 兼容 antd message 的调用方式
export const message = {
  success: (content: ReactNode) => toast.success(content),
  error: (content: ReactNode) => toast.error(content),
  info: (content: ReactNode) => toast.info(content),
  warning: (content: ReactNode) => toast.warning(content),
  loading: (content: ReactNode) => toast.loading(content),
}
