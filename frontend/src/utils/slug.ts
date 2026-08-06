/**
 * 标题锚点工具
 * 用于生成 markdown 标题的 slug（url 安全的锚点 id）及目录条目
 */

// 目录条目
export interface TocHeading {
  id: string
  text: string
  level: number // 1-4
}

/**
 * 将标题文本转成 url 安全的 slug
 * 使用 Unicode property escapes 保留中/日/韩等字母，行为接近 GitHub slug
 *
 * @param text 标题原文
 * @returns slug 字符串；空文本回退为 'heading'
 */
export function slugify(text: string): string {
  const slug = text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '') // 仅保留字母/数字/空格/连字符
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return slug || 'heading'
}
