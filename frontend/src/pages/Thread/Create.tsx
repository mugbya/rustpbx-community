import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  Space,
  Typography,
  message,
  Divider,
  Spin,
} from 'antd'
import {
  BoldOutlined,
  ItalicOutlined,
  FontSizeOutlined,
  CodeOutlined,
  LinkOutlined,
  PictureOutlined,
} from '@ant-design/icons'
import { forumApi, uploadApi } from '@/api/forum'
import type { Category, ThreadType } from '@/api/types'

// 根据帖子类型获取页面标题
const titleMap: Record<ThreadType, string> = {
  discussion: '发帖',
  question: '提问',
  article: '写文章',
  resource: '上传资源',
}

// 根据帖子类型获取提交按钮文案
const submitTextMap: Record<ThreadType, string> = {
  discussion: '发布帖子',
  question: '发布问题',
  article: '发布文章',
  resource: '上传资源',
}

// 根据帖子类型获取列表页路径（提交成功后跳转）
const listPathMap: Record<ThreadType, string> = {
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

// 创建帖子页面（通用：发帖 / 提问 / 写文章 / 上传资源）
export default function ThreadCreate() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [form] = Form.useForm()
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 从 URL 参数获取帖子类型
  const typeParam = searchParams.get('type') as ThreadType | null
  const threadType: ThreadType = ['discussion', 'question', 'article', 'resource'].includes(
    typeParam ?? '',
  )
    ? (typeParam as ThreadType)
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
      .getThread(Number(editId))
      .then((data) => {
        form.setFieldsValue({
          title: data.title,
          category_id: data.category_id,
          tags: data.tags,
          resource_url: data.resource_url,
          resource_type: data.resource_type,
        })
        setContent(data.content)
      })
      .catch(() => {
        message.error('加载帖子失败')
      })
      .finally(() => setLoadingCategories(false))
  }, [editId])

  // 在光标位置插入 Markdown 语法
  const insertMarkdown = (before: string, after = '', placeholder = '') => {
    const textarea = editorRef.current?.querySelector('textarea')
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
    const textarea = editorRef.current?.querySelector('textarea')
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
  const handleSubmit = async (values: {
    title: string
    category_id?: number
    tags?: string[]
    resource_url?: string
    resource_type?: string
  }) => {
    if (!content.trim()) {
      message.warning('请输入内容')
      return
    }
    setSubmitting(true)
    try {
      if (isEdit && editId) {
        // 编辑模式：更新帖子
        await forumApi.updateThread(Number(editId), {
          title: values.title,
          content,
          tags: values.tags || [],
        })
        message.success('更新成功')
      } else {
        // 创建模式：新建帖子
        await forumApi.createThread({
          title: values.title,
          content,
          content_type: 'markdown',
          type: threadType,
          category_id: values.category_id,
          tags: values.tags || [],
          resource_url: threadType === 'resource' ? values.resource_url : undefined,
          resource_type: threadType === 'resource' ? values.resource_type : undefined,
        })
        message.success('发布成功')
      }
      // 提交后跳转到对应的列表页
      navigate(listPathMap[threadType])
    } catch {
      // 错误已由拦截器处理
    } finally {
      setSubmitting(false)
    }
  }

  // 工具栏按钮配置
  const toolbarButtons = [
    { icon: <BoldOutlined />, title: '加粗', onClick: () => insertMarkdown('**', '**', '粗体文本') },
    { icon: <ItalicOutlined />, title: '斜体', onClick: () => insertMarkdown('*', '*', '斜体文本') },
    { icon: <FontSizeOutlined />, title: '标题', onClick: () => insertMarkdown('## ', '', '标题') },
    { icon: <CodeOutlined />, title: '代码块', onClick: () => insertMarkdown('\n```\n', '\n```\n', '代码') },
    { icon: <LinkOutlined />, title: '链接', onClick: () => insertMarkdown('[', '](https://)', '链接文本') },
  ]

  return (
    <Card>
      <Typography.Title level={3}>{isEdit ? '编辑' : titleMap[threadType]}</Typography.Title>
      <Divider />

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="title"
          label="标题"
          rules={[{ required: true, message: '请输入标题' }]}
        >
          <Input placeholder="请输入标题" size="large" maxLength={100} showCount />
        </Form.Item>

        <Form.Item name="category_id" label="板块">
          {loadingCategories ? (
            <Spin size="small" />
          ) : (
            <Select
              placeholder="请选择板块（可选）"
              allowClear
              options={categories.map((c) => ({ label: c.name, value: c.id }))}
            />
          )}
        </Form.Item>

        <Form.Item name="tags" label="标签">
          <Select
            mode="tags"
            placeholder="输入标签后按回车，最多 5 个"
            maxCount={5}
            tokenSeparators={[',']}
          />
        </Form.Item>

        {/* 资源类型额外字段 */}
        {threadType === 'resource' && (
          <>
            <Form.Item
              name="resource_url"
              label="资源链接"
              rules={[{ required: true, message: '请输入资源链接' }]}
            >
              <Input placeholder="请输入资源下载链接" />
            </Form.Item>
            <Form.Item
              name="resource_type"
              label="资源类型"
              rules={[{ required: true, message: '请选择资源类型' }]}
            >
              <Select placeholder="请选择资源类型" options={resourceTypeOptions} />
            </Form.Item>
          </>
        )}

        {/* Markdown 编辑器 */}
        <Form.Item label="内容">
          {/* 工具栏 */}
          <Space
            style={{
              marginBottom: 8,
              padding: '4px 8px',
              border: '1px solid #d9d9d9',
              borderBottom: 'none',
              borderRadius: '6px 6px 0 0',
              background: '#fafafa',
            }}
          >
            {toolbarButtons.map((btn) => (
              <Button
                key={btn.title}
                type="text"
                size="small"
                icon={btn.icon}
                title={btn.title}
                onClick={btn.onClick}
              />
            ))}
            <Button
              type="text"
              size="small"
              icon={<PictureOutlined />}
              title="上传图片"
              loading={uploading}
              onClick={() => fileInputRef.current?.click()}
            />
          </Space>
          {/* 隐藏的文件选择输入 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageUpload}
          />
          <div ref={editorRef}>
            <Input.TextArea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              placeholder="请输入内容（支持 Markdown 格式）"
              style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
            />
          </div>
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {isEdit ? '保存修改' : submitTextMap[threadType]}
            </Button>
            <Button onClick={() => navigate(listPathMap[threadType])}>取消</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  )
}
