import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import { type ColumnDef } from '@tanstack/react-table'
import { forumApi } from '@/api/forum'
import type { Category } from '@/api/types'
import { Card } from '@/components/ui/Card'
import { Table } from '@/components/ui/Table'
import { Tag } from '@/components/ui/Tag'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Space } from '@/components/ui/Space'
import { Modal } from '@/components/ui/Modal'
import { InputNumber } from '@/components/ui/InputNumber'
import { FormItem } from '@/components/ui/FormItem'
import { ConfirmButton } from '@/components/ui/ConfirmButton'
import { message } from '@/components/ui/MessageProvider'

// 分区名称映射
const topicTypeMap: Record<string, string> = {
  discussion: '论坛',
  question: '问答',
  article: '文章',
  resource: '资源',
}

// 分区选项（多选用）
const topicTypeOptions = [
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
  topic_type?: string[]
  sort_order?: number
  is_active?: boolean
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null)
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<CategoryFormValues>()

  // 获取所有板块列表（不传 topic_type，获取全部）
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
    reset({ topic_type: [], sort_order: 0 })
    setModalOpen(true)
  }

  // 打开编辑弹窗
  const handleEdit = (record: AdminCategory) => {
    setEditingCategory(record)
    // 把逗号分隔的字符串转为数组
    const typeArray = record.topic_type ? record.topic_type.split(',') : []
    reset({
      name: record.name,
      slug: record.slug,
      description: record.description ?? undefined,
      topic_type: typeArray,
      sort_order: record.sort_order,
      is_active: record.is_active ?? true,
    })
    setModalOpen(true)
  }

  // 保存（新建/编辑）
  const onSubmit = async (values: CategoryFormValues) => {
    try {
      // 数组转为逗号分隔的字符串，空数组表示全部分区
      const topic_type = values.topic_type?.length
        ? values.topic_type.join(',')
        : undefined
      if (editingCategory) {
        // 编辑板块
        await forumApi.updateCategory(editingCategory.id, {
          name: values.name,
          description: values.description,
          topic_type,
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
          topic_type,
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

  const columns: ColumnDef<AdminCategory>[] = [
    { accessorKey: 'name', header: '板块名称' },
    {
      id: 'topic_type',
      header: '所属分区',
      cell: ({ row }) => {
        const topicType = row.original.topic_type
        if (!topicType) return <Tag color="default">全部分区</Tag>
        const types = topicType.split(',')
        return (
          <Space wrap size={[4, 4]}>
            {types.map((t) => (
              <Tag key={t} color="blue">{topicTypeMap[t] ?? t}</Tag>
            ))}
          </Space>
        )
      },
    },
    {
      id: 'description',
      header: '描述',
      cell: ({ row }) => row.original.description || '-',
    },
    { accessorKey: 'sort_order', header: '排序' },
    {
      id: 'is_active',
      header: '状态',
      cell: ({ row }) =>
        row.original.is_active === false ? <Tag color="red">禁用</Tag> : <Tag color="green">正常</Tag>,
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => {
        const record = row.original
        return (
          <Space>
            <Button size="small" onClick={() => handleEdit(record)}>
              编辑
            </Button>
            <ConfirmButton
              title="确定要删除该板块吗？"
              okText="确定"
              variant="danger"
              onConfirm={() => handleDelete(record.id)}
            >
              <span className="inline-flex items-center text-red-500">
                <Trash2 className="h-3.5 w-3.5" />删除
              </span>
            </ConfirmButton>
          </Space>
        )
      },
    },
  ]

  return (
    <Card>
      <div className="mb-4">
        <Button variant="primary" onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          新建板块
        </Button>
      </div>

      <Table
        columns={columns}
        data={categories}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={editingCategory ? '编辑板块' : '新建板块'}
        open={modalOpen}
        onOk={handleSubmit(onSubmit)}
        onCancel={() => setModalOpen(false)}
        okText="保存"
        cancelText="取消"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormItem label="名称" error={errors.name?.message} required>
            <Input placeholder="请输入板块名称" {...register('name', { required: '请输入板块名称' })} />
          </FormItem>
          <FormItem label="Slug" error={errors.slug?.message} required>
            <Input placeholder="请输入 Slug" disabled={!!editingCategory} {...register('slug', { required: '请输入 Slug' })} />
          </FormItem>
          <FormItem label="描述">
            <Textarea rows={3} placeholder="请输入描述" {...register('description')} />
          </FormItem>
          <FormItem label="所属分区（不选则属于全部分区）">
            <Select
              mode="multiple"
              placeholder="选择分区（可多选，不选为全部）"
              options={topicTypeOptions}
              allowClear
              value={watch('topic_type') ?? []}
              onChange={(v) => setValue('topic_type', v as string[])}
            />
          </FormItem>
          <FormItem label="排序">
            <InputNumber min={0} className="w-full" value={watch('sort_order')} onChange={(v) => setValue('sort_order', v)} />
          </FormItem>
          {editingCategory && (
            <FormItem label="状态">
              <Select
                options={[
                  { label: '正常', value: true },
                  { label: '禁用', value: false },
                ]}
                value={watch('is_active')}
                onChange={(v) => setValue('is_active', v as boolean)}
              />
            </FormItem>
          )}
        </form>
      </Modal>
    </Card>
  )
}
