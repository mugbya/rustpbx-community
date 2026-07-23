import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

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
          // 图片限制尺寸，防止溢出
          img: ({ src, alt }) => (
            <img
              src={typeof src === 'string' ? src : ''}
              alt={alt || ''}
              style={{
                maxWidth: '100%',
                maxHeight: '600px',
                objectFit: 'contain',
                borderRadius: '8px',
                margin: '8px 0',
              }}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
