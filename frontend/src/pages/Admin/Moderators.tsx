import { useState, useEffect, useCallback } from 'react'
import { User as UserIcon, Search, Trash2 } from 'lucide-react'
import { type ColumnDef } from '@tanstack/react-table'
import { forumApi } from '@/api/forum'
import client from '@/api/client'
import type { Category } from '@/api/types'
import { Card } from '@/components/ui/Card'
import { Table } from '@/components/ui/Table'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Space } from '@/components/ui/Space'
import { Empty } from '@/components/ui/Empty'
import { Title } from '@/components/ui/Typography'
import { ConfirmButton } from '@/components/ui/ConfirmButton'
import { message } from '@/components/ui/MessageProvider'

// 分区选项
const TOPIC_TYPE_OPTIONS = [
  { label: '论坛', value: 'discussion' },
  { label: '问答', value: 'question' },
  { label: '文章', value: 'article' },
  { label: '资源', value: 'resource' },
]

interface Moderator {
  id: number
  user_id: number
  username: string
  avatar: string | null
  email: string
}

interface SearchResult {
  id: number
  username: string
  email: string
  avatar: string | null
}

export default function AdminModerators() {
  const [selectedType, setSelectedType] = useState<string | undefined>()
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>()
  const [moderators, setModerators] = useState<Moderator[]>([])
  const [loading, setLoading] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)

  // 选择分区后获取该分区的板块列表
  useEffect(() => {
    if (!selectedType) {
      setCategories([])
      setSelectedCategory(undefined)
      setModerators([])
      return
    }
    setSelectedCategory(undefined)
    setModerators([])
    forumApi.getCategories(selectedType).then(setCategories).catch(() => {})
  }, [selectedType])

  // 获取版主列表
  const fetchModerators = useCallback(() => {
    if (!selectedCategory) {
      setModerators([])
      return
    }
    setLoading(true)
    forumApi
      .getModerators(selectedCategory)
      .then(setModerators)
      .catch(() => setModerators([]))
      .finally(() => setLoading(false))
  }, [selectedCategory])

  useEffect(() => {
    fetchModerators()
  }, [fetchModerators])

  // 搜索用户
  const handleSearch = () => {
    if (!searchKeyword.trim()) return
    setSearching(true)
    client
      .get('/v1/users', { params: { keyword: searchKeyword, page: 1, page_size: 10 } })
      .then((data: any) => {
        // 过滤掉已经是版主的用户
        const existingIds = new Set(moderators.map((m) => m.user_id))
        setSearchResults(
          (data.items || []).filter((u: any) => !existingIds.has(u.id)),
        )
      })
      .catch(() => setSearchResults([]))
      .finally(() => setSearching(false))
  }

  // 添加版主
  const handleAdd = async (user: SearchResult) => {
    if (!selectedCategory) return
    try {
      await forumApi.addModerator(selectedCategory, user.id)
      message.success(`已将 ${user.username} 设为版主`)
      setSearchResults(searchResults.filter((u) => u.id !== user.id))
      fetchModerators()
    } catch {
      // 错误已由拦截器处理
    }
  }

  // 移除版主
  const handleRemove = async (userId: number) => {
    if (!selectedCategory) return
    try {
      await forumApi.removeModerator(selectedCategory, userId)
      message.success('已移除版主')
      fetchModerators()
    } catch {
      // 错误已由拦截器处理
    }
  }

  const moderatorColumns: ColumnDef<Moderator>[] = [
    {
      id: 'username',
      header: '版主',
      cell: ({ row }) => {
        const record = row.original
        return (
          <Space align="center">
            <Avatar src={record.avatar} icon={<UserIcon className="h-4 w-4" />} />
            <div>
              <div className="font-medium">{record.username}</div>
              <div className="text-xs text-gray-400">{record.email}</div>
            </div>
          </Space>
        )
      },
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => (
        <ConfirmButton
          title="确定要移除该版主吗？"
          okText="确定"
          variant="danger"
          onConfirm={() => handleRemove(row.original.user_id)}
        >
          <span className="inline-flex items-center text-red-500">
            <Trash2 className="h-3.5 w-3.5" />移除
          </span>
        </ConfirmButton>
      ),
    },
  ]

  const searchColumns: ColumnDef<SearchResult>[] = [
    {
      id: 'username',
      header: '用户',
      cell: ({ row }) => {
        const record = row.original
        return (
          <Space align="center">
            <Avatar size="small" src={record.avatar} icon={<UserIcon className="h-3.5 w-3.5" />} />
            <span>{record.username}</span>
            <span className="text-xs text-gray-400">{record.email}</span>
          </Space>
        )
      },
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => (
        <Button size="small" variant="link" onClick={() => handleAdd(row.original)}>
          设为版主
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Card>
        {/* 第一步：选择分区 */}
        <div className="mb-4 flex gap-3 items-center">
          <span>选择分区：</span>
          <Select
            placeholder="请选择分区"
            className="w-40"
            value={selectedType}
            onChange={(v) => {
              setSelectedType(v as string | undefined)
              setSearchResults([])
            }}
            options={TOPIC_TYPE_OPTIONS}
          />
        </div>

        {/* 第二步：选择板块 */}
        {selectedType && (
          <div className="mb-4 flex gap-3 items-center">
            <span>选择板块：</span>
            <Select
              placeholder="请选择板块"
              className="w-52"
              value={selectedCategory}
              onChange={(v) => {
                setSelectedCategory(v as number | undefined)
                setSearchResults([])
              }}
              options={categories.map((c) => ({ label: c.name, value: c.id }))}
            />
          </div>
        )}

        {selectedCategory ? (
          <>
            {/* 当前版主列表 */}
            <Title level={5} className="mb-3">当前版主</Title>
            <div className="mb-6">
              {moderators.length === 0 && !loading ? (
                <Empty description="暂无版主" />
              ) : (
                <Table
                  columns={moderatorColumns}
                  data={moderators}
                  rowKey="user_id"
                  loading={loading}
                />
              )}
            </div>

            {/* 搜索用户添加版主 */}
            <Title level={5} className="mb-3">添加版主</Title>
            <Space className="mb-4">
              <Input
                placeholder="搜索用户名或邮箱"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onPressEnter={handleSearch}
                className="w-60"
                prefix={<Search className="h-4 w-4" />}
                allowClear
              />
              <Button variant="primary" onClick={handleSearch} loading={searching}>
                搜索
              </Button>
            </Space>

            {searchResults.length > 0 && (
              <Table
                columns={searchColumns}
                data={searchResults}
                rowKey="id"
              />
            )}
          </>
        ) : (
          selectedType && <Empty description="请选择一个板块" />
        )}
        {!selectedType && <Empty description="请先选择一个分区" />}
      </Card>
    </div>
  )
}
