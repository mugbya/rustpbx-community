import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Card,
  Form,
  Input,
  Button,
  Space,
  Typography,
  message,
  Divider,
} from 'antd'
import {
  BoldOutlined,
  ItalicOutlined,
  FontSizeOutlined,
  CodeOutlined,
  LinkOutlined,
  PictureOutlined,
} from '@ant-design/icons'
import { uploadApi } from '@/api/forum'
import { communityApi } from '@/api/community'

// 创建/编辑社区帖子页面
export default function CommunityCreate() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [form] = Form.useForm()
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)

  const editorRef = useRef<HTMLDivElement>(null)
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
        form.setFieldsValue({ title: data.title })
        setContent(data.content)
      })
      .catch(() => {
        message.error('加载帖子失败')
      })
      .finally(() => setLoading(false))
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

  // 提交表单
  const handleSubmit = async (values: { title: string }) => {
    if (!content.trim()) {
      message.warning('请输入内容')
      return
    }
    setSubmitting(true)
    try {
      if (isEdit && editId) {
        // 编辑模式：更新帖子
        await communityApi.updatePost(Number(editId), {
          title: values.title,
          content,
        })
        message.success('更新成功')
      } else {
        // 创建模式：新建帖子
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
    { icon: <BoldOutlined />, title: '加粗', onClick: () => insertMarkdown('**', '**', '粗体文本') },
    { icon: <ItalicOutlined />, title: '斜体', onClick: () => insertMarkdown('*', '*', '斜体文本') },
    { icon: <FontSizeOutlined />, title: '标题', onClick: () => insertMarkdown('## ', '', '标题') },
    { icon: <CodeOutlined />, title: '代码块', onClick: () => insertMarkdown('\n```\n', '\n```\n', '代码') },
    { icon: <LinkOutlined />, title: '链接', onClick: () => insertMarkdown('[', '](https://)', '链接文本') },
  ]

  return (
    <Card>
      <Typography.Title level={3}>{isEdit ? '编辑帖子' : '发帖'}</Typography.Title>
      <Divider />

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="title"
          label="标题"
          rules={[{ required: true, message: '请输入标题' }]}
        >
          <Input placeholder="请输入标题" size="large" maxLength={100} showCount disabled={loading} />
        </Form.Item>

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
              disabled={loading}
            />
          </div>
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {isEdit ? '保存修改' : '发布帖子'}
            </Button>
            <Button onClick={() => navigate('/community')}>取消</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  )
}
