// 全局 message 实例的桥接层。
// 供非组件代码（如 axios 拦截器）调用，避免直接耦合 antd / sonner 的实例。
import { message } from '@/components/ui/MessageProvider'

// 适配 antd 的 MessageInstance 接口
type MessageInstance = typeof message

let messageInstance: MessageInstance | null = null

export function setMessageInstance(instance: MessageInstance) {
  messageInstance = instance
}

export function getMessage(): MessageInstance {
  // 直接回退到模块级 message（sonner 的 toast 是命令式 API，无需组件上下文）
  return messageInstance ?? message
}
