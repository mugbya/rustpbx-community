import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Bold, Italic, Heading, Code, Link as LinkIcon, Image as ImageIcon } from 'lucide-react'
import { uploadApi } from '@/api/forum'
import { communityApi } from '@/api/community'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Space } from '@/components/ui/Space'
import { Divider } from '@/components/ui/Divider'
import { FormItem } from '@/components/ui/FormItem'
import { Title } from '@/components/ui/Typography'
import { message } from '@/components/ui/MessageProvider'

interface FormValues {
  title: string
}

// 创建/编辑社区帖子页面
export default function CommunityCreate() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>()
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)

  const editorRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 编辑模式：从 URL 参数获取帖子 ID
  const editId = searchParams.get('id')
  const isEdit = !!editId

  // 编辑模式：加载帖子详情并填充表单
  useEffect(() => {
    if (!editId) return
    setLoading(true)
    communityApi
      .getPost(Number(editId))
      .then((data) => {
        setValue('title', data.title)
        setContent(data.content)
      })
      .catch(() => {
        message.error('加载帖子失败')
      })
      .finally(() => setLoading(false))
  }, [editId])

  // 在光标位置插入 Markdown 语法
  const insertMarkdown = (before: string, after = '', placeholder = '') => {
    const textarea = editorRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end) || placeholder
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end)
    setContent(newText)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length)
    }, 0)
  }

  // 在光标位置插入文本（无包裹）
  const insertText = (text: string) => {
    const textarea = editorRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const newText = content.substring(0, start) + text + content.substring(textarea.selectionEnd)
    setContent(newText)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + text.length, start + text.length)
    }, 0)
  }

  // 图片上传处理
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      message.error(`图片大小 ${(file.size / 1024 / 1024).toFixed(1)}MB 超过 5MB 限制`)
      e.target.value = ''
      return
    }

    setUploading(true)
    try {
      const { url } = await uploadApi.uploadImage(file)
      insertText(`![图片](${url})`)
      message.success('图片上传成功')
    } catch {
      // 错误已由拦截器处理
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  // 提交表单
  const onSubmit = async (values: FormValues) => {
    if (!content.trim()) {
      message.warning('请输入内容')
      return
    }
    setSubmitting(true)
    try {
      if (isEdit && editId) {
        await communityApi.updatePost(Number(editId), {
          title: values.title,
          content,
        })
        message.success('更新成功')
      } else {
        await communityApi.createPost({
          title: values.title,
          content,
        })
        message.success('发布成功')
      }
      navigate('/community')
    } catch {
      // 错误已由拦截器处理
    } finally {
      setSubmitting(false)
    }
  }

  // 工具栏按钮配置
  const toolbarButtons = [
    { icon: <Bold className="h-4 w-4" />, title: '加粗', onClick: () => insertMarkdown('**', '**', '粗体文本') },
    { icon: <Italic className="h-4 w-4" />, title: '斜体', onClick: () => insertMarkdown('*', '*', '斜体文本') },
    { icon: <Heading className="h-4 w-4" />, title: '标题', onClick: () => insertMarkdown('## ', '', '标题') },
    { icon: <Code className="h-4 w-4" />, title: '代码块', onClick: () => insertMarkdown('\n```\n', '\n```\n', '代码') },
    { icon: <LinkIcon className="h-4 w-4" />, title: '链接', onClick: () => insertMarkdown('[', '](https://)', '链接文本') },
  ]

  return (
    <Card>
      <Title level={3}>{isEdit ? '编辑帖子' : '发帖'}</Title>
      <Divider />

      <form onSubmit={handleSubmit(onSubmit)}>
        <FormItem label="标题" error={errors.title?.message} required>
          <Input
            placeholder="请输入标题"
            size="large"
            maxLength={100}
            disabled={loading}
            {...register('title', { required: '请输入标题' })}
          />
        </FormItem>

        {/* Markdown 编辑器 */}
        <FormItem label="内容">
          {/* 工具栏 */}
          <div className="mb-2 px-2 py-1 border border-gray-300 border-b-0 rounded-t-md bg-gray-50 inline-flex items-center gap-1">
            {toolbarButtons.map((btn) => (
              <Button
                key={btn.title}
                variant="text"
                size="small"
                title={btn.title}
                onClick={btn.onClick}
              >
                {btn.icon}
              </Button>
            ))}
            <Button
              variant="text"
              size="small"
              title="上传图片"
              loading={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
          </div>
          {/* 隐藏的文件选择输入 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <Textarea
            ref={editorRef as any}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            placeholder="请输入内容（支持 Markdown 格式）"
            className="rounded-t-none"
            disabled={loading}
          />
        </FormItem>

        <FormItem>
          <Space>
            <Button type="submit" variant="primary" loading={submitting}>
              {isEdit ? '保存修改' : '发布帖子'}
            </Button>
            <Button onClick={() => navigate('/community')}>取消</Button>
          </Space>
        </FormItem>
      </form>
    </Card>
  )
}
