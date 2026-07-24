import { type MessageInstance } from 'antd/es/message/interface'

// 全局 message 实例（由 App 组件通过 App.useApp() 设置）
let messageInstance: MessageInstance | null = null

export function setMessageInstance(instance: MessageInstance) {
  messageInstance = instance
}

export function getMessage(): MessageInstance | null {
  return messageInstance
}
