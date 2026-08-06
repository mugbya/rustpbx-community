import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Bold, Italic, Heading, Code, Link as LinkIcon, Image as ImageIcon } from 'lucide-react'
import { forumApi, uploadApi } from '@/api/forum'
import type { Category, TopicType } from '@/api/types'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { TagInput } from '@/components/ui/TagInput'
import { Space } from '@/components/ui/Space'
import { Divider } from '@/components/ui/Divider'
import { Spin } from '@/components/ui/Spin'
import { FormItem } from '@/components/ui/FormItem'
import { Title } from '@/components/ui/Typography'
import { message } from '@/components/ui/MessageProvider'

// 根据帖子类型获取页面标题
const titleMap: Record<TopicType, string> = {
  discussion: '发帖',
  question: '提问',
  article: '写文章',
  resource: '上传资源',
}

// 根据帖子类型获取提交按钮文案
const submitTextMap: Record<TopicType, string> = {
  discussion: '发布帖子',
  question: '发布问题',
  article: '发布文章',
  resource: '上传资源',
}

// 根据帖子类型获取列表页路径（提交成功后跳转）
const listPathMap: Record<TopicType, string> = {
  discussion: '/forum',
  question: '/qa',
  article: '/articles',
  resource: '/resources',
}

// 资源类型选项
const resourceTypeOptions = [
  { label: '文件', value: 'file' },
  { label: '配置', value: 'config' },
  { label: '脚本', value: 'script' },
]

interface FormValues {
  title: string
  category_id?: number
  tags?: string[]
  resource_url?: string
  resource_type?: string
}

// 创建帖子页面（通用：发帖 / 提问 / 写文章 / 上传资源）
export default function TopicCreate() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { register, handleSubmit, watch, setValue, getValues, formState: { errors } } = useForm<FormValues>()
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)

  const editorRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const resourceFileRef = useRef<HTMLInputElement>(null)

  // 从 URL 参数获取帖子类型
  const typeParam = searchParams.get('type') as TopicType | null
  const topicType: TopicType = ['discussion', 'question', 'article', 'resource'].includes(
    typeParam ?? '',
  )
    ? (typeParam as TopicType)
    : 'discussion'

  // 编辑模式：从 URL 参数获取帖子 ID
  const editId = searchParams.get('id')
  const isEdit = !!editId

  // 获取板块分类列表
  useEffect(() => {
    setLoadingCategories(true)
    forumApi
      .getCategories()
      .then((data) => setCategories(data))
      .catch(() => {
        // 错误已由拦截器处理
      })
      .finally(() => setLoadingCategories(false))
  }, [])

  // 编辑模式：加载帖子详情并填充表单
  useEffect(() => {
    if (!editId) return
    setLoadingCategories(true)
    forumApi
      .getTopic(Number(editId))
      .then((data) => {
        setValue('title', data.title)
        setValue('category_id', data.category_id ?? undefined)
        setValue('tags', data.tags)
        setValue('resource_url', data.resource_url ?? undefined)
        setValue('resource_type', data.resource_type ?? undefined)
        setContent(data.content)
      })
      .catch(() => {
        message.error('加载帖子失败')
      })
      .finally(() => setLoadingCategories(false))
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
    // 延迟设置光标位置，确保内容已更新
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

    // 前端检查文件大小（5MB）
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

  // 资源文件上传处理
  const handleResourceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 获取当前选择的资源类型
    const resourceType = getValues('resource_type')
    if (!resourceType) {
      message.warning('请先选择资源类型')
      e.target.value = ''
      return
    }

    // 前端检查文件大小（5MB）
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      message.error(`文件大小 ${(file.size / 1024 / 1024).toFixed(1)}MB 超过 5MB 限制`)
      e.target.value = ''
      return
    }

    setUploadingFile(true)
    try {
      // 根据资源类型上传到不同目录
      const folder = `files/${resourceType}`
      const { url } = await uploadApi.uploadFile(file, folder)
      setValue('resource_url', url)
      message.success('文件上传成功')
    } catch {
      // 错误已由拦截器处理
    } finally {
      setUploadingFile(false)
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
        // 编辑模式：更新帖子
        await forumApi.updateTopic(Number(editId), {
          title: values.title,
          content,
          tags: values.tags || [],
        })
        message.success('更新成功')
      } else {
        // 创建模式：新建帖子
        await forumApi.createTopic({
          title: values.title,
          content,
          content_type: 'markdown',
          type: topicType,
          category_id: values.category_id,
          tags: values.tags || [],
          resource_url: topicType === 'resource' ? values.resource_url : undefined,
          resource_type: topicType === 'resource' ? values.resource_type : undefined,
        })
        message.success('发布成功')
      }
      // 提交后跳转到对应的列表页
      navigate(listPathMap[topicType])
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

  const watchResourceType = watch('resource_type')

  return (
    <Card>
      <Title level={3}>{isEdit ? '编辑' : titleMap[topicType]}</Title>
      <Divider />

      <form onSubmit={handleSubmit(onSubmit)}>
        <FormItem label="标题" error={errors.title?.message} required>
          <Input
            placeholder="请输入标题"
            size="large"
            maxLength={100}
            {...register('title', { required: '请输入标题' })}
          />
        </FormItem>

        <FormItem label="板块">
          {loadingCategories ? (
            <Spin size="small" />
          ) : (
            <Select
              placeholder="请选择板块（可选）"
              allowClear
              options={categories.map((c) => ({ label: c.name, value: c.id }))}
              value={watch('category_id')}
              onChange={(v) => setValue('category_id', v as number)}
            />
          )}
        </FormItem>

        <FormItem label="标签">
          <TagInput
            placeholder="输入标签后按回车，最多 5 个"
            maxCount={5}
            value={watch('tags') ?? []}
            onChange={(v) => setValue('tags', v)}
          />
        </FormItem>

        {/* 资源类型额外字段 */}
        {topicType === 'resource' && (
          <>
            <FormItem label="资源类型" error={errors.resource_type?.message} required>
              <Select
                placeholder="请选择资源类型"
                options={resourceTypeOptions}
                value={watchResourceType}
                onChange={(v) => setValue('resource_type', v as string)}
              />
            </FormItem>
            <FormItem label="资源链接" error={errors.resource_url?.message} required>
              <div className="relative">
                <Input
                  placeholder="请先选择资源类型，再上传文件或手动输入链接"
                  {...register('resource_url', { required: '请上传文件或输入资源链接' })}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-primary-600 text-sm cursor-pointer"
                  style={{ cursor: uploadingFile ? 'wait' : 'pointer' }}
                  onClick={() => !uploadingFile && resourceFileRef.current?.click()}
                >
                  {uploadingFile ? '上传中...' : '上传文件'}
                </button>
              </div>
            </FormItem>
            <input
              ref={resourceFileRef}
              type="file"
              className="hidden"
              onChange={handleResourceUpload}
            />
          </>
        )}

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
          />
        </FormItem>

        <FormItem>
          <Space>
            <Button type="submit" variant="primary" loading={submitting}>
              {isEdit ? '保存修改' : submitTextMap[topicType]}
            </Button>
            <Button onClick={() => navigate(listPathMap[topicType])}>取消</Button>
          </Space>
        </FormItem>
      </form>
    </Card>
  )
}
