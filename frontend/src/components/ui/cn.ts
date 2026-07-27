import { twMerge } from 'tailwind-merge'

// className 拼接工具：过滤 falsy 值后用空格连接，再用 twMerge 去重
// 后传入的 Tailwind 类会覆盖先传入的同类型类（如 w-60 覆盖 w-full）
// 接受任意值，非字符串的 falsy 值会被过滤，真值统一转为字符串
export function cn(...classes: Array<unknown>): string {
  const filtered = classes.filter((c): c is string => typeof c === 'string' && c.length > 0).join(' ')
  return twMerge(filtered)
}
