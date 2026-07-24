import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getThumbUrl, getOriginalUrl } from '@/utils/image'

interface MarkdownRenderProps {
  // Markdown 内容
  content: string
}

// Markdown 渲染组件（支持 GitHub Flavored Markdown）
export default function MarkdownRender({ content }: MarkdownRenderProps) {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 链接在新标签页打开
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
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
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
