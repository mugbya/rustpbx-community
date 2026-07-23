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
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
