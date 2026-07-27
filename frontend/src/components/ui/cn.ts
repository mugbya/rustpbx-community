// className 拼接工具：过滤 falsy 值后用空格连接
// 接受任意值，非字符串的 falsy 值会被过滤，真值统一转为字符串
export function cn(...classes: Array<unknown>): string {
  return classes.filter((c): c is string => typeof c === 'string' && c.length > 0).join(' ')
}
