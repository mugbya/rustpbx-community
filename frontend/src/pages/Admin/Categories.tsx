import { useState, useEffect, useCallback } from 'react'
import {
  Card,
  Table,
  Tag,
  Button,
  Input,
  Select,
  Space,
  Modal,
  Form,
  InputNumber,
  message,
  Popconfirm,
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { forumApi } from '@/api/forum'
import type { Category } from '@/api/types'

// 分区名称映射
const threadTypeMap: Record<string, string> = {
  discussion: '论坛',
  question: '问答',
  article: '文章',
  resource: '资源',
}

// 分区选项（多选用）
const threadTypeOptions = [
  { label: '论坛', value: 'discussion' },
  { label: '问答', value: 'question' },
  { label: '文章', value: 'article' },
  { label: '资源', value: 'resource' },
]

// 管理后台板块类型（扩展 is_active 字段）
interface AdminCategory extends Category {
  is_active?: boolean
}

// 表单值类型
interface CategoryFormValues {
  name: string
  slug: string
  description?: string
  thread_type?: string[]
  sort_order?: number
  is_active?: boolean
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null)
  const [form] = Form.useForm<CategoryFormValues>()

  // 获取所有板块列表（不传 thread_type，获取全部）
  const fetchCategories = useCallback(() => {
    setLoading(true)
    forumApi
      .getCategories()
      .then((data) => setCategories(data as AdminCategory[]))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // 打开新建弹窗
  const handleCreate = () => {
    setEditingCategory(null)
    form.resetFields()
    form.setFieldsValue({ thread_type: [], sort_order: 0 })
    setModalOpen(true)
  }

  // 打开编辑弹窗
  const handleEdit = (record: AdminCategory) => {
    setEditingCategory(record)
    // 把逗号分隔的字符串转为数组
    const typeArray = record.thread_type ? record.thread_type.split(',') : []
    form.setFieldsValue({
      name: record.name,
      slug: record.slug,
      description: record.description ?? undefined,
      thread_type: typeArray,
      sort_order: record.sort_order,
      is_active: record.is_active ?? true,
    })
    setModalOpen(true)
  }

  // 保存（新建/编辑）
  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      // 数组转为逗号分隔的字符串，空数组表示全部分区
      const thread_type = values.thread_type?.length
        ? values.thread_type.join(',')
        : undefined
      if (editingCategory) {
        // 编辑板块
        await forumApi.updateCategory(editingCategory.id, {
          name: values.name,
          description: values.description,
          thread_type,
          sort_order: values.sort_order,
          is_active: values.is_active,
        })
        message.success('修改成功')
      } else {
        // 新建板块
        await forumApi.createCategory({
          name: values.name,
          slug: values.slug,
          description: values.description,
          thread_type,
          sort_order: values.sort_order,
        })
        message.success('创建成功')
      }
      setModalOpen(false)
      fetchCategories()
    } catch {
      // 校验错误或 API 错误已由拦截器处理
    }
  }

  // 删除板块（软删除）
  const handleDelete = async (id: number) => {
    try {
      await forumApi.deleteCategory(id)
      message.success('删除成功')
      fetchCategories()
    } catch {
      // 错误已由拦截器处理
    }
  }

  const columns: ColumnsType<AdminCategory> = [
    {
      title: '板块名称',
      dataIndex: 'name',
    },
    {
      title: '所属分区',
      dataIndex: 'thread_type',
      width: 200,
      render: (threadType: string | null) => {
        if (!threadType) return <Tag color="default">全部分区</Tag>
        const types = threadType.split(',')
        return (
          <Space wrap size={[4, 4]}>
            {types.map((t) => (
              <Tag key={t} color="blue">
                {threadTypeMap[t] ?? t}
              </Tag>
            ))}
          </Space>
        )
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
      render: (desc: string | null) => desc || '-',
    },
    {
      title: '排序',
      dataIndex: 'sort_order',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      width: 80,
      render: (active?: boolean) =>
        active === false ? (
          <Tag color="red">禁用</Tag>
        ) : (
          <Tag color="green">正常</Tag>
        ),
    },
    {
      title: '操作',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定要删除该板块吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建板块
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={categories}
        rowKey="id"
        loading={loading}
        pagination={false}
      />

      <Modal
        title={editingCategory ? '编辑板块' : '新建板块'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入板块名称' }]}
          >
            <Input placeholder="请输入板块名称" />
          </Form.Item>
          <Form.Item
            name="slug"
            label="Slug"
            rules={[{ required: true, message: '请输入 Slug' }]}
          >
            <Input placeholder="请输入 Slug" disabled={!!editingCategory} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="请输入描述" rows={3} />
          </Form.Item>
          <Form.Item
            name="thread_type"
            label="所属分区（不选则属于全部分区）"
          >
            <Select
              mode="multiple"
              placeholder="选择分区（可多选，不选为全部）"
              options={threadTypeOptions}
              allowClear
            />
          </Form.Item>
          <Form.Item name="sort_order" label="排序">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          {editingCategory && (
            <Form.Item name="is_active" label="状态">
              <Select
                options={[
                  { label: '正常', value: true },
                  { label: '禁用', value: false },
                ]}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </Card>
  )
}
