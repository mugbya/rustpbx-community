import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getThumbUrl, getOriginalUrl } from '@/utils/image'
import { slugify, type TocHeading } from '@/utils/slug'

interface MarkdownRenderProps {
  // Markdown 内容
  content: string
  // 标题收集回调：渲染后回传所有标题（含锚点 id），用于生成目录
  onHeadings?: (headings: TocHeading[]) => void
}

// 从 ReactNode 提取纯文本（用于标题 slug 生成）
function nodeToText(node: React.ReactNode): string {
  if (node == null || node === false) return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(nodeToText).join('')
  if (typeof node === 'object' && 'props' in node) {
    return nodeToText((node as React.ReactElement).props?.children)
  }
  return ''
}

// Markdown 渲染组件（支持 GitHub Flavored Markdown）
export default function MarkdownRender({ content, onHeadings }: MarkdownRenderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  // slug 去重计数：每次渲染重置，保证相同内容生成稳定的 id
  const slugCountRef = useRef<Record<string, number>>({})
  slugCountRef.current = {}

  // 从已渲染的 DOM 读取标题回传给父组件生成目录。
  // 直接读 DOM 可保证目录条目与正文 id 完全一致，
  // 且不受 React StrictMode 重复调用 effect 的影响（DOM 元素唯一，不会累积）。
  useEffect(() => {
    if (!onHeadings || !containerRef.current) return
    const els = containerRef.current.querySelectorAll<HTMLElement>(
      'h1[id], h2[id], h3[id], h4[id]',
    )
    const headings: TocHeading[] = []
    els.forEach((el) => {
      const level = Number(el.tagName.substring(1))
      headings.push({ id: el.id, text: el.textContent || '', level })
    })
    onHeadings(headings)
  }, [content, onHeadings])

  // 生成去重 slug 并给标题注入锚点 id
  const makeHeading = (level: number) => ({ children }: { children?: React.ReactNode }) => {
    const text = nodeToText(children)
    const base = slugify(text)
    const count = slugCountRef.current[base] || 0
    slugCountRef.current[base] = count + 1
    const id = count === 0 ? base : `${base}-${count}`
    const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4'
    return (
      <Tag id={id} className="scroll-mt-24">
        {children}
      </Tag>
    )
  }

  return (
    <div className="markdown-body" ref={containerRef}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 链接在新标签页打开
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700"
            >
              {children}
            </a>
          ),
          // 图片：用缩略图显示，点击在新标签页打开原图
          img: ({ src, alt }) => {
            const srcUrl = typeof src === 'string' ? src : ''
            const thumbUrl = getThumbUrl(srcUrl, 'medium')
            return (
              <a
                href={getOriginalUrl(srcUrl)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={thumbUrl}
                  alt={alt || ''}
                  loading="lazy"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '600px',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    margin: '8px 0',
                    cursor: 'zoom-in',
                  }}
                />
              </a>
            )
          },
          // 标题：注入锚点 id，供目录跳转与滚动高亮
          h1: makeHeading(1),
          h2: makeHeading(2),
          h3: makeHeading(3),
          h4: makeHeading(4),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
