import { useState, useEffect } from 'react'
import { Highlight, themes } from 'prism-react-renderer'
import { Copy, Check } from 'lucide-react'
import { loadExtraLanguages } from './prismLanguages'

interface CodeBlockProps {
  // 代码文本
  code: string
  // 语言标识（如 js、rust），为空时按纯文本渲染
  language: string
}

// 代码块渲染：语法高亮 + 语言标签 + 复制按钮
export default function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  // 额外语言（java/php/ruby/docker/toml/ini）异步加载，
  // 加载完成后触发重渲染以应用高亮
  const [extraLoaded, setExtraLoaded] = useState(false)

  useEffect(() => {
    let active = true
    loadExtraLanguages().then(() => {
      if (active) setExtraLoaded(true)
    })
    return () => {
      active = false
    }
  }, [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 忽略复制失败（如浏览器不支持 clipboard API）
    }
  }

  return (
    <div className="code-block">
      {/* 头部：语言标签 + 复制按钮 */}
      <div className="code-block__header">
        <span>{language || 'text'}</span>
        <button onClick={handleCopy} className="code-block__copy">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? '已复制' : '复制'}
        </button>
      </div>
      {/* 高亮主体：vsDark 主题背景 #1e1e1e，与原 .markdown-body pre 一致。
          额外语言异步加载完成后，用 key 变化强制重新高亮一次。 */}
      <Highlight
        key={extraLoaded ? 'loaded' : 'init'}
        theme={themes.vsDark}
        code={code}
        language={language || 'text'}
      >
        {({ style, tokens, getLineProps, getTokenProps }) => (
          <pre style={style}>
            {tokens.map((line, i) => {
              const lineProps = getLineProps({ line })
              return (
                <div key={i} {...lineProps}>
                  {line.map((token, k) => (
                    <span key={k} {...getTokenProps({ token })} />
                  ))}
                </div>
              )
            })}
          </pre>
        )}
      </Highlight>
    </div>
  )
}
